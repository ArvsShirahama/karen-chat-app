# Karen Chat App

A simple mobile-first chat application built with React (PWA), Django REST API, and Supabase for realtime messaging.

## Tech Stack

- **Frontend**: React (PWA for mobile)
- **Backend**: Django + Django REST Framework
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (Simple JWT)
- **Realtime**: Supabase Realtime subscriptions

## Project Structure

```
karen-chat-app/
├── backend/              # Django REST API
│   ├── chat/            # Chat app (models, views, serializers)
│   ├── chatapp/         # Django project settings
│   ├── requirements.txt
│   └── .env.example
├── frontend/            # React PWA
│   ├── public/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API & Supabase client
│   │   └── App.js
│   └── package.json
└── supabase/
    └── schema.sql       # Database schema
```

## Setup Instructions

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → New query
3. Copy contents from `supabase/schema.sql` and run
4. Copy your project URL and anon key from Settings → API

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp public/.env.example .env
# Edit .env with your API and Supabase credentials

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key-here
DEBUG=True
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your-anon-key
```

## Features

- User registration and JWT authentication
- Create and join chat rooms
- Real-time messaging via Supabase
- Mobile-first responsive design (PWA)
- Message persistence

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/register/ | POST | Register new user |
| /api/token/ | POST | Login (get JWT) |
| /api/token/refresh/ | POST | Refresh JWT |
| /api/auth/profile/ | GET | Get current user |
| /api/rooms/ | GET, POST | List/create rooms |
| /api/rooms/my/ | GET | List my rooms |
| /api/rooms/{id}/ | GET, DELETE | Room details/delete |
| /api/rooms/{id}/join/ | POST | Join a room |
| /api/rooms/{id}/messages/ | GET, POST | Room messages |

## Production Deployment

1. Set `DEBUG=False` in backend
2. Use PostgreSQL database (already using Supabase)
3. Configure CORS for your domain
4. Build frontend: `npm run build`
5. Deploy to your preferred hosting (Vercel, Netlify, Heroku, etc.)
