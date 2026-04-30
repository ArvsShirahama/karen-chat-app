from django.contrib.auth.models import User
from django.db import models


class ChatRoom(models.Model):
    name = models.CharField(max_length=100)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    is_private = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'chat_rooms'
    
    def __str__(self):
        return self.name


class RoomMember(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'room_members'
        unique_together = ['room', 'user']


class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
