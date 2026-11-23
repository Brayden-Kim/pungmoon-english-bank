import os

from google import genai

client = genai.Client(api_key=os.environ['GOOGLE_API_KEY'])
try:
    for m in client.models.list():
        if 'flash' in m.name:
            print(m.name)
except Exception as e:
    print("ERROR:", e)
