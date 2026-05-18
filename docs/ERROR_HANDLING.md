# EduPath Error Handling Guide

> Comprehensive documentation of error handling patterns, potential errors, and debugging strategies.

---

## Table of Contents

1. [Error Handling Architecture](#1-error-handling-architecture)
2. [Frontend Error Handling](#2-frontend-error-handling)
3. [Backend Error Handling](#3-backend-error-handling)
4. [Common Error Scenarios](#4-common-error-scenarios)
5. [Error Codes & Meanings](#5-error-codes--meanings)
6. [Debugging Guide](#6-debugging-guide)

---

## 1. Error Handling Architecture

### Overview
EduPath uses a **layered error handling** approach:

```
┌─────────────────────────────────────┐
│     Frontend (React)               │
│  - try/catch in async functions    │
│  - Error boundaries                │
│  - User-friendly messages          │
└──────────────┬────────────────────┘
               │
┌──────────────▼────────────────────┐
│     API Layer (Axios/Fetch)        │
│  - Request interceptors            │
│  - Response error parsing          │
│  - Token refresh logic             │
└──────────────┬────────────────────┘
               │
┌──────────────▼────────────────────┐
│     Backend (Django/DRF)           │
│  - Serializer validation         │
│  - Exception handling            │
│  - HTTP status codes             │
└─────────────────────────────────────┘
```

---

## 2. Frontend Error Handling

### Global API Error Handler

**Location**: `edupath-frontend/src/services/api.ts`

```typescript
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { includeAuth?: boolean } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getHeaders(options.includeAuth !== false),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Parse error response
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      console.error('API Error Response:', { url, status: response.status, error });
      
      // Throw with meaningful message
      throw new Error(
        error.detail || 
        error.message || 
        error.error || 
        JSON.stringify(error) || 
        'Request failed'
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', { url, error });
    throw error;
  }
}
```

**Key Features**:
- Automatic JSON error parsing
- Fallback error messages
- Detailed console logging with URL and status

---

### Component-Level Error Patterns

#### Pattern 1: Async Function with Error State
```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await api.someAction();
    setData(result);
  } catch (err: any) {
    console.error('Action failed:', err);
    setError(err?.message || 'Failed to perform action');
  } finally {
    setLoading(false);
  }
};

// UI rendering
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
    {error}
  </div>
)}
```

**Used in**: `AdvisorPage.tsx`, `Directory.tsx`, `AcademicProfile.tsx`

---

#### Pattern 2: Silent Error Swallowing (Anti-pattern)
```typescript
useEffect(() => {
  (async () => {
    try {
      const profile = await api.academic.getProfile();
      setProfile(profile);
    } catch (e) {
      // Silently fail - profile may not exist
      setProfile(null);
    }
  })();
}, []);
```

**Issue**: Cannot distinguish between:
- User has no profile (expected)
- Server error (unexpected)
- Network failure (unexpected)

**Better Approach**:
```typescript
catch (e: any) {
  if (e.status === 404) {
    setProfile(null); // Expected
  } else {
    console.error('Failed to load profile:', e);
    setError('Failed to load profile. Please refresh.');
  }
}
```

---

#### Pattern 3: Alert-based Error Display
```typescript
const handleStartSession = async () => {
  try {
    const res = await api.advisor.startSession();
    setSessionId(res.session_id);
  } catch (err) {
    console.error(err);
    alert('Failed to start advisor session.');  // ⚠️ Poor UX
  }
};
```

**Issue**: `alert()` blocks UI thread and is jarring to users.

**Better**: Use toast notifications or inline error display.

---

### Error Boundary Implementation

**Current State**: ❌ Not implemented

**Recommended**:
```typescript
class EduPathErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
    console.error('Error Boundary caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 3. Backend Error Handling

### DRF Exception Handling

**Location**: Various view files in `backend/apps/`

#### Pattern 1: Service Unavailable (503)
Used when external API (Groq) fails:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class StartAdvisorView(APIView):
    def post(self, request):
        try:
            service = GroqInterviewService()
            result = service.start_session()
        except Exception as e:
            return Response(
                {"error": f"Failed to start advisor session: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
```

**Issue**: Exposes internal error message to client.

**Fix**:
```python
import logging

logger = logging.getLogger(__name__)

try:
    result = service.start_session()
except Exception as e:
    logger.error(f"Groq API error: {str(e)}")  # Log internally
    return Response(
        {"error": "AI service temporarily unavailable. Please try again."},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )
```

---

#### Pattern 2: Validation Error (400)
Serializer-based validation:

```python
serializer = MessageRequestSerializer(data=request.data)
if not serializer.is_valid():
    return Response(
        serializer.errors, 
        status=status.HTTP_400_BAD_REQUEST
    )
```

**Response format**:
```json
{
  "content": ["This field is required."],
  "email": ["Enter a valid email address."]
}
```

---

#### Pattern 3: Not Found (404)
Using `get_object_or_404`:

```python
from django.shortcuts import get_object_or_404

session = get_object_or_404(AdvisorSession, pk=pk)
# Automatically returns 404 with {"detail": "Not found."}
```

**Custom 404 message**:
```python
from django.core.exceptions import ObjectDoesNotExist

try:
    bookmark = Bookmark.objects.get(id=bookmark_id, user=request.user)
except Bookmark.DoesNotExist:
    return Response(
        {'detail': 'Bookmark not found'},
        status=status.HTTP_404_NOT_FOUND
    )
```

---

#### Pattern 4: Unauthorized (401)
Authentication required:

```python
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

class UserProfileViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

---

### Global Exception Handler

**Current State**: ❌ Not implemented (uses DRF defaults)

**Recommended** (`backend/config/exceptions.py`):
```python
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call DRF's default handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Add error code for frontend handling
        response.data['error_code'] = response.status_code
        
        # Standardize error format
        if 'detail' in response.data:
            response.data['message'] = response.data.pop('detail')
    
    return response
```

**Settings** (`backend/config/settings.py`):
```python
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'config.exceptions.custom_exception_handler',
}
```

---

## 4. Common Error Scenarios

### Frontend Errors

#### 1. Network Errors (Failed to fetch)
**Cause**: Backend not running, CORS issue, network disconnected

**Symptoms**:
```
TypeError: Failed to fetch
Error: NetworkError when attempting to fetch resource
```

**Solutions**:
- Check Django server is running: `python manage.py runserver`
- Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
- Check network connection

---

#### 2. Authentication Errors (401)
**Cause**: No token, expired token, invalid token

**Symptoms**:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Solutions**:
```typescript
// Check token exists
const token = localStorage.getItem('edupath.auth.token');
if (!token) {
  navigate('/auth');
  return;
}

// Handle 401 in API layer
if (response.status === 401) {
  localStorage.removeItem('edupath.auth.token');
  window.location.href = '/auth';
}
```

---

#### 3. Validation Errors (400)
**Cause**: Invalid form data, missing required fields

**Symptoms**:
```json
{
  "email": ["This field is required."],
  "password": ["Password must be at least 8 characters."]
}
```

**Solutions**:
```typescript
// Display field-level errors
try {
  await api.auth.register(data);
} catch (err: any) {
  if (err.errors) {
    // Field-specific errors
    setFieldErrors(err.errors);
  } else {
    // General error
    setError(err.message);
  }
}
```

---

#### 4. State Update Errors
**Cause**: Setting state on unmounted component

**Symptoms**:
```
Warning: Can't perform a React state update on an unmounted component
```

**Solutions**:
```typescript
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const result = await api.getData();
    if (isMounted) {
      setData(result);
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;
  };
}, []);
```

---

### Backend Errors

#### 1. Database Connection Errors
**Cause**: SQLite locked, connection pool exhausted

**Symptoms**:
```
django.db.utils.OperationalError: database is locked
```

**Solutions**:
- Use PostgreSQL in production instead of SQLite
- Increase timeout: `timeout=20` in DATABASES config
- Check for unclosed transactions

---

#### 2. Groq API Errors
**Cause**: Rate limit, invalid API key, service down

**Symptoms**:
```python
Exception: Groq API error: 429 Too Many Requests
Exception: Groq API error: 401 Unauthorized
```

**Solutions** (`backend/apps/advisor/services/groq_service.py`):
```python
import time
from functools import wraps

def retry_on_error(max_retries=3, delay=1):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    if '429' in str(e):  # Rate limit
                        time.sleep(delay * (attempt + 1))
                    else:
                        raise
        return wrapper
    return decorator

@retry_on_error(max_retries=3)
def call_groq_api(self, messages):
    return self.client.chat.completions.create(...)
```

---

#### 3. ChromaDB Errors
**Cause**: Vector DB not initialized, corrupted data

**Symptoms**:
```python
Exception: No collection found with name 'courses'
chromadb.errors.NoIndexException: Index not found
```

**Solutions**:
```python
try:
    collection = self.client.get_collection(name='courses')
except Exception:
    # Collection doesn't exist, create it
    collection = self.client.create_collection(name='courses')
```

---

#### 4. Import/Module Errors
**Cause**: Circular imports, missing dependencies

**Symptoms**:
```
ImportError: cannot import name 'X' from partially initialized module
ModuleNotFoundError: No module named 'groq'
```

**Solutions**:
- Check `requirements.txt` is up to date
- Use absolute imports
- Break circular dependencies with late imports

---

## 5. Error Codes & Meanings

### HTTP Status Codes Used

| Code | Meaning | Common Causes |
|------|---------|---------------|
| **200** | OK | Successful GET/PUT |
| **201** | Created | Successful POST |
| **204** | No Content | Successful DELETE |
| **400** | Bad Request | Invalid data, validation errors |
| **401** | Unauthorized | Missing/invalid token |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Object doesn't exist |
| **500** | Internal Server Error | Unhandled exception |
| **503** | Service Unavailable | Groq API down |

### Custom Error Codes (Recommended)

Add for better frontend handling:

```python
ERROR_CODES = {
    'AUTH_TOKEN_EXPIRED': 'AUTH_001',
    'AUTH_INVALID_CREDENTIALS': 'AUTH_002',
    'PROFILE_INCOMPLETE': 'PROFILE_001',
    'GROQ_RATE_LIMIT': 'AI_001',
    'GROQ_SERVICE_DOWN': 'AI_002',
    'COURSE_NOT_FOUND': 'COURSE_001',
    'HUB_NOT_FOUND': 'HUB_001',
}
```

---

## 6. Debugging Guide

### Frontend Debugging

#### Enable React DevTools
1. Install browser extension
2. Inspect component hierarchy
3. Check props and state

#### Network Tab Debugging
```
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for red (failed) requests
4. Check:
   - Status code
   - Request headers (Auth token present?)
   - Response body (error message)
   - Timing (timeout issues)
```

#### Console Logging Strategy
```typescript
// Structured logging
const DEBUG = import.meta.env.DEV;

const log = {
  info: (msg: string, data?: any) => {
    if (DEBUG) console.log(`[INFO] ${msg}`, data);
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error);
    // Send to error tracking in production
  },
  api: (endpoint: string, status: number, data?: any) => {
    if (DEBUG) console.log(`[API] ${endpoint} → ${status}`, data);
  }
};

// Usage
log.api('/advisor/start', 201, response);
log.error('Failed to load profile', error);
```

---

### Backend Debugging

#### Django Debug Mode
```python
# settings.py
DEBUG = True  # Shows detailed error pages

# Add to views
import logging
logger = logging.getLogger(__name__)

def my_view(request):
    logger.debug(f"Request data: {request.data}")
    logger.info(f"User {request.user} accessed endpoint")
    logger.error("Something went wrong", exc_info=True)
```

#### Django Shell Debugging
```bash
python manage.py shell

# Debug queries
from apps.advisor.models import AdvisorSession
session = AdvisorSession.objects.first()
print(session.message_history)

# Check permissions
from apps.authentication.models import User
user = User.objects.first()
print(user.role)
print(user.get_all_permissions())
```

#### Database Query Debugging
```python
# settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

---

### Log File Analysis

#### Backend Logs
```bash
# Django development server logs
python manage.py runserver 2>&1 | tee django.log

# Search for errors
grep -i "error\|exception" django.log

# Follow live logs
tail -f django.log
```

#### Frontend Build Logs
```bash
# Vite build errors
npm run build 2>&1 | tee build.log

# TypeScript errors
npx tsc --noEmit 2>&1 | tee typescript.log
```

---

## Error Handling Checklist

### For New Features

- [ ] Add try/catch around all async operations
- [ ] Set loading and error states
- [ ] Display user-friendly error messages
- [ ] Log errors for debugging
- [ ] Handle network failures gracefully
- [ ] Handle authentication errors (401)
- [ ] Add retry logic for transient failures
- [ ] Test error scenarios manually

### Backend API Endpoints

- [ ] Use appropriate HTTP status codes
- [ ] Validate all input data
- [ ] Return structured error responses
- [ ] Handle database errors
- [ ] Handle external API errors (Groq)
- [ ] Log errors with context
- [ ] Don't expose sensitive info in errors
- [ ] Add rate limiting where needed

---

## Quick Reference: Error Fixes

### Fix: "Failed to fetch"
```bash
# Backend not running
cd backend
python manage.py runserver

# CORS issue - add to settings.py
CORS_ALLOWED_ORIGINS.append('http://localhost:5173')
```

### Fix: "Authentication credentials were not provided"
```typescript
// Check localStorage
const token = localStorage.getItem('edupath.auth.token');
if (!token) {
  window.location.href = '/auth';
}

// Check header format
headers: {
  'Authorization': `Token ${token}`  // Note: 'Token' not 'Bearer'
}
```

### Fix: "database is locked" (SQLite)
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,  # Increase timeout
        },
    }
}
```

### Fix: Groq API rate limit
```python
# Add exponential backoff
import time

def call_with_backoff(func, max_retries=3):
    for i in range(max_retries):
        try:
            return func()
        except Exception as e:
            if '429' in str(e) and i < max_retries - 1:
                time.sleep(2 ** i)  # 1s, 2s, 4s
            else:
                raise
```
