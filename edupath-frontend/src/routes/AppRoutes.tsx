import type { RouteObject } from 'react-router-dom'
import App from '../App'
import CourseCompare from '../features/courses/pages/CourseCompare'
import CourseDetail from '../features/courses/pages/CourseDetail'
import Societies from '../features/societies/pages/Societies'
import Profile from '../features/profile/pages/Profile'
import AcademicProfilePage from '../features/profile/pages/AcademicProfile'
import Directory from '../features/directory/pages/Directory'
import HubProfile from '../features/hubs/pages/HubProfile'
import HubFeedV2 from '../features/hubs/pages/HubFeedV2'
import AuthPage from '../features/auth/pages/Auth'
import PostDetail from '../features/posts/pages/PostDetail'
import UniversityPrograms from '../features/universities/pages/UniversityPrograms'
import { HomeGate, RequireAuth } from './guards'

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
      { path: 'societies', element: <Societies /> },
      { path: 'hubs', element: <HubFeedV2 /> },
      { path: 'hubs/:slug', element: <HubFeedV2 /> },
      { path: 'hub/:slug', element: <HubProfile /> },
      { path: 'posts/:id', element: <PostDetail /> },
      { path: 'profile', element: <RequireAuth><Profile /></RequireAuth> },
      { path: 'profile/academic', element: <RequireAuth><AcademicProfilePage /></RequireAuth> },
      { path: 'auth', element: <AuthPage /> },
    ],
  },
]

export default AppRoutes
