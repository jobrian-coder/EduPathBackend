"""
Admin API endpoints for managing courses and universities.
These endpoints require admin role authentication.
"""

from rest_framework import viewsets, status, filters, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from .models import University, Course, CourseUniversity
from .serializers import (
    CourseUniversitySerializer,
)
from apps.authentication.permissions import IsAdmin


class AdminCourseSerializer(drf_serializers.ModelSerializer):
    """Full course serializer for admin — all model fields, no expensive reverse relations."""
    class Meta:
        model = Course
        fields = '__all__'


class AdminUniversitySerializer(drf_serializers.ModelSerializer):
    """Full university serializer for admin — all model fields."""
    class Meta:
        model = University
        fields = '__all__'


class AdminUniversityViewSet(viewsets.ModelViewSet):
    """
    Admin endpoint for full CRUD operations on universities.
    Requires admin role.
    """
    queryset = University.objects.all()
    serializer_class = AdminUniversitySerializer
    permission_classes = [IsAdmin]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'location']
    search_fields = ['name', 'short_name', 'description']
    ordering_fields = ['ranking', 'established', 'name']
    
    @action(detail=True, methods=['post'])
    def bulk_update_programs(self, request, pk=None):
        """
        Bulk update or create programs for a university.
        Expects: { "programs": [{"course_id": "...", "fees_ksh": 100000, "cutoff_points": 35}, ...] }
        """
        university = self.get_object()
        programs_data = request.data.get('programs', [])
        
        created = []
        updated = []
        errors = []
        
        for prog_data in programs_data:
            course_id = prog_data.get('course_id')
            if not course_id:
                errors.append({"error": "course_id required", "data": prog_data})
                continue
                
            try:
                course = Course.objects.get(id=course_id)
                
                # Try to get existing relationship
                try:
                    cu = CourseUniversity.objects.get(university=university, course=course)
                    # Update existing
                    cu.fees_ksh = prog_data.get('fees_ksh', cu.fees_ksh)
                    cu.cutoff_points = prog_data.get('cutoff_points', cu.cutoff_points)
                    cu.course_url = prog_data.get('course_url', cu.course_url)
                    cu.save()
                    updated.append(str(cu.id))
                except CourseUniversity.DoesNotExist:
                    # Create new
                    cu = CourseUniversity.objects.create(
                        university=university,
                        course=course,
                        fees_ksh=prog_data.get('fees_ksh'),
                        cutoff_points=prog_data.get('cutoff_points'),
                        course_url=prog_data.get('course_url', '')
                    )
                    created.append(str(cu.id))
                    
            except Course.DoesNotExist:
                errors.append({"error": f"Course {course_id} not found"})
            except Exception as e:
                errors.append({"error": str(e), "data": prog_data})
        
        return Response({
            'created': len(created),
            'updated': len(updated),
            'errors': errors
        })


class AdminCourseViewSet(viewsets.ModelViewSet):
    """
    Admin endpoint for full CRUD operations on courses.
    Requires admin role.
    """
    queryset = Course.objects.all().order_by('-created_at')
    serializer_class = AdminCourseSerializer
    permission_classes = [IsAdmin]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'related_hub', 'institution']
    search_fields = ['name', 'category', 'description', 'institution']
    ordering_fields = ['name', 'category', 'cutoff_2023', 'created_at']
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Bulk create courses.
        Expects: { "courses": [{"name": "...", "category": "..."}, ...] }
        """
        courses_data = request.data.get('courses', [])
        created = []
        errors = []
        
        for course_data in courses_data:
            try:
                # Remove id if provided to avoid conflicts
                course_data.pop('id', None)
                course = Course.objects.create(**course_data)
                created.append({
                    'id': str(course.id),
                    'name': course.name,
                    'category': course.category
                })
            except Exception as e:
                errors.append({"error": str(e), "data": course_data})
        
        return Response({
            'created_count': len(created),
            'created': created,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Bulk update courses.
        Expects: { "courses": [{"id": "...", "cutoff_2023": 35}, ...] }
        """
        courses_data = request.data.get('courses', [])
        updated = []
        errors = []
        
        for course_data in courses_data:
            course_id = course_data.get('id')
            if not course_id:
                errors.append({"error": "id required", "data": course_data})
                continue
            
            try:
                course = Course.objects.get(id=course_id)
                # Update fields
                for field, value in course_data.items():
                    if field != 'id' and hasattr(course, field):
                        setattr(course, field, value)
                course.save()
                updated.append({
                    'id': str(course.id),
                    'name': course.name
                })
            except Course.DoesNotExist:
                errors.append({"error": f"Course {course_id} not found"})
            except Exception as e:
                errors.append({"error": str(e), "data": course_data})
        
        return Response({
            'updated_count': len(updated),
            'updated': updated,
            'errors': errors
        })
    
    @action(detail=False, methods=['post'])
    def trigger_reindex(self, request):
        """
        Triggers reindexing of courses into ChromaDB.
        """
        try:
            import chromadb
            from chromadb.config import Settings
            from sentence_transformers import SentenceTransformer
            from django.conf import settings
            from apps.courses.models import Course
            
            # Use same config as in vector_service and index_courses script
            EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
            COLLECTION_NAME = "edupath_courses"
            
            embedder = SentenceTransformer(EMBED_MODEL_NAME)
            db_path = str(settings.CHROMA_DB_PATH)
            
            client = chromadb.PersistentClient(
                path=db_path,
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Recreate collection to ensure clean state
            try:
                client.delete_collection(COLLECTION_NAME)
            except Exception:
                pass
                
            collection = client.create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            
            # Group courses by category
            all_courses = Course.objects.all().order_by('category')
            grouped = {}
            for course in all_courses:
                cat = course.category
                if cat not in grouped:
                    grouped[cat] = {
                        'rep': course, 
                        'institutions': [], 
                        'cutoffs_2023': [], 
                        'cutoffs_2022': [], 
                        'fees': []
                    }
                g = grouped[cat]
                if course.institution:
                    g['institutions'].append(course.institution)
                if course.cutoff_2023:
                    g['cutoffs_2023'].append(float(course.cutoff_2023))
                if course.cutoff_2022:
                    g['cutoffs_2022'].append(float(course.cutoff_2022))
                if course.avg_fees_ksh:
                    g['fees'].append(course.avg_fees_ksh)

            course_groups = list(grouped.values())
            
            documents = []
            metadatas = []
            ids = []

            for g in course_groups:
                course = g['rep']
                inst_names = g['institutions']
                cutoff_2023s = g['cutoffs_2023']
                cutoff_2022s = g['cutoffs_2022']
                fees = g['fees']

                avg_cutoff = sum(cutoff_2023s) / len(cutoff_2023s) if cutoff_2023s else None
                avg_cutoff_2022 = sum(cutoff_2022s) / len(cutoff_2022s) if cutoff_2022s else None
                avg_fees = sum(fees) / len(fees) if fees else None
                institutions_str = ", ".join(inst_names[:3]) + (f" and {len(inst_names)-3} others" if len(inst_names) > 3 else "")
                
                text_parts = [
                    f"Course Name: {course.name}",
                    f"Category (Hub): {course.category}",
                    f"Description: {course.description}",
                    f"Career Opportunities: {', '.join(course.careers) if course.careers else 'Unknown'}",
                    f"Pros: {', '.join(course.pros) if course.pros else 'N/A'}",
                    f"Cons: {', '.join(course.cons) if course.cons else 'N/A'}",
                    f"Required Subjects: {', '.join(course.mandatory_subjects) if course.mandatory_subjects else 'N/A'}",
                ]
                doc_text = "\n".join(text_parts)
                
                meta = {
                    "course_id": str(course.id),
                    "course_name": course.name,
                    "hub_category": course.category,
                    "institution": institutions_str or "Unknown",
                    "careers": ", ".join(course.careers[:3]) if course.careers else "",
                }
                
                if avg_cutoff is not None:
                    meta["cutoff_2023"] = float(avg_cutoff)
                if avg_cutoff_2022 is not None:
                    meta["cutoff_2022"] = float(avg_cutoff_2022)
                if avg_fees is not None:
                    meta["avg_fees_ksh"] = float(avg_fees)
                    
                documents.append(doc_text)
                metadatas.append(meta)
                ids.append(str(course.id))
                
            # Batch upsert to avoid memory spikes
            batch_size = 100
            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i:i+batch_size]
                batch_metas = metadatas[i:i+batch_size]
                batch_ids = ids[i:i+batch_size]
                
                embeddings = embedder.encode(batch_docs).tolist()
                
                collection.upsert(
                    ids=batch_ids,
                    embeddings=embeddings,
                    documents=batch_docs,
                    metadatas=batch_metas
                )
                
            return Response({
                "status": "success", 
                "message": f"Successfully indexed {len(documents)} courses to AI database."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





class AdminCourseUniversityViewSet(viewsets.ModelViewSet):
    """
    Admin endpoint for managing Course-University relationships.
    Requires admin role.
    """
    queryset = CourseUniversity.objects.all()
    serializer_class = CourseUniversitySerializer
    permission_classes = [IsAdmin]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['course', 'university']
    ordering_fields = ['fees_ksh', 'cutoff_points', 'created_at']
