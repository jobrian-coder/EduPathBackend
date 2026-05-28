import { Navigate, type RouteObject } from 'react-router-dom'
import App from '../App'
import CourseCompare from '../features/courses/pages/CourseCompare'
import CourseDetail from '../features/courses/pages/CourseDetail'

import Profile from '../features/profile/pages/Profile'
import AcademicProfilePage from '../features/profile/pages/AcademicProfile'
import Directory from '../features/directory/pages/Directory'
import HubProfile from '../features/hubs/pages/HubProfile'
import HubFeedV2 from '../features/hubs/pages/HubFeedV2'
import AuthPage from '../features/auth/pages/Auth'
import PostDetail from '../features/posts/pages/PostDetail'
import UniversityPrograms from '../features/universities/pages/UniversityPrograms'
import AdvisorPage from '../features/advisor/pages/AdvisorPage'
import HowItWorks from '../features/landing/pages/HowItWorks'
import LegalPage from '../features/legal/pages/LegalPage'
// Associate imports
import AssociateApply from '../features/associates/pages/AssociateApply'
import AssociateLanding from '../features/associates/pages/AssociateLanding'
import AssociateDirectory from '../features/associates/pages/AssociateDirectory'
import AssociateDashboard from '../features/associates/pages/AssociateDashboard'
import AssociateCreatePost from '../features/associates/pages/AssociateCreatePost'
import AssociatePage from '../features/associates/pages/AssociatePage'
// Admin imports
import AdminDashboard from '../features/admin/pages/AdminDashboard'
import AdminCourses from '../features/admin/pages/AdminCourses'
import AdminUniversities from '../features/admin/pages/AdminUniversities'
import AdminUsers from '../features/admin/pages/AdminUsers'
import AdminHubModeration from '../features/admin/pages/AdminHubModeration'
import AdminAssociateApplications from '../features/admin/pages/AdminAssociateApplications'
import AdminAssociates from '../features/admin/pages/AdminAssociates'
import AdminAnalytics from '../features/admin/pages/AdminAnalytics'
import { ToastProvider } from '../features/admin/hooks/useToast'
import { HomeGate, RequireAuth, RequireAdmin } from './guards'

// Wrapper component for admin pages with ToastProvider
const AdminWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

export const AppRoutes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomeGate /> },
      { path: 'courses/compare', element: <CourseCompare /> },
      { path: 'courses/:id', element: <CourseDetail /> },
      { path: 'directory', element: <Directory /> },
      { path: 'universities/:id/programs', element: <UniversityPrograms /> },
      { path: 'societies', element: <Navigate to="/hubs" replace /> },
      { path: 'hubs', element: <HubFeedV2 /> },
      { path: 'hubs/:slug', element: <HubFeedV2 /> },
      { path: 'hubs/:hubId/associates/:associateId', element: <AssociatePage /> },
      { path: 'hub/:slug', element: <HubProfile /> },
      { path: 'posts/:id', element: <PostDetail /> },
      { path: 'profile', element: <RequireAuth><Profile /></RequireAuth> },
      { path: 'profile/academic', element: <RequireAuth><AcademicProfilePage /></RequireAuth> },
      { path: 'advisor', element: <AdvisorPage /> },
      { path: 'how-it-works', element: <HowItWorks /> },
      { path: 'auth', element: <AuthPage /> },
      { path: 'legal', element: <LegalPage /> },
      // Associate routes
      { path: 'associates', element: <AssociateLanding /> },
      { path: 'associates/directory', element: <AssociateDirectory /> },
      { path: 'associates/apply', element: <AssociateApply /> },
      { path: 'associates/dashboard', element: <RequireAuth><AssociateDashboard /></RequireAuth> },
      { path: 'associates/dashboard/create', element: <RequireAuth><AssociateCreatePost /></RequireAuth> },
      // Admin routes
      { path: 'admin', element: <RequireAdmin><AdminWrapper><AdminDashboard /></AdminWrapper></RequireAdmin> },
      { path: 'admin/hubs/moderate', element: <RequireAdmin><AdminWrapper><AdminHubModeration /></AdminWrapper></RequireAdmin> },
      { path: 'admin/associates/applications', element: <RequireAdmin><AdminWrapper><AdminAssociateApplications /></AdminWrapper></RequireAdmin> },
      { path: 'admin/courses', element: <RequireAdmin><AdminWrapper><AdminCourses /></AdminWrapper></RequireAdmin> },
      { path: 'admin/universities', element: <RequireAdmin><AdminWrapper><AdminUniversities /></AdminWrapper></RequireAdmin> },
      { path: 'admin/users', element: <RequireAdmin><AdminWrapper><AdminUsers /></AdminWrapper></RequireAdmin> },
      { path: 'admin/associates', element: <RequireAdmin><AdminWrapper><AdminAssociates /></AdminWrapper></RequireAdmin> },
      { path: 'admin/analytics', element: <RequireAdmin><AdminWrapper><AdminAnalytics /></AdminWrapper></RequireAdmin> },
    ],
  },
]

export default AppRoutes
