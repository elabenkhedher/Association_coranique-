import urllib.request
import json

url = "http://127.0.0.1:8000/api/token/"

def test_payload(payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), 
                                 headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as f:
            print(f"PAYLOAD: {payload}")
            print(f"Status: {f.status}, Response: {f.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"PAYLOAD: {payload}")
        print(f"Status: {e.code}, Response: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error: {e}")

print("Testing with email:")
test_payload({"email": "admin@example.com", "password": "password"})
