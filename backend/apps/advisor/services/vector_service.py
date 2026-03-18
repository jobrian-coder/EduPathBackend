"""
CourseVectorStore — ChromaDB wrapper using all-MiniLM-L6-v2 embeddings.

This module is imported LAZILY inside views/services so that chromadb and
sentence-transformers are only loaded when the advisor endpoints are actually
hit, not on Django startup (keeps migrate / admin commands fast).
"""

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from django.conf import settings

COLLECTION_NAME = "edupath_courses"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"

# Singleton lazy instances (loaded once per worker process)
_client = None
_collection = None
_embedder = None

# Hub categories for diversity reranking
HUB_CATEGORIES = [
    "Technology",
    "Medicine",
    "Engineering",
    "Law",
    "Business",
    "Education",
    "Healthcare",
    "Science",
    "Social Sciences",
    "Arts & Humanities",
]


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBED_MODEL_NAME)
    return _embedder


def _get_collection():
    global _client, _collection
    if _collection is None:
        db_path = str(settings.CHROMA_DB_PATH)
        _client = chromadb.PersistentClient(
            path=db_path,
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


class CourseVectorStore:
    """Query interface for the pre-indexed ChromaDB collection."""

    def query(self, profile_text: str, n_results: int = 25) -> list[dict]:
        """
        Embed the profile and retrieve top-n_results similar courses.
        Returns a list of dicts with course metadata + distance.
        """
        embedder = _get_embedder()
        collection = _get_collection()

        query_embedding = embedder.encode(profile_text).tolist()

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_results, collection.count() or 1),
            include=["metadatas", "documents", "distances"],
        )

        hits = []
        for i, doc_id in enumerate(results["ids"][0]):
            hits.append({
                "id": doc_id,
                "document": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i],
            })
        return hits

    def diversity_rerank(self, hits: list[dict], n: int = 15) -> list[dict]:
        """
        Apply simple category-diversity reranking:
        allow max 2 results per hub_category, preserving similarity order.
        Returns up to n results.
        """
        category_counts: dict[str, int] = {}
        reranked = []
        for hit in hits:
            cat = hit["metadata"].get("hub_category", "Other")
            count = category_counts.get(cat, 0)
            if count < 2:
                reranked.append(hit)
                category_counts[cat] = count + 1
            if len(reranked) >= n:
                break
        return reranked
