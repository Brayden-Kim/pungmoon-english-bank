import os
import time
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ['GOOGLE_API_KEY'])

for attempt in range(5):
    try:
        print(f"Attempt {attempt+1}...")
        res = client.models.generate_content(
            model='gemini-3.8-flash',
            contents='Return JSON: {"status": "ok"}',
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                max_output_tokens=100
            )
        )
        print("SUCCESS:", res.text)
        break
    except Exception as e:
        print(f"Attempt {attempt+1} failed:", e)
        time.sleep(3)
