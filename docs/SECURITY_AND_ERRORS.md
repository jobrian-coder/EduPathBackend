# EduPath Security System & Error Handling Guide

> Comprehensive documentation of authentication, authorization, security vulnerabilities, and error handling patterns.

---

## Table of Contents

1. [Authentication System](#1-authentication-system)
2. [Authorization &amp; Permissions](#2-authorization--permissions)
3. [Security Vulnerabilities &amp; Risks](#3-security-vulnerabilities--risks)
4. [Error Handling Patterns](#4-error-handling-patterns)
5. [Common Errors &amp; Solutions](#5-common-errors--solutions)
6. [Security Best Practices Checklist](#6-security-best-practices-checklist)

---

## 1. Authentication System

### Overview

EduPath uses a **dual authentication** approach:

1. **DRF Token Authentication** (primary)
2. **JWT Authentication** (configured but secondary)

### Token Authentication Flow

```
Frontend                    Backend
--------                    -------
POST /auth/login/
{email, password}
         →
                            Authenticate user
                            Create/Get Token
         ←
                            {user, token}

Store token in localStorage

All subsequent requests:
Authorization: Token <token_key>
```

### Implementation Details

**Backend** (`backend/apps/authentication/views.py:26`):

```python
def login(self, request):
    email = request.data.get('email')
    password = request.data.get('password')
  
    user = authenticate(request, username=email, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })
    return Response(
        {'error': 'Invalid credentials'}, 
        status=status.HTTP_401_UNAUTHORIZED
    )
```

**Frontend** (`edupath-frontend/src/services/api.ts`):

```typescript
const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('edupath.auth.token')
}

// Request with auth header
const headers = {
  'Content-Type': 'application/json',
  ...(includeAuth !== false && {
    'Authorization': `Token ${getAuthToken()}`
  }),
}
```

### Token Lifecycle

| Event                  | Action                | Code Location            |
| ---------------------- | --------------------- | ------------------------ |
| **Login**        | Create/Retrieve token | `AuthViewSet.login()`  |
| **Logout**       | Delete token          | `AuthViewSet.logout()` |
| **Token Expiry** | ❌ Not implemented    | -                        |
| **Refresh**      | ❌ Not implemented    | -                        |

⚠️ **CRITICAL**: Tokens never expire. Compromised token = permanent access until user logs out.

---

### JWT Configuration (Present but unused)

`backend/config/settings.py:162-167`:

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

JWT is configured in `REST_FRAMEWORK` but frontend uses Token auth. This is a **configuration debt**.

---

## 2. Authorization & Permissions

### Permission Classes Hierarchy

| Permission Class              | Access Level                        | Used In                        |
| ----------------------------- | ----------------------------------- | ------------------------------ |
| `AllowAny`                  | No restrictions                     | Advisor endpoints (anon users) |
| `IsAuthenticated`           | Logged-in users only                | Profile, bookmarks, logout     |
| `IsAuthenticatedOrReadOnly` | Read: anyone, Write: logged-in      | Default for all endpoints      |
| `IsOwnerOrReadOnly`         | Object owner can modify             | User profiles                  |
| `IsAuthorOrReadOnly`        | Content author can modify           | Posts, comments                |
| `IsContributorOrReadOnly`   | contributor/expert roles can create | Hub posts                      |
| `IsExpertOrReadOnly`        | expert role only                    | Admin features                 |

### Role-Based Access Control (RBAC)

**User Roles** (`backend/apps/authentication/models.py`):

```python
ROLE_CHOICES = [
    ('novice', 'Novice'),
    ('contributor', 'Contributor'),
    ('expert', 'Expert'),
]
```

**Permission Enforcement** (`backend/apps/authentication/permissions.py`):

```python
class IsContributorOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True  # Anyone can read
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['contributor', 'expert']
```

### Endpoint Permission Matrix

| Endpoint                               | Permission                    | Anonymous Access |
| -------------------------------------- | ----------------------------- | ---------------- |
| `POST /auth/register/`               | `AllowAny`                  | ✅ Yes           |
| `POST /auth/login/`                  | `AllowAny`                  | ✅ Yes           |
| `POST /auth/logout/`                 | `IsAuthenticated`           | ❌ No            |
| `GET /auth/profile/me/`              | `IsAuthenticated`           | ❌ No            |
| `POST /advisor/start/`               | `AllowAny`                  | ✅ Yes           |
| `POST /advisor/<id>/message/`        | `AllowAny`                  | ✅ Yes           |
| `GET /advisor/<id>/recommendations/` | `AllowAny`                  | ✅ Yes           |
| `POST /hubs/<id>/join/`              | `IsAuthenticated`           | ❌ No            |
| `POST /posts/` (create)              | `IsAuthenticated`           | ❌ No            |
| `PUT /posts/<id>/`                   | `IsAuthorOrReadOnly`        | ❌ No            |
| `GET /courses/`                      | `IsAuthenticatedOrReadOnly` | ✅ Yes           |

⚠️ **SECURITY ISSUE**: Advisor endpoints are fully open (`AllowAny`). This allows:

- Unlimited anonymous usage (cost risk for Groq API)
- Session spam/flooding
- No rate limiting

---

## 3. Security Vulnerabilities & Risks

### 🔴 Critical Issues

#### 1. No Rate Limiting

**Risk**: API abuse, DDoS, excessive Groq API costs
**Affected**: All endpoints, especially advisor (10 questions = 10 API calls)
**Mitigation**: Add Django Ratelimit or Nginx rate limiting

```python
# Suggested fix
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='10/m', method='POST')
def post(self, request):
    ...
```

#### 2. Tokens Never Expire

**Risk**: Compromised token = permanent access
**Mitigation**: Implement token expiry (30 days) + refresh mechanism

#### 3. Groq API Key Exposure Risk

**Risk**: Key in environment, if leaked = unlimited API usage
**Current** (`backend/config/settings.py:177`):

```python
GROQ_API_KEY = config('GROQ_API_KEY', default='')
```

**Mitigation**:

- Add request signing
- Monitor usage daily
- Set up billing alerts

#### 4. CORS Too Permissive (Development)

**Risk**: CSRF attacks in production
**Current** (`backend/config/settings.py:151-154`):

```python
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",  # Any localhost port
    r"^http://127\.0\.0\.1:\d+$",
]
```

**Production Fix**:

```python
CORS_ALLOWED_ORIGINS = [
    'https://edupath.co.ke',
    'https://app.edupath.co.ke',
]
```

#### 5. No Input Sanitization on AI Prompts

**Risk**: Prompt injection attacks
**Current** (`backend/apps/advisor/views.py:88-106`):

```python
student_answer = serializer.validated_data["content"]
# Directly passed to Groq without sanitization
result = service.next_turn(
    message_history=session.message_history,
    student_answer=student_answer,  # ⚠️ Unsanitized
)
```

**Mitigation**: Strip special characters, limit length (1000 chars max)

---

### 🟡 Medium Issues

#### 6. SQL Injection (Low Risk)

Django ORM protects against SQL injection, but raw queries in aggregations need review.

#### 7. No Request Logging

Cannot trace attacks or debug security incidents.

#### 8. Profile Data Exposure

Academic profiles (KCSE grades) are sensitive but no encryption at rest.

#### 9. No HTTPS Enforcement

`SECURE_SSL_REDIRECT` not set in settings.

---

### 🟢 Low Priority

#### 10. Debug Mode in Production

`DEBUG = config('DEBUG', default=True, cast=bool)`
Risk: Stack traces leak code structure to attackers.

---

## 4. Error Handling Patterns

### Backend Error Handling

#### Pattern 1: Try-Except with Service Unavailable

Used in AI endpoints when external API fails:

```python
try:
    service = GroqInterviewService()
    result = service.start_session()
except Exception as e:
    return Response(
        {"error": f"Failed to start advisor session: {str(e)}"},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )
```

**Issue**: Exposes internal error details to client (information leakage).

**Better**:

```python
except Exception as e:
    logger.error(f"Groq API error: {str(e)}")  # Log internally
    return Response(
        {"error": "Service temporarily unavailable. Please try again."},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )
```

#### Pattern 2: Serializer Validation

Standard DRF pattern:

```python
serializer = MessageRequestSerializer(data=request.data)
if not serializer.is_valid():
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

Returns field-level errors:

```json
{
  "content": ["This field is required."]
}
```

#### Pattern 3: get_object_or_404

Clean 404 handling:

```python
session = get_object_or_404(AdvisorSession, pk=pk)
# Automatically returns 404 if not found
```

#### Pattern 4: Silent Failure (Anti-pattern)

```python
try:
    const existing = await api.academic.getProfile().catch(() => null)
except (e) {
    // ignore - comment says "ignore" but swallows all errors
}
```

**Issue**: Cannot distinguish between "no profile" vs "server error".

---

### Frontend Error Handling

#### Pattern 1: Generic API Error Handler

`edupath-frontend/src/services/api.ts`:

```typescript
try {
  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    console.error('API Error Response:', { url, status: response.status, error });
    throw new Error(error.detail || error.message || 'Request failed');
  }
  return await response.json();
} catch (error) {
  console.error('API Request Error:', { url, error });
  throw error;
}
```

**Issue**: Generic error messages don't help users understand what went wrong.

#### Pattern 2: Component-Level Error States

```typescript
const [error, setError] = useState<string | null>(null);

const handleStartSession = async () => {
  try {
    const res = await api.advisor.startSession();
    setSessionId(res.session_id);
  } catch (err) {
    console.error(err);
    alert('Failed to start advisor session.');  // ⚠️ Generic alert
  }
};
```

**Issue**: `alert()` is poor UX; should use toast notifications or inline error display.

#### Pattern 3: Silent Error Swallowing

```typescript
useEffect(() => {
  (async () => {
    try {
      const existing = await api.academic.getProfile().catch(() => null)
      if (existing) {
        setExamYear(existing.kcse_year ?? undefined)
      }
    } catch (e) {
      console.error(e)  // Logged but user sees nothing
    }
  })()
}, [])
```

**Issue**: Profile fails to load but user sees no error; thinks data is empty.

---

## 5. Common Errors & Solutions

### Backend Errors

| Error                             | Cause                    | Solution                                    |
| --------------------------------- | ------------------------ | ------------------------------------------- |
| **401 Unauthorized**        | Missing/invalid token    | Check `Authorization: Token <key>` header |
| **403 Forbidden**           | Insufficient permissions | Check user role; upgrade if needed          |
| **400 Bad Request**         | Invalid data format      | Check serializer errors in response         |
| **404 Not Found**           | Object doesn't exist     | Verify ID in URL                            |
| **503 Service Unavailable** | Groq API down/failed     | Retry with exponential backoff              |
| **500 Internal Server**     | Unhandled exception      | Check server logs                           |

### Frontend Errors

| Error                           | Cause                      | Solution                                     |
| ------------------------------- | -------------------------- | -------------------------------------------- |
| **"Failed to fetch"**     | Backend not running        | Start Django server on port 8000             |
| **CORS error**            | CORS_ORIGINS misconfigured | Add frontend URL to `CORS_ALLOWED_ORIGINS` |
| **"Invalid credentials"** | Wrong email/password       | Verify user exists in admin panel            |
| **"Token not valid"**     | Token deleted/expired      | Clear localStorage, re-login                 |
| **"undefined" errors**    | Missing data fields        | Add null checks before accessing             |

### AI/Advisor Errors

| Error                              | Cause                        | Solution                                  |
| ---------------------------------- | ---------------------------- | ----------------------------------------- |
| **"Groq API error"**         | Rate limit / service down    | Implement retry logic with delay          |
| **"Interview not complete"** | < 10 questions answered      | Continue interview flow                   |
| **"No recommendations"**     | Vector DB empty / no matches | Populate ChromaDB with course data        |
| **Malformed JSON from AI**   | Groq returned invalid JSON   | Implement fallback in `groq_service.py` |

---

## 6. Security Best Practices Checklist

### Immediate (Pre-Launch)

- [ ] **Add rate limiting** to advisor endpoints (10 requests/min per IP)
- [ ] **Set token expiry** to 30 days with refresh mechanism
- [ ] **Add request logging** middleware
- [ ] **Enable HTTPS** (`SECURE_SSL_REDIRECT = True`)
- [ ] **Restrict CORS** to production domains only
- [ ] **Add input validation** on AI prompts (max 1000 chars, strip HTML)
- [ ] **Set `DEBUG = False`** in production
- [ ] **Add Content Security Policy (CSP)** headers

### Short-term (Post-Launch)

- [ ] **Implement audit logging** for sensitive operations (profile updates)
- [ ] **Add IP-based anomaly detection** (unusual request patterns)
- [ ] **Encrypt sensitive fields** at rest (KCSE grades)
- [ ] **Add 2FA** for expert/admin accounts
- [ ] **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`
- [ ] **Penetration testing** with tools like OWASP ZAP

### Long-term

- [ ] **Migrate to JWT** fully and deprecate Token auth
- [ ] **Implement OAuth** (Google/Apple sign-in)
- [ ] **Add CAPTCHA** on registration to prevent bot accounts
- [ ] **Set up SIEM** for security monitoring
- [ ] **Regular security audits** (quarterly)

---

## Security Incident Response

### If Token is Compromised:

```python
# Force logout user - delete their token
from rest_framework.authtoken.models import Token
Token.objects.filter(user=compromised_user).delete()
```

### If Groq API Key is Leaked:

1. Rotate key immediately in Groq console
2. Update `GROQ_API_KEY` in `.env`
3. Restart backend services
4. Review API usage logs for abuse

### If Database is Breached:

1. Rotate `SECRET_KEY`
2. Force password reset for all users
3. Audit access logs
4. Check for data exfiltration

---

## Key Takeaways

1. **Authentication works** but tokens never expire (major risk)
2. **Advisor endpoints are wide open** - needs rate limiting ASAP
3. **Error handling is inconsistent** - mix of silent failures and generic alerts
4. **Security debt exists** - JWT configured but unused, permissive CORS
5. **No audit trail** - cannot investigate security incidents
6. **Production readiness**: 6/10 - needs hardening before public launch
