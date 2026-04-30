from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/', views.register_user, name='register'),
    path('auth/profile/', views.user_profile, name='profile'),
    path('rooms/', views.rooms_list, name='rooms'),
    path('rooms/my/', views.my_rooms, name='my_rooms'),
    path('rooms/<int:room_id>/', views.room_detail, name='room_detail'),
    path('rooms/<int:room_id>/join/', views.join_room, name='join_room'),
    path('rooms/<int:room_id>/messages/', views.room_messages, name='room_messages'),
]
