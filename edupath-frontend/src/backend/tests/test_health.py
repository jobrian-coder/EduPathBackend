from fastapi.testclient import TestClient
from src.backend.main import app

def test_health():
    client = TestClient(app)
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json().get('status') == 'ok'

def test_docs_available():
    client = TestClient(app)
    r = client.get('/docs')
    assert r.status_code in (200, 307)  # swagger UI or redirect
