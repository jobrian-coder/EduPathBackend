 # APPENDICES

## APPENDIX A
### QUESTIONNAIRE QUESTIONS FOR STUDENTS (USERS)

1. On a scale of 1–5, how overwhelmed do you feel when trying to choose a university course or career path after high school?
2. Which tools or resources do you currently use to gather information about university courses? (Select all that apply: Physical KUCCPS booklets, School Career Counselor, Google Search, Parents/Peers, none, other).
3. How often do you find it difficult to understand the cluster point calculation system and how it affects your university admission chances?
4. How comfortable are you with using Artificial Intelligence (like ChatGPT) to assist in your career research and course selection?
5. Which features would you find most useful in an all-in-one career guidance platform? (Options: AI career analysis, community forums for specific careers, automated course comparison, student ranking dashboard).
6. Have you used any digital career guidance platforms before? If yes, what did you like or dislike about them?
7. How likely are you to use a platform that integrates career metrics, university requirements, and an AI career counselor into one dashboard rather than searching across multiple websites?
8. What are your primary concerns when choosing a career path? (e.g., salary, work-life balance, job availability in Kenya).
9. In your own words, describe the biggest challenge you face when preparing for university applications.


## APPENDIX B
### QUESTIONNAIRE QUESTIONS FOR CAREER COUNSELORS / EDUCATORS

1. What are the most common struggles you observe in students trying to select their university courses?
2. How frequently do students express difficulty in knowing *which* careers align with their strengths rather than just looking at their grades?
3. What barriers do you face when trying to explain the KUCCPS cluster point system to a large number of students?
4. How effective do you think digital platforms are in improving student clarity and confidence in their career choices?
5. How concerned are you about the accuracy of AI-generated career advice when used by students independently?
6. If an AI platform helped students generate detailed pros and cons for specific careers, how do you think it would impact their decision-making process?
7. What challenges do you face when trying to share updated career market trends and syllabus requirements with your students?
8. How should a digital platform balance providing AI assistance with encouraging independent critical thinking and self-reflection? (Options: Limiting direct answers, focusing on asking guiding questions, promoting peer discussion).


## APPENDIX C
### INTERESTING CODE SNIPPETS

**1. Async-Safe View Count Increment (Django)**
```python
# Instead of a standard DB write, using F() expressions prevents race conditions 
# when multiple users view a post simultaneously.
from django.db.models import F
from rest_framework.response import Response

class PostViewSet(viewsets.ModelViewSet):
    # ...
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Async-safe increment
        Post.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
        # Refresh from db before serializing
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
```

**2. EduGuide Chatbot AI Integration (Node.js/Python logic abstraction)**
```python
# Utilizing the external AI API to generate contextual career pros and cons
import openai
from django.conf import settings

def generate_career_pros_cons(career_name, user_context):
    openai.api_key = settings.OPENAI_API_KEY
    prompt = f"Analyze the career '{career_name}' in the context of the Kenyan job market. Provide 5 distinct pros and 5 cons. Consider the following user context: {user_context}."
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are an expert Kenyan career counselor."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    
    return parse_ai_response(response.choices[0].message.content)
```

**3. Thread Path Calculation for Society Hubs (Django Models)**
```python
# Auto-computing the hierarchical path for optimized nested comment retrieval
def save(self, *args, **kwargs):
    if not self.path:
        if self.parent_comment:
            # Append this comment's ID to the parent's path
            self.depth = self.parent_comment.depth + 1
            super().save(*args, **kwargs) # Save to get an ID
            self.path = f"{self.parent_comment.path}.{self.id}"
            super().save(update_fields=['path', 'depth'])
            return
        else:
            # Top-level comment
            self.depth = 0
            super().save(*args, **kwargs)
            self.path = str(self.id)
            super().save(update_fields=['path', 'depth'])
            return
    super().save(*args, **kwargs)
```


## APPENDIX D
### TECHNICAL GUIDE AND USER MANUAL

**1. System Requirements**
* **Operating System:** Windows 10+, macOS 11+, or modern Linux distributions.
* **Browser:** Google Chrome, Mozilla Firefox, Microsoft Edge (latest versions recommended).
* **Network:** Stable broadband internet connection required for AI querying and database sync.

**2. User Registration and Login**
* Navigate to the EduPath landing page.
* Click **"Sign Up"** to create a new account using an email and password.
* Upon successful login, you will be prompted to set up your Academic Profile by entering your KCSE grades.
* You will be redirected to the main Student Dashboard.

**3. Generating AI Career Analysis (EduGuide)**
* Navigate to the **Course Comparator** via the left sidebar.
* Select up to three courses or careers you wish to compare.
* Click the **"Generate AI Pros & Cons"** button. The EduGuide AI will process the request and display a structured analysis of your selected careers.

**4. Using the Society Hubs**
* Navigate to the **Hubs** page.
* Browse and click "Join" on any career hub of interest.
* Click **"Create Post"** to ask a question or share a guide. Fill in the title, content, and select tags.
* Use the upvote/downvote arrows on posts and comments to engage with the community.

**5. Chatting with EduGuide Contextually**
* While inside any specific Society Hub, locate the floating chat button (💬) in the bottom-right corner.
* Click to open the **EduGuide** interface.
* Ask any career-specific question. The AI will automatically know which hub you are currently browsing and tailor its advice accordingly.


<br><br><br>

# REFERENCES

1. **Books**
   * Creswell, J. W., & Creswell, J. D. (2018). *Research Design: Qualitative, Quantitative, and Mixed Methods Approaches* (5th ed.). SAGE Publications.
   * Sommerville, I. (2015). *Software Engineering* (10th ed.). Pearson.
   * Crockford, D. (2008). *JavaScript: The Good Parts*. O'Reilly Media.

2. **Journals**
   * Kariuki, M., & Wanjiru, E. (2022). Barriers to digital tool adoption among university students in Kenya. *African Journal of Information Systems*, 14(2), 89–104.
   * Chen, Y., & Lin, H. (2023). Integrating large language models into self-regulated learning platforms. *International Journal of Artificial Intelligence in Education*, 12(1), 45–67.
   * Kasneci, E., Seßler, K., Küchemann, S., & Kasneci, G. (2023). ChatGPT for good? On opportunities and challenges of large language models for education. *Learning and Individual Differences*, 103, 102274. https://doi.org/10.1016/j.lindif.2023.102274

3. **URLs (Websites and Documentation)**
   * Django Software Foundation. (2024). *Django Documentation*. Retrieved May 20, 2026, from https://docs.djangoproject.com/
   * React Community. (2024). *React: The library for web and native user interfaces*. Retrieved May 20, 2026, from https://react.dev/
   * OpenAI. (2024). *OpenAI API Documentation*. Retrieved May 20, 2026, from https://platform.openai.com/docs/
   * Kenya Universities and Colleges Central Placement Service (KUCCPS). (2024). *Student Portal and Guidelines*. Retrieved May 20, 2026, from https://students.kuccps.net/
   * Tailwind Labs. (2024). *Tailwind CSS Documentation*. Retrieved May 20, 2026, from https://tailwindcss.com/docs
