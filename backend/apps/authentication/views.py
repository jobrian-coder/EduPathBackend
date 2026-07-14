from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.db import models
import logging
from .models import AcademicProfile, UserInterest, Bookmark, Achievement, UserAchievement, UserActivity, PaymentTransaction, ClassroomOfferCode
from .serializers import (
    UserSerializer, UserRegistrationSerializer, AcademicProfileSerializer,
    UserInterestSerializer, BookmarkSerializer, AchievementSerializer,
    UserAchievementSerializer, UserActivitySerializer, AdminUserSerializer
)
from .permissions import IsAdmin
from .mpesa import MpesaClient

logger = logging.getLogger(__name__)


User = get_user_model()


class AuthViewSet(viewsets.GenericViewSet):
    """Authentication endpoints"""
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(request, username=email, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserProfileViewSet(viewsets.ModelViewSet):
    """User profile management"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        """Get or update current user profile"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def purchase_trial(self, request):
        """Initiate or complete purchase of an AI advisor trial credit"""
        payment_method = request.data.get('payment_method', 'mpesa')
        phone_number = request.data.get('phone_number')
        plan_type = request.data.get('plan_type', 'student')
        if plan_type not in ['student', 'class', 'school']:
            plan_type = 'student'
            
        prices_kes = {'student': 650, 'class': 6500, 'school': 26000}
        prices_usd = {'student': 5, 'class': 50, 'school': 200}
        
        user = request.user
        
        if payment_method == 'mpesa':
            if not phone_number:
                return Response({'error': 'Phone number is required for M-Pesa payments.'}, status=status.HTTP_400_BAD_REQUEST)
                
            amount_kes = prices_kes[plan_type]
            try:
                mpesa_client = MpesaClient()
                res = mpesa_client.initiate_stk_push(
                    phone_number=phone_number,
                    amount=amount_kes,
                    account_ref=f"EduPath {plan_type.capitalize()}",
                    transaction_desc=f"Payment for {plan_type.capitalize()} Plan"
                )
                
                checkout_request_id = res.get('CheckoutRequestID')
                merchant_request_id = res.get('MerchantRequestID')
                
                # Create a pending PaymentTransaction record
                PaymentTransaction.objects.create(
                    user=user,
                    gateway='mpesa',
                    amount=amount_kes,
                    currency='KES',
                    plan_type=plan_type,
                    status='pending',
                    checkout_request_id=checkout_request_id,
                    merchant_request_id=merchant_request_id,
                    phone_number=phone_number
                )
                
                return Response({
                    'status': 'pending',
                    'message': 'STK Push initiated. Please enter your M-Pesa PIN on your phone.',
                    'checkout_request_id': checkout_request_id,
                    'ai_trials_balance': user.ai_trials_balance
                })
            except Exception as e:
                logger.error(f"Failed to initiate M-Pesa push: {e}")
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # immediately succeed card/paypal for simulation/sandbox flow
            amount_usd = prices_usd[plan_type]
            txn = PaymentTransaction.objects.create(
                user=user,
                gateway=payment_method,
                amount=amount_usd,
                currency='USD',
                plan_type=plan_type,
                status='completed'
            )
            
            if plan_type == 'class':
                user.ai_trials_balance += 100
            elif plan_type == 'school':
                user.ai_trials_balance = 999999
            else:
                user.ai_trials_balance += 1
            user.save()
            
            desc = f"Purchased {plan_type.capitalize()} Plan using {payment_method.upper()} for ${amount_usd} USD."
            UserActivity.objects.create(
                user=user,
                activity_type='profile_updated',
                description=desc
            )
            
            return Response({
                'status': 'completed',
                'message': f'Payment successful and trials credited.',
                'ai_trials_balance': user.ai_trials_balance
            })

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], authentication_classes=[])
    def mpesa_callback(self, request):
        """Callback url called by Safaricom Daraja API"""
        logger.info(f"Received M-Pesa Callback: {request.data}")
        try:
            stk_callback = request.data.get('Body', {}).get('stkCallback', {})
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            
            try:
                txn = PaymentTransaction.objects.get(checkout_request_id=checkout_request_id)
            except PaymentTransaction.DoesNotExist:
                logger.error(f"Transaction not found for CheckoutRequestID: {checkout_request_id}")
                return Response({"status": "error", "message": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)
                
            if result_code == 0:
                # Payment successful
                txn.status = 'completed'
                txn.save()
                
                # Credit the user
                user = txn.user
                if txn.plan_type == 'class':
                    user.ai_trials_balance += 100
                elif txn.plan_type == 'school':
                    user.ai_trials_balance = 999999
                else:
                    user.ai_trials_balance += 1
                user.save()
                
                desc = f"M-Pesa payment of KES {txn.amount} verified for {txn.plan_type.capitalize()} plan."
                UserActivity.objects.create(
                    user=user,
                    activity_type='profile_updated',
                    description=desc
                )
                logger.info(f"Successfully processed payment callback for user {user.email}")
            else:
                # Payment failed
                txn.status = 'failed'
                txn.save()
                logger.warning(f"M-Pesa payment failed for checkout id {checkout_request_id}: {result_desc}")
                
            return Response({"ResultCode": 0, "ResultDesc": "Success"})
        except Exception as e:
            logger.error(f"Error handling M-Pesa callback: {e}")
            return Response({"ResultCode": 1, "ResultDesc": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def check_payment_status(self, request):
        """Check status of a pending payment transaction"""
        checkout_request_id = request.query_params.get('checkout_request_id')
        if not checkout_request_id:
            return Response({'error': 'checkout_request_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            txn = PaymentTransaction.objects.get(checkout_request_id=checkout_request_id, user=request.user)
        except PaymentTransaction.DoesNotExist:
            return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Simulator logic:
        # If the transaction is a mock transaction and is pending,
        # simulate a delay: if more than 3 seconds has passed since creation, mark it completed.
        if txn.status == 'pending' and checkout_request_id.startswith('mock_'):
            from datetime import datetime, timezone
            elapsed = (datetime.now(timezone.utc) - txn.created_at).total_seconds()
            if elapsed >= 3:
                txn.status = 'completed'
                txn.save()
                
                # Credit the user
                user = txn.user
                if txn.plan_type == 'class':
                    user.ai_trials_balance += 100
                elif txn.plan_type == 'school':
                    user.ai_trials_balance = 999999
                else:
                    user.ai_trials_balance += 1
                user.save()
                
                desc = f"Simulated M-Pesa payment of KES {txn.amount} verified for {txn.plan_type.capitalize()} plan."
                UserActivity.objects.create(
                    user=user,
                    activity_type='profile_updated',
                    description=desc
                )
                logger.info(f"Simulated success for user {user.email}")
                
        return Response({
            'checkout_request_id': txn.checkout_request_id,
            'status': txn.status,
            'plan_type': txn.plan_type,
            'amount': txn.amount,
            'ai_trials_balance': request.user.ai_trials_balance
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def generate_offer_codes(self, request):
        """Generate shareable classroom offer codes from user's AI trials balance"""
        count = request.data.get('count')
        try:
            count = int(count)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid count. Please specify an integer.'}, status=status.HTTP_400_BAD_REQUEST)

        if count <= 0:
            return Response({'error': 'Count must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.ai_trials_balance < count:
            return Response({'error': f'Insufficient token balance. You only have {user.ai_trials_balance} tokens remaining.'}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct from user balance
        user.ai_trials_balance -= count
        user.save()

        # Generate unique codes
        import random
        import string
        from django.utils import timezone
        
        generated_records = []
        for _ in range(count):
            suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            code_str = f"EDU-CLASS-{suffix}"
            
            while ClassroomOfferCode.objects.filter(code=code_str).exists():
                suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                code_str = f"EDU-CLASS-{suffix}"
                
            code_obj = ClassroomOfferCode.objects.create(
                code=code_str,
                creator=user,
                is_claimed=False
            )
            generated_records.append({
                'id': str(code_obj.id),
                'code': code_obj.code,
                'is_claimed': code_obj.is_claimed,
                'created_at': code_obj.created_at
            })

        desc = f"Generated {count} shareable classroom student offer codes."
        UserActivity.objects.create(
            user=user,
            activity_type='profile_updated',
            description=desc
        )

        return Response({
            'message': f'Successfully generated {count} offer codes.',
            'ai_trials_balance': user.ai_trials_balance,
            'codes': generated_records
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def list_offer_codes(self, request):
        """List all classroom offer codes created by the user"""
        codes = ClassroomOfferCode.objects.filter(creator=request.user)
        results = []
        for c in codes:
            results.append({
                'id': str(c.id),
                'code': c.code,
                'is_claimed': c.is_claimed,
                'claimed_by': c.claimed_by.username if c.claimed_by else None,
                'created_at': c.created_at,
                'claimed_at': c.claimed_at
            })
        return Response(results)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def redeem_offer_code(self, request):
        """Redeem a classroom student offer code for 1 AI trial credit"""
        code_str = request.data.get('code')
        if not code_str:
            return Response({'error': 'Offer code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        code_str = code_str.strip().upper()
        
        try:
            offer = ClassroomOfferCode.objects.get(code=code_str)
        except ClassroomOfferCode.DoesNotExist:
            return Response({'error': 'Invalid offer code. Please check and try again.'}, status=status.HTTP_404_NOT_FOUND)

        if offer.is_claimed:
            return Response({'error': 'This offer code has already been redeemed.'}, status=status.HTTP_400_BAD_REQUEST)

        if offer.creator == request.user:
            return Response({'error': 'You cannot redeem an offer code that you created yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils import timezone
        offer.is_claimed = True
        offer.claimed_by = request.user
        offer.claimed_at = timezone.now()
        offer.save()

        user = request.user
        user.ai_trials_balance += 1
        user.save()

        desc = f"Redeemed classroom offer code {offer.code} created by {offer.creator.username}."
        UserActivity.objects.create(
            user=user,
            activity_type='profile_updated',
            description=desc
        )

        return Response({
            'message': 'Offer code successfully redeemed! 1 Trial Token has been added to your account.',
            'ai_trials_balance': user.ai_trials_balance
        })

    
    @action(detail=False, methods=['get', 'post', 'put'])
    def academic_profile(self, request):
        """Manage academic profile"""
        try:
            profile = request.user.academic_profile
        except AcademicProfile.DoesNotExist:
            profile = None
        
        if request.method == 'GET':
            if not profile:
                # Return empty profile data instead of 404
                return Response({
                    'kcse_year': None,
                    'kcse_school': None,
                    'kcse_grades': {},
                    'kcse_mean_points': None,
                    'cluster_points': None,
                    'strengths': [],
                    'interests': [],
                    'career_goals': None,
                })
            serializer = AcademicProfileSerializer(profile)
            return Response(serializer.data)
        
        elif request.method in ['POST', 'PUT']:
            if profile:
                serializer = AcademicProfileSerializer(profile, data=request.data, partial=True)
            else:
                serializer = AcademicProfileSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'put'])
    def interests(self, request):
        """Manage user interests and hobbies"""
        interest, _ = UserInterest.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = UserInterestSerializer(interest)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = UserInterestSerializer(interest, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'post'])
    def bookmarks(self, request):
        """Manage bookmarks"""
        if request.method == 'GET':
            bookmarks = Bookmark.objects.filter(user=request.user)
            serializer = BookmarkSerializer(bookmarks, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = BookmarkSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'], url_path='bookmarks/(?P<bookmark_id>[^/.]+)')
    def delete_bookmark(self, request, bookmark_id=None):
        """Delete a bookmark"""
        try:
            bookmark = Bookmark.objects.get(id=bookmark_id, user=request.user)
            bookmark.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Bookmark.DoesNotExist:
            return Response({'detail': 'Bookmark not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def achievements(self, request):
        """Get user's achievements"""
        achievements = UserAchievement.objects.filter(user=request.user, is_displayed=True)
        serializer = UserAchievementSerializer(achievements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def activities(self, request):
        """Get user's activity feed"""
        activities = UserActivity.objects.filter(user=request.user)[:50]  # Last 50 activities
        serializer = UserActivitySerializer(activities, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get user analytics"""
        from django.db.models import Count, Q
        from apps.hubs.models import Post, Comment
        
        # Basic stats
        posts_count = Post.objects.filter(author=request.user).count()
        comments_count = Comment.objects.filter(author=request.user).count()
        upvotes_received = Post.objects.filter(author=request.user).aggregate(
            total_upvotes=models.Sum('upvotes')
        )['total_upvotes'] or 0
        
        # Recent activity (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_posts = Post.objects.filter(author=request.user, created_at__gte=thirty_days_ago).count()
        recent_comments = Comment.objects.filter(author=request.user, created_at__gte=thirty_days_ago).count()
        
        return Response({
            'total_posts': posts_count,
            'total_comments': comments_count,
            'upvotes_received': upvotes_received,
            'recent_posts': recent_posts,
            'recent_comments': recent_comments,
            'profile_completion': request.user.get_profile_completion_percentage(),
            'member_since': request.user.created_at,
        })


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for all users."""

    queryset = User.objects.all().order_by('-created_at')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'date_joined', 'email', 'username']

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        is_active = self.request.query_params.get('is_active')

        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search) |
                models.Q(username__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search)
            )

        if role:
            queryset = queryset.filter(role=role)

        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=(is_active == 'true'))

        return queryset
