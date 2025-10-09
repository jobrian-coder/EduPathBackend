# EduPath Frontend-Backend Integration Guide

## 🎯 Overview

This guide explains how to integrate the React frontend with the Django REST Framework backend.

## 📋 Backend Feature Coverage: **90%+**

### ✅ Fully Implemented (Core Features)
1. **Authentication** - Register, Login, Logout, Profile Management
2. **Careers** - List, Detail, Compare, Search
3. **Courses & Universities** - List, Detail, Search, Eligibility Check
4. **Hubs (Forums)** - Posts, Comments, Voting, Threading
5. **Societies** - List, Detail, Search
6. **Bookmarks** - Create, List, Delete
7. **Global Search** - Search across all entities
8. **Permissions** - Role-based access (Contributor/Expert)

### ⚠️ Partially Implemented
- Email verification (requires SMTP setup)
- Password reset (requires email)
- Analytics tracking (deferred)

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

Backend will run at: `http://127.0.0.1:8000/`

### 2. Frontend Setup

```bash
cd edupath-frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development server
npm run dev
```

Frontend will run at: `http://localhost:5173/`

## 🔗 API Integration

### Using the API Service

The frontend includes a complete API service layer at `src/services/api.ts`:

```typescript
import api from '@/services/api';

// Authentication
const { user, token } = await api.auth.login({ email, password });
localStorage.setItem('edupath.auth.token', token);

// Careers
const careers = await api.careers.list({ category: 'Technology' });
const comparison = await api.careers.compare([id1, id2]);

// Courses
const courses = await api.courses.listCourses({ search: 'computer' });
const eligibility = await api.courses.checkEligibility(courseId, 45.5);

// Hubs
const posts = await api.hubs.listPosts({ hub: hubId });
await api.hubs.votePost(postId, 'upvote');

// Search
const results = await api.search.global('engineering', 'all');

// Bookmarks
await api.bookmarks.create('course', courseId);
const bookmarks = await api.bookmarks.list();
```

## 📝 Integration Examples

### Example 1: Auth Page Integration

Update `src/features/auth/pages/Auth.tsx`:

```typescript
import api from '../../../services/api';

async function onLoginSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!validateLogin()) return;
  setLoading(true);
  
  try {
    const { user, token } = await api.auth.login({ email: identifier, password });
    localStorage.setItem('edupath.auth.token', token);
    localStorage.setItem('edupath.user', JSON.stringify(user));
    // Redirect to dashboard
    window.location.href = '/';
  } catch (error) {
    setErrors({ general: error.message });
  } finally {
    setLoading(false);
  }
}

async function onSignupSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!validateSignup()) return;
  setLoading(true);
  
  try {
    const { user, token } = await api.auth.register({
      email,
      username: email.split('@')[0],
      password: spw,
      password_confirm: spw2,
      first_name: fullName.split(' ')[0],
      last_name: fullName.split(' ').slice(1).join(' '),
    });
    localStorage.setItem('edupath.auth.token', token);
    localStorage.setItem('edupath.user', JSON.stringify(user));
    window.location.href = '/';
  } catch (error) {
    setErrors({ general: error.message });
  } finally {
    setLoading(false);
  }
}
```

### Example 2: Course Compare Integration

Update `src/features/courses/pages/CourseCompare.tsx`:

```typescript
import { useEffect, useState } from 'react';
import api, { Career } from '../../../services/api';

export default function CourseCompare() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [c1, setC1] = useState<Career | null>(null);
  const [c2, setC2] = useState<Career | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCareers();
  }, []);

  async function loadCareers() {
    try {
      const { results } = await api.careers.list();
      setCareers(results);
    } catch (error) {
      console.error('Failed to load careers:', error);
    }
  }

  async function compareSelected() {
    if (!c1 || !c2) return;
    setLoading(true);
    try {
      const comparison = await api.careers.compare([c1.id, c2.id]);
      // Use comparison data
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  }

  // Rest of component...
}
```

### Example 3: Societies/Hubs Integration

Update `src/features/societies/pages/Societies.tsx`:

```typescript
import { useEffect, useState } from 'react';
import api, { Hub, Post } from '../../../services/api';

export default function Societies() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [hubsData, postsData] = await Promise.all([
        api.hubs.listHubs(),
        api.hubs.listPosts(),
      ]);
      setHubs(hubsData.results);
      setPosts(postsData.results);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async function handleVote(postId: string, type: 'upvote' | 'downvote') {
    try {
      const result = await api.hubs.votePost(postId, type);
      // Update post in state with new vote counts
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, upvotes: result.upvotes, downvotes: result.downvotes }
          : p
      ));
    } catch (error) {
      console.error('Vote failed:', error);
    }
  }

  // Rest of component...
}
```

## 🔐 Authentication Flow

### 1. Login/Register
```typescript
// Login
const { user, token } = await api.auth.login({ email, password });
localStorage.setItem('edupath.auth.token', token);

// Register
const { user, token } = await api.auth.register(data);
localStorage.setItem('edupath.auth.token', token);
```

### 2. Protected Routes
Create an auth context or hook:

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import api from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('edupath.auth.token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await api.auth.getProfile();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('edupath.auth.token');
    } finally {
      setLoading(false);
    }
  }

  return { user, loading, isAuthenticated: !!user };
}
```

### 3. Logout
```typescript
async function logout() {
  try {
    await api.auth.logout();
  } finally {
    localStorage.removeItem('edupath.auth.token');
    localStorage.removeItem('edupath.user');
    window.location.href = '/auth';
  }
}
```

## 📊 API Endpoints Reference

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/profile/me/` - Get profile
- `PUT /api/auth/profile/me/` - Update profile

### Careers
- `GET /api/careers/` - List careers
- `GET /api/careers/{id}/` - Get career
- `POST /api/careers/compare/` - Compare careers

### Courses
- `GET /api/courses/courses/` - List courses
- `GET /api/courses/courses/{id}/` - Get course
- `POST /api/courses/courses/{id}/check_eligibility/` - Check eligibility
- `GET /api/courses/universities/` - List universities

### Hubs
- `GET /api/hubs/hubs/` - List hubs
- `GET /api/hubs/posts/` - List posts
- `POST /api/hubs/posts/` - Create post
- `POST /api/hubs/posts/{id}/vote/` - Vote on post
- `POST /api/hubs/comments/` - Create comment

### Search
- `GET /api/search/?q=query&type=all` - Global search

### Bookmarks
- `GET /api/auth/profile/bookmarks/` - List bookmarks
- `POST /api/auth/profile/bookmarks/` - Create bookmark
- `DELETE /api/auth/profile/bookmarks/{id}/` - Delete bookmark

## 🧪 Testing the Integration

### 1. Test Authentication
```bash
# Register
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123",
    "password_confirm": "testpass123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
```

### 2. Test with Token
```bash
# Get profile
curl http://127.0.0.1:8000/api/auth/profile/me/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## 🎨 UI/UX Integration Tips

1. **Loading States**: Show spinners during API calls
2. **Error Handling**: Display user-friendly error messages
3. **Optimistic Updates**: Update UI immediately, rollback on error
4. **Caching**: Cache frequently accessed data
5. **Pagination**: Handle paginated responses from the API

## 📦 Next Steps

1. ✅ Backend is ready with 90%+ feature coverage
2. ✅ API service layer created
3. ⏳ Update frontend components to use API
4. ⏳ Add error boundaries and loading states
5. ⏳ Implement authentication context
6. ⏳ Add form validation with backend errors
7. ⏳ Test all integrations

## 🆘 Troubleshooting

### CORS Issues
If you see CORS errors, ensure backend `settings.py` has:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
]
```

### Authentication Errors
- Check token is stored correctly
- Verify token format: `Token <token-value>`
- Check token hasn't expired

### API Not Found
- Ensure backend is running on port 8000
- Check `.env` file has correct `VITE_API_URL`

## 📞 Support

For issues:
- Check API docs: http://127.0.0.1:8000/api/docs/
- Review Django logs
- Check browser console for errors
