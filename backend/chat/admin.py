from django.contrib import admin
from .models import ChatRoom, Message, RoomMember


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'created_at', 'is_private']
    list_filter = ['is_private', 'created_at']
    search_fields = ['name', 'created_by__username']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['room', 'sender', 'content', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'sender__username']


@admin.register(RoomMember)
class RoomMemberAdmin(admin.ModelAdmin):
    list_display = ['room', 'user', 'joined_at']
    list_filter = ['joined_at']
