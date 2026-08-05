# ════════════════════════════════════════════════════════════════
# 📦 MÓDULO: ai_sports_engine.py
# 🎯 PROPÓSITO: Motor de Inteligencia Artificial Futbolística
#    - Procesa consultas tácticas via Gemini API
#    - Realiza OCR/Visión sobre cédulas arbitrales manuscritas
# 🔗 DEPENDENCIAS: google-genai, asyncio, core.py, schemas.py
# 📁 UBICACIÓN: app/ai_sports_engine.py
# ════════════════════════════════════════════════════════════════

# ── IMPORTACIONES ──────────────────────────────────────────────
import json
import asyncio
import os
from .core import client
from .schemas import CedulaArbitralExtraida
from google.genai import types

# ── LISTA DE MODELOS CANDIDATOS (Fallback Chain) ───────────────
# Si el primer modelo supera su cuota o falla, el sistema
# intenta automáticamente con el siguiente en la lista.
# Cuota máxima: 15 RPM (Requests Per Minute) en Free Tier.
MODELOS_CANDIDATOS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash-lite",
]

# ── SYSTEM PROMPT — DIRECTOR TÉCNICO IA ────────────────────────
# Instrucción de sistema que define el rol, personalidad y restricciones
# del asistente. RESTRICCIÓN CRÍTICA: Solo responde sobre fútbol.
# Si detecta pregunta fuera de dominio → emite "Tarjeta Amarilla".
SYSTEM_PROMPT_COACH = """Eres un Director Técnico y Analista Táctico de fútbol de élite mundial con más de 30 años de experiencia.

REGLA CRÍTICA DE RESTRICCIÓN DE DOMINIO (ESTRICTA):
- Estás programado EXCLUSIVAMENTE para responder sobre FÚTBOL (tácticas, alineaciones, jugadores, ligas, torneos, reglamentos FIFA, estadísticas xG, preparación física futbolística y análisis de partidos).
- SI EL USUARIO HACE CUALQUIER PREGUNTA QUE NO SEA SOBRE FÚTBOL (por ejemplo: química, física, fórmulas científicas, matemáticas, recetas de cocina, tareas escolares, historia general, otros deportes como baloncesto o béisbol, programación, noticias generales, etc.), DEBES RECHAZAR LA CONSULTA ROTUNDAMENTE Y SIN EXCEPCIÓN.
- NO respondas la pregunta externa ni intentes justificarla o relacionarla con el fútbol. RECHÁZALA DIRECTAMENTE.
- Formato obligatorio de rechazo para preguntas fuera de fútbol:
  "⛔ **¡Tarjeta Amarilla por fuera de juego!** Como Asistente Especializado en Fútbol de MRCA Solutions, mi sistema está enfocado **exclusivamente en fútbol** (tácticas, alineaciones, datos de jugadores, reglamentos y preparación física deportiva). No tengo permitido responder sobre otros temas ajenos al balón pie. Por favor, hazme una consulta relacionada con el fútbol."

REGLAS DE RESPUESTA:
1. Responde SIEMPRE en español con tono profesional, apasionado y directo.
2. Formatea tu respuesta usando Markdown estructurado.
3. REGLA YOUTUBE (ANTI-ALUCINACIONES): NUNCA inventes enlaces directos a videos específicos de YouTube. Si vas a recomendar videos, genera UNICAMENTE enlaces de búsqueda con el formato exacto:
   [Ver análisis en YouTube](https://www.youtube.com/results?search_query=terminos+de+busqueda+con+signos+de+suma)
4. REGLA IMÁGENES: Cuando sugieras esquemas o diagramas visuales, incluye este enlace de búsqueda de Google Imágenes:
   [Ver esquemas visuales](https://www.google.com/search?tbm=isch&q=terminos+de+busqueda)
5. Si el usuario te pide una alineación o formación táctica de cualquier equipo o selección (ej: Real Madrid, Barcelona, Manchester City, PSG, Bayern, Argentina, México, etc.), menciona claramente la formación (ej: 4-3-3, 4-4-2, 3-5-2 o 4-2-3-1) y lista los 11 jugadores en una lista numerada del 1 al 11 (iniciando con el Portero), para que la Pizarra Táctica 3D renderice automáticamente la plantilla exacta requerida.
"""

# ── SYSTEM PROMPT — VISIÓN ARTIFICIAL OCR ──────────────────────
# Instrucción para el módulo de visión de Gemini.
# Extrae información de cédulas arbitrales: equipos, goles,
# tarjetas, jugadores e incidencias, incluso de imágenes manuscritas.
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

# ── FUNCIÓN: asistente_tecnico_chat ────────────────────────────
# ENTRADA : pregunta (str) — consulta táctica del usuario
# SALIDA  : respuesta (str) — análisis generado por Gemini AI
# PROCESO : Itera sobre MODELOS_CANDIDATOS con pausa de 4s entre fallos
#           para respetar el límite de cuota RPM del Free Tier.
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

# ── FUNCIÓN: procesar_cedula_vision ────────────────────────────
# ENTRADA : imagen_bytes (bytes) — imagen JPG/PNG de la cédula arbitral
# SALIDA  : CedulaArbitralExtraida (schema Pydantic con todos los campos)
# PROCESO : Envía la imagen + instrucción a Gemini Vision.
#           Solicita respuesta en formato JSON estrictamente tipado.
#           Parsea el JSON y retorna el schema validado.
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
