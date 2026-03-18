import os
import sys
import django
from pathlib import Path

# Setup Django environment
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from django.conf import settings
from apps.courses.models import Course, CourseUniversity

COLLECTION_NAME = "edupath_courses"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"

def main():
    print("Loading embedding model...")
    embedder = SentenceTransformer(EMBED_MODEL_NAME)
    
    db_path = str(settings.CHROMA_DB_PATH)
    print(f"Connecting to ChromaDB at {db_path}...")
    client = chromadb.PersistentClient(
        path=db_path,
        settings=Settings(anonymized_telemetry=False)
    )
    
    # Recreate collection to ensure clean state
    try:
        client.delete_collection(COLLECTION_NAME)
        print("Deleted existing collection.")
    except Exception:
        pass
        
    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    
    courses = Course.objects.all().prefetch_related('universities__university')
    total = courses.count()
    print(f"Found {total} canonical courses to index.")
    
    documents = []
    metadatas = []
    ids = []
    
    for i, course in enumerate(courses, 1):
        # Gather university info
        inst_names = [cu.university.name for cu in course.universities.all()]
        cutoff_2023s = [cu.cutoff_points for cu in course.universities.all() if cu.cutoff_points]
        cutoff_2022s = [getattr(cu, 'cutoff_2022', None) for cu in course.universities.all()]
        cutoff_2022s = [c for c in cutoff_2022s if c]
        fees = [cu.fees_ksh for cu in course.universities.all() if cu.fees_ksh]
        
        avg_cutoff = sum(cutoff_2023s) / len(cutoff_2023s) if cutoff_2023s else None
        avg_cutoff_2022 = float(sum(cutoff_2022s) / len(cutoff_2022s)) if cutoff_2022s else None
        avg_fees = float(sum(fees) / len(fees)) if fees else None
        institutions_str = ", ".join(inst_names[:3]) + (f" and {len(inst_names)-3} others" if len(inst_names) > 3 else "")
        
        # Build text representation for embedding
        text_parts = [
            f"Course Name: {course.name}",
            f"Category (Hub): {course.category}",
            f"Description: {course.description}",
            f"Career Opportunities: {', '.join(course.career_paths) if course.career_paths else 'Unknown'}",
            f"Pros: {', '.join(course.pros) if course.pros else 'N/A'}",
            f"Cons: {', '.join(course.cons) if course.cons else 'N/A'}",
            f"Required Subjects: {', '.join(course.mandatory_subjects) if course.mandatory_subjects else 'N/A'}",
        ]
        doc_text = "\n".join(text_parts)
        
        # Build metadata for filtering/reranking later
        meta = {
            "course_id": str(course.id),
            "course_name": course.name,
            "hub_category": course.category,
            "institution": institutions_str or "Unknown",
            "careers": ", ".join(course.career_paths[:3]) if course.career_paths else "",
        }
        
        # Must cast decimals to float for ChromaDB, or omit if null
        if avg_cutoff is not None:
            meta["cutoff_2023"] = float(avg_cutoff)
        if avg_cutoff_2022 is not None:
            meta["cutoff_2022"] = avg_cutoff_2022
        if avg_fees is not None:
            meta["avg_fees_ksh"] = avg_fees
            
        documents.append(doc_text)
        metadatas.append(meta)
        ids.append(str(course.id))
        
        if i % 50 == 0:
            print(f"Processed {i}/{total} courses...")
            
    print("Embedding and upserting into ChromaDB... (this might take a minute)")
    # Batch upsert to avoid memory explosion (e.g. 100 at a time)
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
        print(f"Upserted batch {i//batch_size + 1}/{(len(documents)+batch_size-1)//batch_size}")

    print("Indexing complete!")

if __name__ == "__main__":
    main()
