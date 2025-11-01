import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  MessageSquare, 
  TrendingUp, 
  Award, 
  Users, 
  Calendar, 
  Search, 
  Plus, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useHub } from '../hooks/useHub';
import { PostCard } from '../components/PostCard';
import { CreatePostForm } from '../components/CreatePostForm';
import { Button } from '../../../components/common/Button';
import { Alert, AlertDescription, AlertTitle } from '../../../components/common/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/common/Tabs';
import { Input } from '../../../components/common/Input';

// Removed static TECH_HUB fallback; we now fetch by slug

type TabType = 'feed' | 'events' | 'members' | 'resources';

export const HubSociety: React.FC = () => {
  const { slug = '' } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [postFilters, setPostFilters] = useState({
    type: 'all',
    sort: 'newest',
  });

  // Fetch data using our custom hook
  const {
    hubQuery,
    usePosts,
    createPost,
    voteOnPost,
    isCreatingPost: isCreatingPostLoading,
    eventsQuery,
    rsvpToEvent,
    joinHub,
    leaveHub,
    isJoining,
    isLeaving,
  } = useHub({ hubIdOrSlug: String(slug || '') });

  const { data: hub, isLoading: isLoadingHub, isError: isHubError } = hubQuery;
  const { data: posts, isLoading: isLoadingPosts, isError: isPostsError } = usePosts(postFilters);
  const { data: events, isLoading: isLoadingEvents, isError: isEventsError } = eventsQuery;

  // Handle post creation
  const handleCreatePost = async (postData: { title: string; content: string; type: string; tags: string[]; isExpertPost: boolean }) => {
    try {
      await createPost({
        title: postData.title,
        content: postData.content,
        post_type: postData.type,
        is_expert_post: postData.isExpertPost,
        tags: postData.tags,
      });
      setIsCreatingPost(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  // Handle post interaction (like/dislike)
  const handlePostInteraction = async (postId: string, action: 'like' | 'dislike') => {
    try {
      await voteOnPost({ postId, voteType: action === 'like' ? 'upvote' : 'downvote' });
    } catch (e) {
      console.error('Vote failed', e);
    }
  };

  // Handle RSVP to event
  const handleRSVP = async (eventId: string, isAttending: boolean) => {
    try {
      await rsvpToEvent({ eventId, rsvp: isAttending });
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  // Toggle hub membership
  const handleJoin = async () => {
    try { await joinHub(); } catch (e) { console.error('Join failed', e); }
  };
  const handleLeave = async () => {
    try { await leaveHub(); } catch (e) { console.error('Leave failed', e); }
  };

  // Loading and error states
  if (isLoadingHub) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (isHubError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load hub data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            Hub not found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hubData = hub!;
  return (
    <div className="min-h-screen theme-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="theme-surface border theme-border rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              {hubData.icon && (
                <img
                  src={hubData.icon}
                  alt={`${hubData.name} icon`}
                  className="w-14 h-14 rounded-lg object-cover border"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{hubData.name}</h1>
                <p className="text-gray-600 mb-4">{hubData.description}</p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{(hubData?.member_count ?? 0).toLocaleString()} members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{(hubData?.active_posts ?? 0).toLocaleString()} posts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Active Community</span>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              variant={hubData?.is_member ? 'outline' : 'default'}
              onClick={hubData?.is_member ? handleLeave : handleJoin}
              disabled={isJoining || isLeaving}
              className="w-full md:w-auto"
            >
              {isJoining || isLeaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : hubData?.is_member ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {hubData?.is_member ? 'Joined' : 'Join Community'}
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value: string) => setActiveTab(value as TabType)}
          className="theme-surface border theme-border rounded-lg shadow-sm mb-6"
        >
          <TabsList className="w-full flex">
            <TabsTrigger value="feed" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="members" className="flex-1">
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex-1">
              <Award className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>
          
          <div className="p-6">
            {/* Search and filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search posts..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border theme-border rounded-lg focus-secondary text-sm"
                value={postFilters.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPostFilters({ ...postFilters, type: e.target.value })}
              >
                <option value="all">All Posts</option>
                <option value="question">Questions</option>
                <option value="guide">Guides</option>
                <option value="success_story">Success Stories</option>
              </select>
              <select
                className="px-3 py-2 border theme-border rounded-lg focus-secondary text-sm"
                value={postFilters.sort}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPostFilters({ ...postFilters, sort: e.target.value as any })}
              >
                <option value="newest">Newest First</option>
                <option value="top">Top Rated</option>
                <option value="trending">Trending</option>
              </select>
            </div>

            {/* Feed Tab */}
            <TabsContent value="feed" className="space-y-6">
              {isLoadingPosts ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
              ) : isPostsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load posts. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : posts?.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                  <p className="text-gray-500 mt-1">Be the first to share something with the community!</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsCreatingPost(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {posts?.map((post: any) => {
                      const uiPost = {
                        id: post.id,
                        title: post.title,
                        author: post.author ? (post.author.first_name ? `${post.author.first_name} ${post.author.last_name}` : post.author.username) : 'Anonymous',
                        role: (post.author?.role as any) || 'novice',
                        type: post.type,
                        content: post.content,
                        upvotes: post.upvotes,
                        downvotes: post.downvotes,
                        comments: post.commentCount ?? post.comments ?? 0,
                        tags: post.tags || [],
                        isPinned: !!post.isPinned,
                        timestamp: post.timestamp,
                      };
                      return (
                        <PostCard
                          key={post.id}
                          post={uiPost}
                          onUpvote={() => handlePostInteraction(String(post.id), 'like')}
                          onDownvote={() => handlePostInteraction(String(post.id), 'dislike')}
                          onComment={() => console.log('Comment on post', post.id)}
                        />
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Load More
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events">
              {isLoadingEvents ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
              ) : isEventsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load events. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : events?.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No upcoming events</h3>
                  <p className="text-gray-500 mt-1">Check back later for new events and workshops.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {events?.map((event: any) => (
                    <div key={event.id} className="theme-surface rounded-lg shadow-sm overflow-hidden border theme-border">
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{event.society} • {event.type}</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                            {event.date}
                          </span>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <Button variant="outline" size="sm" className="text-sm">
                            <Info className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                          <Button 
                            variant={event.isAttending ? 'outline' : 'default'} 
                            size="sm"
                            onClick={() => handleRSVP(event.id, !event.isAttending)}
                            disabled={!hubData?.is_member}
                          >
                            {event.isAttending ? 'Going' : 'RSVP'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <div className="theme-surface border theme-border rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Members</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
                        JD
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">John Doe</h4>
                        <p className="text-sm text-gray-500">Software Engineer at Tech Corp</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                  {/* More member items... */}
                </div>
                <div className="mt-6">
                  <Button variant="outline" className="w-full">
                    View All Members
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources">
              <div className="theme-surface border theme-border rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Resources</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { title: 'Getting Started with React', type: 'Tutorial', source: 'FreeCodeCamp' },
                    { title: 'Python for Data Science', type: 'Course', source: 'Coursera' },
                    { title: 'System Design Primer', type: 'GitHub Repo', source: 'GitHub' },
                  ].map((resource, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-gray-900">{resource.title}</h4>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <span>{resource.type}</span>
                        <span>•</span>
                        <span>{resource.source}</span>
                      </div>
                      <Button variant="ghost" className="p-0 h-auto mt-3 text-teal-600 hover:text-teal-800">
                        View Resource
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Create Post Button */}
        {hubData?.is_member && (
          <Button 
            className="fixed bottom-6 right-6 rounded-full p-4 shadow-lg z-10"
            onClick={() => setIsCreatingPost(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        )}

        {/* Create Post Dialog */}
        <CreatePostForm
          isOpen={isCreatingPost}
          onClose={() => setIsCreatingPost(false)}
          onSubmit={handleCreatePost}
          isSubmitting={isCreatingPostLoading}
        />
      </div>
    </div>
  );
};

export default HubSociety;
