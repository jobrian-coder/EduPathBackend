"""
Conversational AI Chat Service with RAG for course queries.
Separate from the structured interview flow.
"""
from groq import Groq
from django.conf import settings
from apps.courses.models import Course


class ChatService:
    """Handle free-form conversational chat with RAG for course information."""
    
    SYSTEM_PROMPT = """You are EduPath AI Advisor, a helpful and knowledgeable assistant for Kenyan students exploring university courses and career paths.

Your capabilities:
- Answer questions about courses, universities, career paths, and admission requirements
- Provide information about the EduPath platform features
- Help students understand KCSE requirements and cluster points
- Explain career hubs and how to join communities
- Guide students on using the platform effectively

Platform Features:
- Course Comparison: Compare multiple university programs side-by-side
- AI Advisor Interview: Structured 10-question interview for personalized course recommendations
- Career Hubs: Join communities based on career interests (Business, Tech, Health, Law, etc.)
- Associates: Connect with mentors, societies, and schools
- Academic Profile: Track KCSE grades and get eligibility-based recommendations
- Saved Recommendations: Bookmark courses for later review

When asked about courses:
- Search the course database and provide accurate, specific information
- Include institution names, requirements, and career prospects
- Mention cluster points and KCSE subject requirements when relevant

Be conversational, friendly, and encouraging. Keep responses concise but informative.
If you don't know something, admit it and suggest using the platform's features to find out.
"""

    def __init__(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in settings / .env")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"
    
    def chat(self, user_message: str, conversation_history: list, user_context: dict = None) -> str:
        """
        Generate AI response with RAG for course queries.
        
        Args:
            user_message: The user's current message
            conversation_history: List of {role, content} message dicts
            user_context: Optional dict with user's academic profile, saved courses, etc.
        
        Returns:
            AI assistant's response
        """
        # Check if message is about specific courses - do RAG search
        course_context = ""
        if self._is_course_query(user_message):
            course_context = self._search_courses(user_message)
        
        # Build context-aware system prompt
        system_prompt = self.SYSTEM_PROMPT
        
        if user_context:
            system_prompt += self._build_user_context(user_context)
        
        if course_context:
            system_prompt += f"\n\nRELEVANT COURSES FROM DATABASE:\n{course_context}"
        
        # Build messages for Groq
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (last 10 messages to stay within context)
        messages.extend(conversation_history[-10:])
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Call Groq API
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.8,
            max_tokens=2048,
        )
        return response.choices[0].message.content.strip()
    
    def _is_course_query(self, message: str) -> bool:
        """Detect if message is asking about specific courses."""
        course_keywords = [
            'course', 'program', 'degree', 'bachelor', 'diploma',
            'university', 'college', 'study', 'major', 'engineering',
            'medicine', 'law', 'business', 'computer science', 'nursing',
            'education', 'agriculture', 'architecture', 'pharmacy'
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in course_keywords)
    
    def _search_courses(self, query: str) -> str:
        """
        Search course database for relevant courses.
        Returns formatted string of top matching courses.
        """
        query_lower = query.lower()
        
        # Simple keyword-based search (you can enhance with vector search later)
        courses = Course.objects.filter(
            name__icontains=query_lower
        ) | Course.objects.filter(
            description__icontains=query_lower
        ) | Course.objects.filter(
            career_paths__icontains=query_lower
        )
        
        # Limit to top 5 results
        courses = courses[:5]
        
        if not courses:
            return "No specific courses found in database for this query."
        
        # Format course information
        result = []
        for course in courses:
            career_info = course.career_paths[:200] if course.career_paths else "Various career opportunities available"
            info = f"""
Course: {course.name}
Institution: {course.institution}
Cluster: {course.cluster_subjects}
Min Points: {course.min_cluster_points}/{course.max_cluster_points}
KCSE Cutoff 2023: {course.cutoff_2023}
Career Prospects: {career_info}...
Average Fees: KSh {course.avg_fees_ksh:,}
"""
            result.append(info.strip())
        
        return "\n\n".join(result)
    
    def _build_user_context(self, user_context: dict) -> str:
        """Build personalized context from user's profile."""
        context_parts = []
        
        if user_context.get('kcse_mean_points'):
            context_parts.append(
                f"\nUser's KCSE Mean Points: {user_context['kcse_mean_points']}/84"
            )
        
        if user_context.get('saved_courses'):
            courses = ", ".join(user_context['saved_courses'][:3])
            context_parts.append(f"\nUser's Saved Courses: {courses}")
        
        if user_context.get('joined_hubs'):
            hubs = ", ".join(user_context['joined_hubs'])
            context_parts.append(f"\nUser's Joined Hubs: {hubs}")
        
        return "".join(context_parts) if context_parts else ""
    
    def generate_title(self, first_message: str) -> str:
        """Generate a short title for the conversation based on first message."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Generate a short 3-5 word title for this conversation. Return only the title, nothing else."
                    },
                    {"role": "user", "content": first_message}
                ],
                temperature=0.5,
                max_tokens=20,
            )
            title = response.choices[0].message.content.strip()
            # Remove quotes if present
            return title.strip('"\'')
        except:
            return "New Chat"
