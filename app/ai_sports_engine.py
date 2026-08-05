import json
import asyncio
import os
from .core import client
from .schemas import CedulaArbitralExtraida
from google.genai import types

# Lista de modelos válidos en producción con cuota habilitada (15 RPM / Free Tier)
MODELOS_CANDIDATOS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash-lite",
]

SYSTEM_PROMPT_COACH = """Eres un Director Técnico y Analista Táctico de fútbol de élite mundial con más de 30 años de experiencia.
Tu conocimiento abarca:
- Formaciones tácticas (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, etc.) con sus variantes.
- Análisis de jugadores actuales e históricos de todas las ligas mundiales.
- Estrategias de entrenamiento físico, técnico y mental.
- Análisis estadístico: xG, posesión, pases completados, presión alta, etc.

REGLAS DE RESPUESTA:
1. Responde SIEMPRE en español con tono profesional, apasionado y directo.
2. Formatea tu respuesta usando Markdown estructurado.
3. REGLA YOUTUBE (ANTI-ALUCINACIONES): NUNCA inventes enlaces directos a videos específicos de YouTube. Si vas a recomendar videos, genera UNICAMENTE enlaces de búsqueda con el formato exacto:
   [Ver análisis en YouTube](https://www.youtube.com/results?search_query=terminos+de+busqueda+con+signos+de+suma)
4. REGLA IMÁGENES: Cuando sugieras esquemas o diagramas visuales, incluye este enlace de búsqueda de Google Imágenes:
   [Ver esquemas visuales](https://www.google.com/search?tbm=isch&q=terminos+de+busqueda)
5. Si el usuario te pide una alineación o formación táctica, menciona claramente la formación (ej: 4-3-3, 4-4-2, 3-5-2 o 4-2-3-1) para que el visor 3D la despliegue.
"""

SYSTEM_PROMPT_VISION = """Eres un sistema experto de visión artificial y OCR avanzado para fútbol.
Tu trabajo es analizar cualquier imagen de una cédula arbitral, acta de partido o lista de jugadores, INCLUSO SI ESTÁ ESCRITA A MANO, POCO LEGIBLE, MANCHADA O DESESTRUCTURADA.

INSTRUCCIONES DE EXTRACCIÓN Y NORMALIZACIÓN:
1. Lee minuciosamente todo el texto impreso y manuscrito (letra a mano).
2. Identifica los nombres de los equipos, el resultado/goles, la fecha, el árbitro y el estadio.
3. Extrae la lista/plantilla de jugadores de cada equipo con sus números y posiciones si están disponibles.
4. Identifica todas las tarjetas (amarillas y rojas) indicando jugador, minuto y equipo.
5. Identifica los goles anotados (jugador, equipo y minuto).
6. Si la imagen es borrosa o tiene partes difíciles de leer, usa contexto futbolístico para inferir nombres legibles y estructurar la cédula de forma 100% limpia y profesional.
7. Devuelve la información estricta y únicamente en el esquema de respuesta especificado.
"""

async def asistente_tecnico_chat(pregunta: str) -> str:
    ultimo_error = None

    for modelo in MODELOS_CANDIDATOS:
        try:
            print(f"[TELEMETRÍA INTERNA] Intentando generación de contenido con el modelo: {modelo}")
            response = await client.aio.models.generate_content(
                model=modelo,
                contents=pregunta,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT_COACH,
                    temperature=0.7,
                ),
            )
            print(f"[TELEMETRÍA INTERNA] Éxito con el modelo: {modelo}")
            return response.text
        except Exception as e:
            print(f"[TELEMETRÍA INTERNA] Fallo con {modelo}: {str(e)}. Pausando 4s por control de cuota...")
            ultimo_error = e
            await asyncio.sleep(4)

    raise RuntimeError(f"Todos los modelos candidatos agotaron su cuota o fallaron. Último error: {ultimo_error}")

async def procesar_cedula_vision(imagen_bytes: bytes) -> CedulaArbitralExtraida:
    ultimo_error = None

    for modelo in MODELOS_CANDIDATOS:
        try:
            print(f"[TELEMETRÍA INTERNA VISION] Procesando OCR/Visión manuscrita con modelo: {modelo}")
            response = await client.aio.models.generate_content(
                model=modelo,
                contents=[
                    types.Part.from_bytes(data=imagen_bytes, mime_type="image/jpeg"),
                    "Analiza esta cédula arbitral / hoja de partido (manuscrita o digital). Extrae y normaliza toda la información de jugadores, goles, tarjetas e incidencias.",
                ],
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT_VISION,
                    response_mime_type="application/json",
                    response_schema=CedulaArbitralExtraida,
                    temperature=0.1,
                ),
            )
            print(f"[TELEMETRÍA INTERNA VISION] Éxito con modelo: {modelo}")
            raw = response.text.strip()
            data = json.loads(raw)
            return CedulaArbitralExtraida(**data)
        except Exception as e:
            print(f"[TELEMETRÍA INTERNA VISION] Fallo con {modelo}: {str(e)}. Pausando 4s por control de cuota...")
            ultimo_error = e
            await asyncio.sleep(4)

    raise RuntimeError(f"Fallo en visión artificial en todos los modelos candidatos. Error: {ultimo_error}")
