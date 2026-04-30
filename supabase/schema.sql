-- Supabase Schema for Karen Chat App

-- Users table (synced from Django)
create table if not exists users (
    id bigint primary key,
    username text not null,
    email text,
    created_at timestamp with time zone default now()
);

-- Chat rooms table (synced from Django)
create table if not exists chat_rooms (
    id bigint primary key,
    name text not null,
    created_by bigint references users(id),
    created_at timestamp with time zone default now(),
    is_private boolean default false
);

-- Room members table (synced from Django)
create table if not exists room_members (
    id bigint generated always as identity primary key,
    room_id bigint references chat_rooms(id) on delete cascade,
    user_id bigint references users(id) on delete cascade,
    joined_at timestamp with time zone default now(),
    unique(room_id, user_id)
);

-- Messages table (synced from Django, with realtime)
create table if not exists messages (
    id bigint primary key,
    room_id bigint references chat_rooms(id) on delete cascade,
    sender_id bigint references users(id),
    content text not null,
    created_at timestamp with time zone default now(),
    sender_username text
);

-- Enable Row Level Security
alter table users enable row level security;
alter table chat_rooms enable row level security;
alter table room_members enable row level security;
alter table messages enable row level security;

-- Policies for public access (simplified for demo)
create policy "Allow all" on users for all using (true);
create policy "Allow all" on chat_rooms for all using (true);
create policy "Allow all" on room_members for all using (true);
create policy "Allow all" on messages for all using (true);

-- Realtime publication
alter publication supabase_realtime add table messages;
