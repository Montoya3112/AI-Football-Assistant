# ════════════════════════════════════════════════════════════════
# 📦 MÓDULO: core.py
# 🎯 PROPÓSITO: Inicialización de conexiones externas (Supabase + Gemini API)
# 🔗 DEPENDENCIAS: python-dotenv, supabase-py, google-genai
# 📁 UBICACIÓN: app/core.py
# ════════════════════════════════════════════════════════════════

# ── IMPORTACIONES ──────────────────────────────────────────────
import os
from dotenv import load_dotenv
from supabase import create_client, Client as SupabaseClient
from google import genai
from google.genai import types

# ── CARGA DE VARIABLES DE ENTORNO (.env) ───────────────────────
# Lee SUPABASE_URL, SUPABASE_KEY y GEMINI_API_KEY desde el archivo .env
load_dotenv()

# ── CONEXIÓN A SUPABASE (Base de Datos en la Nube) ─────────────
# Supabase es la base de datos PostgreSQL donde se almacenan
# los reportes de partidos y los datos de usuarios autenticados.
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")

supabase: SupabaseClient = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── CONEXIÓN A LA API DE GEMINI (Inteligencia Artificial) ──────
# Gemini es el modelo de lenguaje de Google que procesa las consultas
# tácticas de fútbol y realiza el análisis visual de cédulas arbitrales.
try:
    _api_key = os.environ.get("GEMINI_API_KEY")
    if _api_key is None:
        raise ValueError("GEMINI_API_KEY is not set")
    client = genai.Client(api_key=_api_key)
except Exception as exc:
    raise RuntimeError(f"Gemini client init failed: {exc}")

# ── MODELO BASE DE GEMINI ───────────────────────────────────────
# Identificador del modelo principal. Se usa como referencia global.
MODEL_ID = "gemini-2.5-flash"
