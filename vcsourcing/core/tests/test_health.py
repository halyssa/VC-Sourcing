from rest_framework.test import APIClient

def test_health_ok():
    client = APIClient()
    response = client.get("/api/health/")
    assert response.status_code == 200
<<<<<<< HEAD
    assert response.json() == {"status": "ok"}
=======
    assert response.json().get("status") == "ok"
>>>>>>> ticket-3
