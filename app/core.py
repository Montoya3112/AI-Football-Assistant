import os
from dotenv import load_dotenv
from supabase import create_client, Client as SupabaseClient
from google import genai
from google.genai import types

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")

supabase: SupabaseClient = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    _api_key = os.environ.get("GEMINI_API_KEY")
    if _api_key is None:
        raise ValueError("GEMINI_API_KEY is not set")
    client = genai.Client(api_key=_api_key)
except Exception as exc:
    raise RuntimeError(f"Gemini client init failed: {exc}")

MODEL_ID = "gemini-2.5-flash"
