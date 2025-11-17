from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login endpoint that accepts email + password and returns JWT token.

    POST /auth/login
    Body: {"email": "user@example.com", "password": "password"}
    Returns: {"access_token": "...", "refresh_token": "..."}
    """
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Find user by email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Authenticate user
    user = authenticate(username=user.username, password=password)

    if user is not None:
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
        }, status=status.HTTP_200_OK)
    else:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout endpoint (token invalidation would happen on frontend).

    POST /auth/logout
    Headers: Authorization: Bearer <token>
    """
    return Response(
        {"message": "Successfully logged out"},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Get current user info from JWT token.

    GET /auth/me
    Headers: Authorization: Bearer <token>
    Returns: {"id": 1, "email": "user@example.com", "username": "user"}
    """
    user = request.user

    return Response({
        "id": user.id,
        "email": user.email,
        "username": user.username,
    }, status=status.HTTP_200_OK)
