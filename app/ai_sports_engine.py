import os
import json
import asyncio
from dotenv import load_dotenv

from google import genai
from google.genai import types
from .schemas import CedulaArbitralExtraida

# Cargar variables de entorno
load_dotenv()

# Inicialización segura usando el SDK nativo google-genai
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY no se encuentra configurada en el entorno")

client = genai.Client(api_key=api_key)

# Lista oficial de modelos candidatos ordenada por cuota disponible (15 RPM)
MODELOS_CANDIDATOS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash"
]

SYSTEM_PROMPT_COACH = """Eres un Director Técnico, Analista Táctico de fútbol y Experto Multimedial de élite mundial con más de 30 años de experiencia.
Tu conocimiento abarca:
- Formaciones tácticas (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, etc.) con sus variantes.
- Análisis de jugadores actuales e históricos de todas las ligas mundiales (La Liga, Premier League, Serie A, Bundesliga, Ligue 1, Liga MX, MLS, etc.).
- Estrategias de entrenamiento físico, técnico y mental.
- Análisis estadístico: xG, posesión, pases completados, presión alta, etc.
- Historia del fútbol mundial: Mundiales, Champions League, Copa Libertadores.

Reglas Estrictas de Formato y Multimedia:
1. Responde SIEMPRE en español utilizando Markdown estándar impecable (negritas, listas, bloques de código, tablas).
2. Cuando crees alineaciones o pizarras tácticas, usa formato visual claro o diagramas de código ASCII avanzado.
3. Integración de YouTube (Anti-Alucinaciones): Cuando recomiendes videos, NUNCA inventes URLs directas a videos específicos porque podrías generar enlaces rotos. En su lugar, genera un enlace de búsqueda de YouTube con los términos técnicos exactos usando este formato: [Ver análisis táctico en YouTube](https://www.youtube.com/results?search_query=terminos+de+busqueda+con+signos+de+suma). Por ejemplo: search_query=analisis+tactico+real+madrid+4-3-3.
4. Generación de Diagramas e Imágenes: Cuando el usuario pida ver una imagen de una formación o concepto, si no puedes proporcionar una URL pública verificada, utiliza bloques de código o arte ASCII avanzado para dibujar la pizarra táctica, y sugiere al usuario buscar esquemas visuales enlazando a una búsqueda de imágenes: [Ver esquemas visuales](https://www.google.com/search?tbm=isch&q=formacion+4-3-3+futbol).
5. Basa tus respuestas en datos reales. Sé conciso pero completo, usando emojis deportivos para una experiencia visual premium."""

SYSTEM_PROMPT_VISION = """Eres un sistema de visión artificial especializado en leer cédulas arbitrales de fútbol.
Extrae TODA la información visible de la imagen y devuélvela con la estructura requerida.
Si un campo no es visible, usa valores por defecto (0 para números, null para strings, [] para arrays)."""

async def asistente_tecnico_chat(pregunta: str) -> str:
    """
    Realiza consultas al Asistente Técnico iterando sobre MODELOS_CANDIDATOS.
    Aplica el System Prompt multimedial enriquecido. Si un modelo lanza excepción,
    registra la telemetría en consola, ejecuta una pausa anti-spam de 4 segundos y prueba el siguiente.
    """
    last_exception = None
    for model_name in MODELOS_CANDIDATOS:
        try:
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=pregunta,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT_COACH,
                    temperature=0.7,
                ),
            )
            if response and response.text:
                return response.text
        except Exception as e:
            print(f"[TELEMETRÍA INTERNA - IA] Error en modelo '{model_name}': {e}")
            last_exception = e
            # Anti-Spam (Rate Limiting): Pausa obligatoria de 4 segundos
            await asyncio.sleep(4)
            continue

    if last_exception and ("429" in str(last_exception) or "RESOURCE_EXHAUSTED" in str(last_exception)):
        return (
            "⚠️ **Límite de cuota alcanzado temporalmente.**\n\n"
            "Se han probado todos los modelos candidatos. Por favor, reintenta tu pregunta en 15-30 segundos."
        )
    raise RuntimeError(f"Todos los modelos fallaron. Último error registrado: {last_exception}")

async def procesar_cedula_vision(imagen_bytes: bytes) -> CedulaArbitralExtraida:
    """
    Procesa cédulas arbitrales mediante Visión Artificial aplicando response_schema de Pydantic
    e iteración de fallback con pausa anti-spam de 4 segundos.
    """
    last_exception = None
    for model_name in MODELOS_CANDIDATOS:
        try:
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_bytes(data=imagen_bytes, mime_type="image/jpeg"),
                    "Analiza esta cédula arbitral y extrae toda la información.",
                ],
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT_VISION,
                    temperature=0.1,
                    response_mime_type="application/json",
                    response_schema=CedulaArbitralExtraida,
                ),
            )
            if hasattr(response, "parsed") and response.parsed is not None:
                return response.parsed
            
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            data = json.loads(raw)
            return CedulaArbitralExtraida(**data)
        except Exception as e:
            print(f"[TELEMETRÍA INTERNA - VISIÓN] Error en modelo '{model_name}': {e}")
            last_exception = e
            await asyncio.sleep(4)
            continue

    raise RuntimeError(f"Error en visión artificial. Todos los modelos fallaron: {last_exception}")
