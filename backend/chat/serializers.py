from django.contrib.auth.models import User
from rest_framework import serializers
from .models import ChatRoom, Message, RoomMember


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class RoomMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = RoomMember
        fields = ['id', 'user', 'joined_at']


class ChatRoomSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'created_by', 'created_at', 'is_private', 'members_count']
    
    def get_members_count(self, obj):
        return obj.members.count()


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'content', 'created_at']
        read_only_fields = ['sender', 'created_at']


class ChatRoomDetailSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members = RoomMemberSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'created_by', 'created_at', 'is_private', 'members', 'messages']
