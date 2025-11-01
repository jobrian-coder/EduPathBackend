import os
import json
import requests
from typing import Dict, List, Any
from django.conf import settings
from .models import ChatConversation, ChatMessage, ChatbotSettings


class ChatbotService:
    """Service for handling AI chatbot interactions"""
    
    def __init__(self):
        self.settings = self._get_chatbot_settings()
    
    def _get_chatbot_settings(self):
        """Get active chatbot settings"""
        try:
            return ChatbotSettings.objects.filter(is_active=True).first()
        except:
            # Return default settings if none exist
            return type('Settings', (), {
                'ai_provider': 'openai',
                'ai_model': 'gpt-3.5-turbo',
                'max_tokens': 1000,
                'temperature': 0.7,
                'system_prompt': "You are EduPath AI, a helpful assistant for students exploring career paths and educational opportunities in Kenya. Provide accurate, helpful information about careers, courses, universities, and professional societies."
            })()
    
    def generate_response(self, conversation: ChatConversation, user_message: str, context_type: str) -> Dict[str, Any]:
        """Generate AI response based on conversation context"""
        
        # Get conversation history
        recent_messages = ChatMessage.objects.filter(
            conversation=conversation
        ).order_by('-created_at')[:10]  # Last 10 messages
        
        # Build context
        context = self._build_context(conversation, context_type)
        
        # Prepare messages for AI
        messages = self._prepare_messages(recent_messages, user_message, context)
        
        # Generate response based on AI provider
        if self.settings.ai_provider == 'openai':
            return self._generate_openai_response(messages)
        elif self.settings.ai_provider == 'anthropic':
            return self._generate_anthropic_response(messages)
        elif self.settings.ai_provider == 'google':
            return self._generate_google_response(messages)
        else:
            return self._generate_fallback_response(user_message)
    
    def _build_context(self, conversation: ChatConversation, context_type: str) -> str:
        """Build context string based on conversation type"""
        context_parts = []
        
        if conversation.hub:
            context_parts.append(f"Career Hub: {conversation.hub.name}")
            context_parts.append(f"Hub Description: {conversation.hub.description}")
            context_parts.append(f"Hub Field: {conversation.hub.field}")
        
        if context_type == 'career_guidance':
            context_parts.append("Focus on career guidance, job prospects, and professional development.")
        elif context_type == 'course_comparison':
            context_parts.append("Focus on course comparisons, academic requirements, and career outcomes.")
        elif context_type == 'society_info':
            context_parts.append("Focus on professional societies, membership benefits, and networking.")
        
        return " | ".join(context_parts)
    
    def _prepare_messages(self, recent_messages: List[ChatMessage], user_message: str, context: str) -> List[Dict[str, str]]:
        """Prepare messages for AI API"""
        messages = [
            {"role": "system", "content": f"{self.settings.system_prompt}\n\nContext: {context}"}
        ]
        
        # Add recent conversation history
        for msg in reversed(recent_messages):
            role = "user" if msg.sender_type == "user" else "assistant"
            messages.append({"role": role, "content": msg.content})
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    def _generate_openai_response(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Generate response using OpenAI API"""
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                return self._generate_fallback_response(messages[-1]['content'])
            
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': self.settings.ai_model,
                    'messages': messages,
                    'max_tokens': self.settings.max_tokens,
                    'temperature': self.settings.temperature
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'content': data['choices'][0]['message']['content'],
                    'metadata': {'model': self.settings.ai_model, 'provider': 'openai'}
                }
            else:
                return self._generate_fallback_response(messages[-1]['content'])
                
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._generate_fallback_response(messages[-1]['content'])
    
    def _generate_anthropic_response(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Generate response using Anthropic Claude API"""
        try:
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                return self._generate_fallback_response(messages[-1]['content'])
            
            # Convert messages to Claude format
            prompt = self._convert_messages_to_prompt(messages)
            
            response = requests.post(
                'https://api.anthropic.com/v1/messages',
                headers={
                    'x-api-key': api_key,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                json={
                    'model': 'claude-3-sonnet-20240229',
                    'max_tokens': self.settings.max_tokens,
                    'messages': [{'role': 'user', 'content': prompt}]
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'content': data['content'][0]['text'],
                    'metadata': {'model': 'claude-3-sonnet', 'provider': 'anthropic'}
                }
            else:
                return self._generate_fallback_response(messages[-1]['content'])
                
        except Exception as e:
            print(f"Anthropic API error: {e}")
            return self._generate_fallback_response(messages[-1]['content'])
    
    def _generate_google_response(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Generate response using Google Gemini API"""
        try:
            api_key = os.getenv('GOOGLE_API_KEY')
            if not api_key:
                return self._generate_fallback_response(messages[-1]['content'])
            
            # Convert messages to Gemini format
            prompt = self._convert_messages_to_prompt(messages)
            
            response = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}',
                json={
                    'contents': [{'parts': [{'text': prompt}]}],
                    'generationConfig': {
                        'maxOutputTokens': self.settings.max_tokens,
                        'temperature': self.settings.temperature
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'content': data['candidates'][0]['content']['parts'][0]['text'],
                    'metadata': {'model': 'gemini-pro', 'provider': 'google'}
                }
            else:
                return self._generate_fallback_response(messages[-1]['content'])
                
        except Exception as e:
            print(f"Google API error: {e}")
            return self._generate_fallback_response(messages[-1]['content'])
    
    def _convert_messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Convert message list to single prompt string"""
        prompt_parts = []
        for msg in messages:
            if msg['role'] == 'system':
                prompt_parts.append(f"System: {msg['content']}")
            elif msg['role'] == 'user':
                prompt_parts.append(f"Human: {msg['content']}")
            elif msg['role'] == 'assistant':
                prompt_parts.append(f"Assistant: {msg['content']}")
        
        return "\n\n".join(prompt_parts)
    
    def _generate_fallback_response(self, user_message: str) -> Dict[str, Any]:
        """Generate fallback response when AI services are unavailable"""
        fallback_responses = {
            'career_guidance': "I'd be happy to help with career guidance! Could you tell me more about your interests and what specific career path you're considering?",
            'course_comparison': "I can help you compare courses! What specific courses or career paths are you interested in comparing?",
            'society_info': "I can provide information about professional societies! Which society or professional field are you interested in learning about?",
            'default': "I'm here to help with your educational and career questions! What would you like to know more about?"
        }
        
        # Simple keyword matching for fallback
        message_lower = user_message.lower()
        if any(word in message_lower for word in ['career', 'job', 'profession']):
            response = fallback_responses['career_guidance']
        elif any(word in message_lower for word in ['course', 'compare', 'comparison']):
            response = fallback_responses['course_comparison']
        elif any(word in message_lower for word in ['society', 'professional', 'organization']):
            response = fallback_responses['society_info']
        else:
            response = fallback_responses['default']
        
        return {
            'content': response,
            'metadata': {'provider': 'fallback', 'note': 'AI service unavailable'}
        }


class AIProsConsService:
    """Service for generating pros and cons using AI"""
    
    def generate_pros_cons(self, career_name: str, course_name: str = None, context: str = '') -> Dict[str, List[str]]:
        """Generate pros and cons for a career or course"""
        
        # Build prompt for pros and cons generation
        prompt = self._build_pros_cons_prompt(career_name, course_name, context)
        
        try:
            # Try OpenAI first
            response = self._call_openai_api(prompt)
            if response:
                return self._parse_pros_cons_response(response)
        except Exception as e:
            print(f"OpenAI API error: {e}")
        
        # Fallback to static pros/cons
        return self._get_fallback_pros_cons(career_name, course_name)
    
    def _build_pros_cons_prompt(self, career_name: str, course_name: str = None, context: str = '') -> str:
        """Build prompt for pros and cons generation"""
        prompt = f"""
        Generate a comprehensive list of pros and cons for the career: {career_name}
        """
        
        if course_name:
            prompt += f" and related course: {course_name}"
        
        if context:
            prompt += f"\n\nAdditional context: {context}"
        
        prompt += """
        
        Please provide:
        1. 5-7 advantages (pros) of pursuing this career
        2. 5-7 disadvantages (cons) of pursuing this career
        3. Focus on practical aspects like salary, job market, work-life balance, required skills, etc.
        
        Format your response as:
        PROS:
        - [advantage 1]
        - [advantage 2]
        ...
        
        CONS:
        - [disadvantage 1]
        - [disadvantage 2]
        ...
        """
        
        return prompt
    
    def _call_openai_api(self, prompt: str) -> str:
        """Call OpenAI API for pros and cons generation"""
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                return None
            
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'gpt-3.5-turbo',
                    'messages': [{'role': 'user', 'content': prompt}],
                    'max_tokens': 1000,
                    'temperature': 0.7
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content']
            else:
                return None
                
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return None
    
    def _parse_pros_cons_response(self, response: str) -> Dict[str, List[str]]:
        """Parse AI response to extract pros and cons"""
        lines = response.split('\n')
        pros = []
        cons = []
        current_section = None
        
        for line in lines:
            line = line.strip()
            if line.upper().startswith('PROS:'):
                current_section = 'pros'
                continue
            elif line.upper().startswith('CONS:'):
                current_section = 'cons'
                continue
            elif line.startswith('- '):
                item = line[2:].strip()
                if current_section == 'pros':
                    pros.append(item)
                elif current_section == 'cons':
                    cons.append(item)
        
        return {'pros': pros, 'cons': cons}
    
    def _get_fallback_pros_cons(self, career_name: str, course_name: str = None) -> Dict[str, List[str]]:
        """Get fallback pros and cons when AI is unavailable"""
        # This could be expanded with a database of pre-generated pros/cons
        return {
            'pros': [
                f"Good career prospects in {career_name}",
                "Opportunities for professional growth",
                "Competitive salary potential",
                "Diverse job opportunities",
                "Skill development opportunities"
            ],
            'cons': [
                "May require additional training/education",
                "Competitive job market",
                "Potential for high stress",
                "May require relocation",
                "Continuous learning required"
            ]
        }
