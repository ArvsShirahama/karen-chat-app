import requests
import threading
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings

from .models import ChatRoom, Message, RoomMember
from .serializers import (
    ChatRoomSerializer, 
    ChatRoomDetailSerializer, 
    MessageSerializer, 
    UserSerializer
)


def supabase_request(table, data):
    """Send data to Supabase REST API (runs in background thread)"""
    def _sync():
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            return
        url = f"{settings.SUPABASE_URL}/rest/v1/{table}"
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        try:
            response = requests.post(url, json=data, headers=headers, timeout=5)
            response.raise_for_status()
        except Exception as e:
            print(f"Supabase sync error: {e}")
    
    thread = threading.Thread(target=_sync)
    thread.daemon = True
    thread.start()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=400)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)
    
    user = User.objects.create_user(username=username, email=email, password=password)
    
    # Also create user in Supabase for realtime features
    supabase_request('users', {
        'id': user.id,
        'username': username,
        'email': email or '',
        'created_at': user.date_joined.isoformat()
    })
    
    return Response(UserSerializer(user).data, status=201)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def rooms_list(request):
    if request.method == 'GET':
        rooms = ChatRoom.objects.filter(is_private=False)
        my_rooms = ChatRoom.objects.filter(members__user=request.user)
        all_rooms = (rooms | my_rooms).distinct()
        serializer = ChatRoomSerializer(all_rooms, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ChatRoomSerializer(data=request.data)
        if serializer.is_valid():
            room = serializer.save(created_by=request.user)
            RoomMember.objects.create(room=room, user=request.user)
            
            # Sync to Supabase for realtime
            supabase_request('chat_rooms', {
                'id': room.id,
                'name': room.name,
                'created_by': request.user.id,
                'created_at': room.created_at.isoformat(),
                'is_private': room.is_private
            })
            
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def room_detail(request, room_id):
    room = get_object_or_404(ChatRoom, id=room_id)
    
    if request.method == 'GET':
        serializer = ChatRoomDetailSerializer(room)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        if room.created_by != request.user:
            return Response({'error': 'Only creator can delete room'}, status=403)
        room.delete()
        return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_room(request, room_id):
    room = get_object_or_404(ChatRoom, id=room_id)
    
    if RoomMember.objects.filter(room=room, user=request.user).exists():
        return Response({'error': 'Already a member'}, status=400)
    
    RoomMember.objects.create(room=room, user=request.user)
    
    # Sync to Supabase
    member = RoomMember.objects.get(room=room, user=request.user)
    supabase_request('room_members', {
        'room_id': room.id,
        'user_id': request.user.id,
        'joined_at': member.joined_at.isoformat()
    })
    
    return Response({'status': 'joined'})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def room_messages(request, room_id):
    room = get_object_or_404(ChatRoom, id=room_id)
    
    if not RoomMember.objects.filter(room=room, user=request.user).exists() and room.created_by != request.user:
        return Response({'error': 'Not a member of this room'}, status=403)
    
    if request.method == 'GET':
        messages = Message.objects.filter(room=room).select_related('sender')[:100]
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message content required'}, status=400)
        
        message = Message.objects.create(
            room=room,
            sender=request.user,
            content=content
        )
        
        # Sync to Supabase for realtime
        supabase_request('messages', {
            'id': message.id,
            'room_id': room.id,
            'sender_id': request.user.id,
            'content': content,
            'created_at': message.created_at.isoformat(),
            'sender_username': request.user.username
        })
        
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_rooms(request):
    rooms = ChatRoom.objects.filter(members__user=request.user) | ChatRoom.objects.filter(created_by=request.user)
    rooms = rooms.distinct()
    serializer = ChatRoomSerializer(rooms, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    return Response(UserSerializer(request.user).data)
