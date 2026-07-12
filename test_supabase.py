import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"URL: '{url}'")
print(f"Key starts with: '{key[:10]}...'")

try:
    supabase: Client = create_client(url, key)
    response = supabase.table('interviews').select("*").execute()
    print("Success!")
    print(response.data)
except Exception as e:
    print(f"Error: {e}")
