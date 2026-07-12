from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from .models import AdvisorSession, AdvisorMessage
from apps.chatbot.models import ChatConversation, ChatMessage
from .serializers import (
    StartSessionResponseSerializer,
    MessageRequestSerializer,
    MessageResponseSerializer,
    RecommendationsResponseSerializer,
)
from .services.groq_service import GroqInterviewService
from .services.recommender import RecommenderService
from .services.chat_service import ChatService


class StartAdvisorView(APIView):
    """
    POST /api/advisor/start/
    Creates a new AdvisorSession and returns the first question.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Please log in or create an account to claim your free trial."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            
        if request.user.ai_trials_balance <= 0:
            return Response(
                {"error": "No trial credits remaining. Please purchase a trial token to proceed."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
            
        try:
            service = GroqInterviewService()
            result = service.start_session()
        except Exception as e:
            return Response(
                {"error": f"Failed to start advisor session: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Decrement credit balance
        request.user.ai_trials_balance -= 1
        request.user.save()

        # Create session in DB
        session = AdvisorSession.objects.create(
            user=request.user,
            status='interviewing',
            question_count=0,
            message_history=[],
        )

        # Persist the assistant's first question
        AdvisorMessage.objects.create(
            session=session,
            role='assistant',
            content=result["question"],
        )
        # Store in rolling history (raw json so groq still sees it precisely as it came back)
        session.message_history = [{"role": "assistant", "content": result.get("assistant_message", result["question"])}]
        session.question_count = 1
        session.save()

        return Response(
            {
                "session_id": str(session.id),
                "question": result["question"],
                "options": result.get("options", []),
                "question_number": 1,
                "done": False,
            },
            status=status.HTTP_201_CREATED,
        )


class AdvisorMessageView(APIView):
    """
    POST /api/advisor/<session_id>/message/
    Accept the student's answer, return the next question or completion signal.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        session = get_object_or_404(
            AdvisorSession, pk=pk
        )

        if session.status == 'complete':
            return Response(
                {"error": "This session is already complete. Fetch recommendations instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MessageRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        student_answer = serializer.validated_data["content"]

        # Persist student message
        AdvisorMessage.objects.create(
            session=session, role='user', content=student_answer
        )

        try:
            service = GroqInterviewService()
            result = service.next_turn(
                message_history=session.message_history,
                student_answer=student_answer,
                question_count=session.question_count,
            )
        except Exception as e:
            return Response(
                {"error": f"Groq API error: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Update rolling history
        history = session.message_history
        history.append({"role": "user", "content": student_answer})
        assistant_msg = result.get("assistant_message", result.get("question") or "")
        if assistant_msg:
            history.append({"role": "assistant", "content": assistant_msg})
            AdvisorMessage.objects.create(
                session=session, role='assistant', content=assistant_msg
            )

        session.message_history = history
        session.question_count = result["question_number"]

        if result["done"]:
            session.status = 'complete'
            session.profile_text = result.get("profile", "")

        session.save()

        return Response(
            {
                "question": result.get("question"),
                "options": result.get("options", []),
                "question_number": result["question_number"],
                "done": result["done"],
                "profile": result.get("profile"),
            }
        )


class RecommendationsView(APIView):
    """
    GET /api/advisor/<session_id>/recommendations/
    Runs Stage-2 RAG pipeline and returns top-5 course recommendations.
    Session must be complete (10 questions answered).
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        session = get_object_or_404(
            AdvisorSession, pk=pk
        )

        if session.status != 'complete':
            return Response(
                {
                    "error": "Interview not yet complete.",
                    "questions_answered": session.question_count,
                    "questions_remaining": max(0, 10 - session.question_count),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not session.profile_text:
            return Response(
                {"error": "No student profile found. Please complete the interview first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Return cached result if already computed ────────────────────────
        if session.cached_recommendations:
            cached = session.cached_recommendations
            return Response({
                "session_id": str(session.id),
                "profile_text": session.profile_text,
                "recommendations": cached.get("recommendations", []),
                "suggested_hubs": cached.get("suggested_hubs", []),
                "academic_profile_used": cached.get("academic_profile_used", False),
            })

        # ── Fetch academic profile once ───────────────────────────────────────
        academic_profile = None
        if request.user.is_authenticated:
            from apps.authentication.models import AcademicProfile
            try:
                academic_profile = AcademicProfile.objects.get(user=request.user)
            except AcademicProfile.DoesNotExist:
                pass

        # ── Run recommendation pipeline ───────────────────────────────────────
        try:
            recommender = RecommenderService()
            recommendations = recommender.recommend(
                profile_text=session.profile_text,
                academic_profile=academic_profile
            )
        except Exception as e:
            return Response(
                {"error": f"Recommendation engine error: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Attach up to 2 Associates per recommendation from its related_hub
        recommendations = self._attach_associates(recommendations)

        # Get 2 hub recommendations based on the courses
        suggested_hubs = self._get_suggested_hubs(recommendations)

        # ── Persist to cache so next call is instant ──────────────────────────
        cache_payload = {
            "recommendations": recommendations,
            "suggested_hubs": suggested_hubs,
            "academic_profile_used": academic_profile is not None,
        }
        session.cached_recommendations = cache_payload
        session.save(update_fields=["cached_recommendations"])

        return Response({
            "session_id": str(session.id),
            "profile_text": session.profile_text,
            "recommendations": recommendations,
            "suggested_hubs": suggested_hubs,
            "academic_profile_used": academic_profile is not None,
        })

    def _attach_associates(self, recommendations: list) -> list:
        """
        Attach up to 2 Associates per recommendation.
        Uses 2 batched queries total instead of 2 × N queries.
        """
        from apps.associates.models import Associate
        from apps.hubs.models import CareerHub

        categories = list({
            rec.get('hub_category', '').lower()
            for rec in recommendations
            if rec.get('hub_category')
        })
        if not categories:
            for rec in recommendations:
                rec['associates'] = []
            return recommendations

        # 1 query: resolve all needed hubs at once
        from django.db.models import Q
        q = Q()
        for cat in categories:
            q |= Q(category__iexact=cat)
        hub_map: dict = {h.category.lower(): h for h in CareerHub.objects.filter(q)}

        if not hub_map:
            for rec in recommendations:
                rec['associates'] = []
            return recommendations

        hub_ids = [h.id for h in hub_map.values()]

        # 1 query: fetch all relevant associates across all hubs
        associates_qs = Associate.objects.filter(
            hub_id__in=hub_ids,
            is_verified=True,
            is_suspended=False,
            associate_type__in=['MENTOR', 'SOCIETY'],
        ).only('id', 'name', 'associate_type', 'bio', 'profile_image', 'hub_id')

        # Build hub_id → [associate, ...] map
        from collections import defaultdict
        hub_associates: dict = defaultdict(list)
        for a in associates_qs:
            hub_associates[a.hub_id].append(a)

        for rec in recommendations:
            cat = rec.get('hub_category', '').lower()
            hub = hub_map.get(cat)
            rec['associates'] = []
            if not hub:
                continue
            pool = hub_associates.get(hub.id, [])
            mentors = [a for a in pool if a.associate_type == 'MENTOR']
            societies = [a for a in pool if a.associate_type == 'SOCIETY']
            selected = (mentors + societies)[:2]
            rec['associates'] = [
                {
                    'id': a.id,
                    'name': a.name,
                    'associate_type': a.associate_type,
                    'bio': a.bio[:200] if a.bio else '',
                    'profile_image': a.profile_image,
                }
                for a in selected
            ]

        return recommendations
    
    def _get_suggested_hubs(self, recommendations: list) -> list:
        """
        Suggest 2 hubs — single batched query instead of one query per category.
        """
        from apps.hubs.models import CareerHub
        from collections import Counter
        from django.db.models import Q

        hub_categories = [
            rec.get('hub_category', '') for rec in recommendations if rec.get('hub_category')
        ]
        if not hub_categories:
            return []

        top_categories = [cat for cat, _ in Counter(hub_categories).most_common(2)]

        # Build OR filter for all top categories in one query
        q = Q()
        for cat in top_categories:
            q |= Q(category__iexact=cat)
        hubs = {h.category.lower(): h for h in CareerHub.objects.filter(q)}

        suggested_hubs = []
        for cat in top_categories:
            hub = hubs.get(cat.lower())
            if hub:
                suggested_hubs.append({
                    'id': str(hub.id),
                    'name': hub.name,
                    'slug': hub.slug,
                    'icon': hub.icon,
                    'color': hub.color,
                    'category': hub.category,
                    'member_count': hub.member_count,
                    'description': (
                        f"Join the {hub.name} community to connect with "
                        f"students and professionals in {hub.category}."
                    ),
                })

        return suggested_hubs


class ChatStartView(APIView):
    """
    POST /api/advisor/chat/start/
    Start a new AI advisor chat conversation.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Please log in or create an account to claim your free trial."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            
        if request.user.ai_trials_balance <= 0:
            return Response(
                {"error": "No trial credits remaining. Please purchase a trial token to proceed."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
            
        # Decrement credit balance
        request.user.ai_trials_balance -= 1
        request.user.save()

        conversation = ChatConversation.objects.create(
            user=request.user,
            context_type='advisor',  # Mark as advisor chat
            title='New Chat'
        )
        
        return Response({
            "conversation_id": str(conversation.id),
            "title": conversation.title,
            "messages": []
        })


class ChatMessageView(APIView):
    """
    POST /api/advisor/chat/<conversation_id>/message/
    Send a message and get AI response.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, pk):
        conversation = get_object_or_404(ChatConversation, pk=pk)
        
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response(
                {"error": "Message cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save user message
        ChatMessage.objects.create(
            conversation=conversation,
            sender_type='user',
            content=user_message
        )
        
        # Build conversation history for AI
        messages = conversation.messages.order_by('created_at')
        conversation_history = [
            {"role": msg.sender_type if msg.sender_type == 'user' else 'assistant', "content": msg.content}
            for msg in messages
        ]
        
        # Build user context
        user_context = {}
        if request.user.is_authenticated:
            from apps.authentication.models import AcademicProfile
            try:
                profile = AcademicProfile.objects.get(user=request.user)
                user_context['kcse_mean_points'] = profile.kcse_mean_points
            except AcademicProfile.DoesNotExist:
                pass
        
        # Get AI response
        try:
            chat_service = ChatService()
            ai_response = chat_service.chat(
                user_message=user_message,
                conversation_history=conversation_history[:-1],  # Exclude the just-added user message
                user_context=user_context
            )
        except Exception as e:
            return Response(
                {"error": f"AI service error: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Save AI response
        ChatMessage.objects.create(
            conversation=conversation,
            sender_type='assistant',
            content=ai_response
        )
        
        # Generate title from first message if still default
        if conversation.title == "New Chat" and conversation.messages.count() == 2:
            try:
                conversation.title = chat_service.generate_title(user_message)
                conversation.save()
            except:
                pass
        
        # Get all messages for response
        all_messages = [
            {"role": msg.sender_type if msg.sender_type == 'user' else 'assistant', "content": msg.content, "created_at": msg.created_at.isoformat()}
            for msg in conversation.messages.order_by('created_at')
        ]
        
        return Response({
            "conversation_id": str(conversation.id),
            "title": conversation.title,
            "message": ai_response,
            "messages": all_messages
        })


class ChatHistoryView(APIView):
    """
    GET /api/advisor/chat/history/
    Get user's AI advisor chat conversation history.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"conversations": []})
        
        conversations = ChatConversation.objects.filter(
            user=request.user,
            context_type='advisor'
        ).order_by('-updated_at')[:20]
        
        return Response({
            "conversations": [
                {
                    "id": str(conv.id),
                    "title": conv.title,
                    "message_count": conv.messages.count(),
                    "last_updated": conv.updated_at.isoformat(),
                    "created_at": conv.created_at.isoformat()
                }
                for conv in conversations
            ]
        })


class ChatDetailView(APIView):
    """
    GET /api/advisor/chat/<conversation_id>/
    Get a specific conversation with all messages.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        conversation = get_object_or_404(ChatConversation, pk=pk, context_type='advisor')
        
        messages = [
            {"role": msg.sender_type if msg.sender_type == 'user' else 'assistant', "content": msg.content, "created_at": msg.created_at.isoformat()}
            for msg in conversation.messages.order_by('created_at')
        ]
        
        return Response({
            "conversation_id": str(conversation.id),
            "title": conversation.title,
            "messages": messages,
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat()
        })
