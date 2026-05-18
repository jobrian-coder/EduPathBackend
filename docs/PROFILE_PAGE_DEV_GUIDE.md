# Profile Page - Developer Guide

> How the user profile page was built - architecture, patterns, and implementation details.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & File Structure](#architecture--file-structure)
3. [State Management](#state-management)
4. [Data Fetching Patterns](#data-fetching-patterns)
5. [UI Component Structure](#ui-component-structure)
6. [Edit Mode Implementation](#edit-mode-implementation)
7. [Tab System](#tab-system)
8. [Bookmark Integration](#bookmark-integration)
9. [Academic Profile Linking](#academic-profile-linking)
10. [Key Code Patterns](#key-code-patterns)

---

## Overview

The Profile Page is a multi-section user dashboard that displays:
- **Bio Card** with profile info, stats, and quick actions
- **Profile Completion** tracker with progress bar
- **Achievements** earned by the user
- **Analytics Dashboard** showing activity metrics
- **Tabbed Content** for Academic info, Bookmarks, and Role details

**Location**: `src/features/profile/pages/Profile.tsx`  
**Protected Route**: Yes (wrapped in `RequireAuth`)

---

## Architecture & File Structure

```
Profile.tsx (716 lines)
├── imports (React hooks, UI components, API, bookmarks)
├── constants (DEFAULT_PROFILE, DEFAULT_SOCIAL, etc.)
├── custom hooks (useBookmarks)
├── main Profile component
│   ├── state declarations
│   ├── data fetching effects
│   ├── computed values (useMemo)
│   └── JSX layout
```

### Dependencies
```typescript
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import { listBookmarks } from '../../../lib/bookmarks'
import api from '../../../services/api'
```

---

## State Management

### State Declarations
```typescript
const Profile = () => {
  // Core user data
  const [user, setUser] = useState<any | null>(null)
  
  // UI state
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'academic' | 'bookmarks' | 'role'>('academic')
  
  // Edit drafts
  const [bioDraft, setBioDraft] = useState('')
  const [locationDraft, setLocationDraft] = useState('')
  
  // Data sections
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [academic, setAcademic] = useState<any | null>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any | null>(null)
  
  // Loading states
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false)
  
  // Feature states
  const [upgradeStatus, setUpgradeStatus] = useState<null | 'idle' | 'requested' | 'error'>(null)
}
```

### Why This Pattern?
- **Granular loading states** - Each section has its own loading indicator
- **Draft state pattern** - Edit mode keeps drafts separate from persisted data
- **Null initial values** - Distinguishes between "not loaded" and "loaded but empty"

---

## Data Fetching Patterns

### 1. Profile Fetching (Primary)
```typescript
const fetchProfile = async () => {
  try {
    const me = await api.auth.getProfile()
    setUser(me)
    setBioDraft(me?.bio ?? '')
    setLocationDraft(me?.location ?? '')
  } catch {
    // Silently fail - keep defaults
  }
}

useEffect(() => {
  fetchProfile()
  
  // Refresh on window focus (e.g., after navigating back)
  const handleFocus = () => fetchProfile()
  window.addEventListener('focus', handleFocus)
  return () => window.removeEventListener('focus', handleFocus)
}, [])
```

**Pattern**: "Fetch on mount + refresh on focus" ensures data stays fresh.

### 2. Dependent Data Fetching
```typescript
useEffect(() => {
  if (user?.id) {
    fetchAchievements()
    fetchAnalytics()
  }
}, [user?.id])
```

**Pattern**: Only fetch secondary data after primary data (user) is available.

### 3. User Posts with Client-Side Filtering
```typescript
const fetchUserPosts = async () => {
  if (!user?.id) return
  
  setIsLoadingPosts(true)
  try {
    // Get all posts and filter by author
    const response = await api.hubs.listPosts({})
    const userPosts = response.results.filter((post: any) => post.author?.id === user.id)
    setUserPosts(userPosts)
  } catch (error) {
    console.error('Failed to fetch user posts:', error)
  } finally {
    setIsLoadingPosts(false)
  }
}
```

**Note**: The backend doesn't have a dedicated "my posts" endpoint, so we filter client-side.

---

## UI Component Structure

### Layout Hierarchy
```jsx
<PageContainer title="Profile">
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      
      {/* 1. Bio Card (persistent) */}
      <Card className="relative overflow-hidden">
        {/* Background decorations */}
        {/* Avatar + Info */}
        {/* Stats + Actions */}
      </Card>

      {/* 2. Completion & Achievements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>{/* Profile Completion */}</Card>
        <Card>{/* Achievements */}</Card>
      </div>

      {/* 3. Analytics Dashboard */}
      <Card>{/* Stats cards */}</Card>

      {/* 4. Tab Menu */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveTab('academic')}>Academic</button>
        <button onClick={() => setActiveTab('bookmarks')}>Bookmarks</button>
        <button onClick={() => setActiveTab('role')}>Role</button>
      </div>

      {/* 5. Tab Content */}
      {activeTab === 'academic' && <AcademicSection />}
      {activeTab === 'bookmarks' && <BookmarksSection />}
      {activeTab === 'role' && <RoleSection />}
    </div>
  </div>
</PageContainer>
```

### Card Pattern
Every section uses the `Card` component:
```jsx
<Card className="bg-white dark:bg-slate-800">
  <CardHeader>
    <div className="font-semibold text-slate-900 dark:text-white">Title</div>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

## Edit Mode Implementation

### Toggle Edit State
```typescript
// Enter edit mode - copy current values to drafts
const enterEditMode = () => {
  setEditing(true)
  setBioDraft(user?.bio ?? '')
  setLocationDraft(user?.location ?? '')
}

// Cancel - discard drafts
const cancelEdit = () => {
  setEditing(false)
  setBioDraft(user?.bio ?? '')
  setLocationDraft(user?.location ?? '')
}

// Save - persist to API
const saveEdit = async () => {
  try {
    const updated = await api.auth.updateProfile({ 
      bio: bioDraft, 
      location: locationDraft 
    })
    setUser(updated)
    setEditing(false)
  } catch (e) {
    alert('Failed to save profile. Please ensure you are logged in.')
  }
}
```

### Conditional UI Rendering
```jsx
{!editing ? (
  // View mode
  <p>{profile.bio}</p>
) : (
  // Edit mode
  <div className="space-y-2">
    <textarea 
      value={bioDraft} 
      onChange={e => setBioDraft(e.target.value)}
      placeholder="Your bio..."
    />
    <input 
      value={locationDraft} 
      onChange={e => setLocationDraft(e.target.value)}
      placeholder="Location"
    />
  </div>
)}
```

### Save/Cancel Buttons
```jsx
{!editing ? (
  <button onClick={enterEditMode}>Edit Profile</button>
) : (
  <div className="flex gap-2">
    <button onClick={saveEdit} className="bg-green-600 text-white">Save</button>
    <button onClick={cancelEdit}>Cancel</button>
  </div>
)}
```

---

## Tab System

### Tab State & Navigation
```typescript
const [activeTab, setActiveTab] = useState<'academic' | 'bookmarks' | 'role'>('academic')
```

### Tab Button Pattern
```jsx
<div className="flex flex-wrap gap-2">
  {[
    { id: 'academic', label: 'Academic & Interests' },
    { id: 'bookmarks', label: 'Bookmarks' },
    { id: 'role', label: 'Role & Posts' },
  ].map(t => (
    <button
      key={t.id}
      onClick={() => setActiveTab(t.id as any)}
      className={`px-4 py-2 rounded-full text-sm border transition ${
        activeTab === t.id 
          ? 'bg-teal-600 text-white border-teal-600' 
          : 'border-slate-300 hover:bg-slate-100'
      }`}
    >
      {t.label}
    </button>
  ))}
</div>
```

### Tab Content Rendering
```jsx
{activeTab === 'academic' && (
  <div className="grid gap-4 lg:grid-cols-2">
    {/* Academic Profile entry card */}
    {/* Academic Summary from backend */}
    {/* Interests */}
    {/* Joined Hubs */}
    {/* Recent Posts */}
  </div>
)}

{activeTab === 'bookmarks' && (
  <div className="grid gap-4 lg:grid-cols-2">
    {/* Bookmarked Courses */}
    {/* Bookmarked Universities */}
    {/* Bookmarked Posts */}
  </div>
)}

{activeTab === 'role' && (
  <div className="grid gap-4 lg:grid-cols-2">
    {/* Role & Access */}
    {/* Personal Information */}
    {/* Contact & Social */}
    {/* My Posts */}
  </div>
)}
```

---

## Bookmark Integration

### useBookmarks Custom Hook
```typescript
function useBookmarks(): BookmarkItem[] {
  const [items, setItems] = useState<BookmarkItem[]>([])

  useEffect(() => {
    // Initial load
    setItems(listBookmarks())
    
    // Listen for changes from other components
    const handler = () => setItems(listBookmarks())
    window.addEventListener('bookmarks:changed', handler)
    
    return () => window.removeEventListener('bookmarks:changed', handler)
  }, [])

  return items
}
```

**Pattern**: Uses a custom event (`bookmarks:changed`) to sync across tabs/components.

### Filtering by Type
```typescript
const bookmarkedCourses = useMemo(() => bookmarks.filter(b => b.type === 'course'), [bookmarks])
const bookmarkedPosts = useMemo(() => bookmarks.filter(b => b.type === 'post'), [bookmarks])
const bookmarkedUniversities = useMemo(() => bookmarks.filter(b => b.type === 'university'), [bookmarks])
```

### Eligibility Calculation
```typescript
const eligibilityBadge = (item: BookmarkItem) => {
  const payload = item.payload || {}
  const userMean = Number(payload.mean_points) || 0
  const rawCluster = Number(payload.raw_cluster) || 0
  const courseCutoff = Number(payload.required_points || payload.cluster_points) || 0
  
  const clusterPoints = (raw: number, mean: number) => {
    if (!raw || !mean) return null
    const base = (raw * mean) / (48 * 84)
    if (base <= 0) return 0
    return Math.sqrt(base) * 48
  }
  
  const userPoints = clusterPoints(rawCluster, userMean)
  if (userPoints == null || !courseCutoff) return 'Unknown'
  
  return userPoints >= courseCutoff ? 'Eligible ✅' : 'Not eligible ❌'
}
```

---

## Academic Profile Linking

### Fetch on Mount
```typescript
useEffect(() => {
  (async () => {
    try {
      const prof = await api.academic.getProfile().catch(() => null)
      setAcademic(prof)
    } catch (e) {
      // ignore - optional data
    }
  })()
}, [])
```

### Listen for Updates
```typescript
useEffect(() => {
  const handler = async () => {
    try {
      const prof = await api.academic.getProfile().catch(() => null)
      setAcademic(prof)
    } catch {
      // ignore
    }
  }
  window.addEventListener('academic:saved', handler)
  return () => window.removeEventListener('academic:saved', handler)
}, [])
```

**How it works**: When the Academic Profile page saves, it dispatches `academic:saved`, which triggers a refresh here.

### Display in Bio Card
```jsx
<div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
  {academic?.kcse_year && (
    <span className="rounded-lg bg-slate-100 px-3 py-2">
      <span>🎓</span> KCSE {academic.kcse_year}
    </span>
  )}
  {academic?.kcse_school && (
    <span className="rounded-lg bg-slate-100 px-3 py-2">
      <span>🏫</span> {academic.kcse_school}
    </span>
  )}
  {academic?.kcse_mean_points && (
    <span className="rounded-lg bg-slate-100 px-3 py-2">
      <span>⭐</span> {Number(academic.kcse_mean_points).toFixed(1)}/84 Points
    </span>
  )}
</div>
```

---

## Key Code Patterns

### 1. Default + Override Pattern
```typescript
const profile = useMemo(() => ({
  ...DEFAULT_PROFILE,
  ...(user ? {
    username: user.username ?? DEFAULT_PROFILE.username,
    bio: user.bio ?? DEFAULT_PROFILE.bio,
    // ... more fields
  } : {})
}), [user])
```

**Why**: Shows placeholder data immediately, then enhances with real data when loaded.

### 2. Protected Route
```typescript
// In routes/AppRoutes.tsx
{ path: 'profile', element: <RequireAuth><Profile /></RequireAuth> }
```

### 3. Cluster Points Calculation
```typescript
const clusterPoints = (raw: number, mean: number) => {
  if (!raw || !mean) return null
  const base = (raw * mean) / (48 * 84)
  if (base <= 0) return 0
  return Math.sqrt(base) * 48
}
```

### 4. Analytics Stats Grid
```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {[
    { value: analytics?.total_posts, label: 'Posts Created', color: 'teal' },
    { value: analytics?.total_comments, label: 'Comments Made', color: 'green' },
    { value: analytics?.upvotes_received, label: 'Upvotes Received', color: 'teal' },
    { value: analytics?.recent_posts, label: 'Posts (30 days)', color: 'orange' },
  ].map(stat => (
    <div key={stat.label} className={`text-center p-4 rounded-lg bg-${stat.color}-50`}>
      <div className={`text-2xl font-bold text-${stat.color}-600`}>
        {stat.value || 0}
      </div>
      <div className="text-sm text-slate-600">{stat.label}</div>
    </div>
  ))}
</div>
```

### 5. Post Card Pattern
```jsx
<Link to={`/posts/${post.id}`} className="block hover:no-underline">
  <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
    <div className="flex items-center gap-2 mb-1">
      <span className="px-2 py-0.5 rounded-full bg-slate-100">{post.hub?.name}</span>
      <span className="text-xs text-slate-400">{new Date(post.created_at).toLocaleDateString()}</span>
    </div>
    <h3 className="font-semibold group-hover:text-teal-600">{post.title}</h3>
    <p className="line-clamp-2">{post.content}</p>
  </div>
</Link>
```

---

## API Endpoints Used

| Feature | Endpoint | Method |
|---------|----------|--------|
| Get Profile | `/auth/profile/me/` | GET |
| Update Profile | `/auth/profile/me/` | PUT |
| Get Achievements | `/auth/profile/achievements/` | GET |
| Get Analytics | `/auth/profile/analytics/` | GET |
| Get Academic Profile | `/auth/profile/academic_profile/` | GET |
| List Posts | `/hubs/posts/` | GET |

---

## Summary

The Profile Page demonstrates:

1. **Modular state** - Separate states for each feature area
2. **Draft pattern** - Edit mode uses drafts, not direct state mutation
3. **Event-driven sync** - Custom events for cross-component communication
4. **Defensive coding** - try/catch on all API calls with fallbacks
5. **Responsive grids** - `lg:grid-cols-2` for desktop, single column on mobile
6. **Default values** - Placeholder data that gets enhanced by real data
7. **Tab-based navigation** - Simple conditional rendering for sections

**Key Takeaway**: The Profile Page is a "dashboard" pattern - it aggregates data from multiple sources (user profile, academic data, bookmarks, posts, achievements) into a unified view with clear visual hierarchy.
