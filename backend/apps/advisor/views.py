from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from .models import AdvisorSession, AdvisorMessage
from .serializers import (
    StartSessionResponseSerializer,
    MessageRequestSerializer,
    MessageResponseSerializer,
    RecommendationsResponseSerializer,
)
from .services.groq_service import GroqInterviewService
from .services.recommender import RecommenderService


class StartAdvisorView(APIView):
    """
    POST /api/advisor/start/
    Creates a new AdvisorSession and returns the first question.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            service = GroqInterviewService()
            result = service.start_session()
        except Exception as e:
            return Response(
                {"error": f"Failed to start advisor session: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Create session in DB
        session = AdvisorSession.objects.create(
            user=request.user if request.user.is_authenticated else None,
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

        # Fetch user's academic profile for eligibility filtering
        academic_profile = None
        if request.user.is_authenticated:
            from apps.authentication.models import AcademicProfile
            try:
                academic_profile = AcademicProfile.objects.get(user=request.user)
            except AcademicProfile.DoesNotExist:
                pass

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

        return Response(
            {
                "session_id": str(session.id),
                "profile_text": session.profile_text,
                "recommendations": recommendations,
                "academic_profile_used": academic_profile is not None,
            }
        )
