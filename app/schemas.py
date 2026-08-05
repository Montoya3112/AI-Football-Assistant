# ════════════════════════════════════════════════════════════════
# 📦 MÓDULO: schemas.py
# 🎯 PROPÓSITO: Modelos de Datos (Schemas Pydantic)
#    Define la estructura de todos los datos que entran y salen
#    de la API. Pydantic valida y serializa automáticamente.
# 🔗 DEPENDENCIAS: pydantic, typing
# 📁 UBICACIÓN: app/schemas.py
# 🗂️  SCHEMAS DEFINIDOS:
#    - MensajeChat         → Entrada del chat IA (pregunta del usuario)
#    - Tarjeta             → Tarjeta arbitral (amarilla/roja)
#    - Incidencia          → Evento del partido (gol, sustitución, etc.)
#    - JugadorPlantilla    → Jugador con número, nombre y posición
#    - GolDetalle          → Gol con jugador, equipo y minuto
#    - CedulaArbitralExtraida → Cédula completa extraída por OCR/IA
#    - RespuestaChat       → Respuesta del asistente IA
#    - RespuestaVision     → Resultado del análisis de imagen
#    - RegistroUsuario     → Datos para registrar nuevo usuario
#    - LoginUsuario        → Credenciales de inicio de sesión
#    - RespuestaAuth       → Token JWT + datos de usuario autenticado
# ════════════════════════════════════════════════════════════════

# ── IMPORTACIONES ──────────────────────────────────────────────
from pydantic import BaseModel, Field
from typing import Optional, List

# ── SCHEMA: Entrada del Chat ───────────────────────────────────
# Recibe la pregunta táctica del usuario desde el frontend.
# Mínimo 1 carácter para evitar consultas vacías.
class MensajeChat(BaseModel):
    mensaje: str = Field(..., min_length=1, description="Consulta del usuario")

# ── SCHEMA: Tarjeta Arbitral ───────────────────────────────────
# Representa una tarjeta (amarilla o roja) en un partido.
# Campos: jugador sancionado, minuto y tipo de sanción.
class Tarjeta(BaseModel):
    jugador: str
    minuto: Optional[int] = None
    tipo: str = Field(default="amarilla", description="amarilla o roja")
    equipo: Optional[str] = None

# ── SCHEMA: Incidencia de Partido ─────────────────────────────
# Evento relevante del partido: lesión, sustitución, incidente.
class Incidencia(BaseModel):
    descripcion: str
    minuto: Optional[int] = None

# ── SCHEMA: Jugador de Plantilla ──────────────────────────────
# Representa un jugador en la lista de convocados.
# Número de dorsal, nombre completo y posición en cancha.
class JugadorPlantilla(BaseModel):
    numero: Optional[int] = None
    nombre: str
    posicion: Optional[str] = None

# ── SCHEMA: Detalle de Gol ────────────────────────────────────
# Registra quién anotó, para qué equipo y en qué minuto.
class GolDetalle(BaseModel):
    jugador: str
    equipo: str
    minuto: Optional[int] = None

# ── SCHEMA: Cédula Arbitral Extraída (OCR) ────────────────────
# Schema principal del módulo de Visión.
# Gemini AI extrae todos estos campos de una imagen de cédula.
# Se usa como response_schema para forzar JSON estructurado.
class CedulaArbitralExtraida(BaseModel):
    equipo_local: str = Field(default="Equipo Local")
    equipo_visitante: str = Field(default="Equipo Visitante")
    goles_local: int = 0
    goles_visitante: int = 0
    fecha: Optional[str] = None
    estadio: Optional[str] = None
    arbitro: Optional[str] = None
    torneo_liga: Optional[str] = None
    jugadores_local: List[JugadorPlantilla] = []
    jugadores_visitante: List[JugadorPlantilla] = []
    tarjetas_amarillas: List[Tarjeta] = []
    tarjetas_rojas: List[Tarjeta] = []
    goles: List[GolDetalle] = []
    incidencias: List[Incidencia] = []
    observaciones_arbitrales: Optional[str] = None

# ── SCHEMA: Respuesta del Chat IA ─────────────────────────────
# Lo que retorna el endpoint /api/v1/futbol/chat al frontend.
# Texto en Markdown generado por Gemini AI.
class RespuestaChat(BaseModel):
    respuesta: str

# ── SCHEMA: Respuesta del Módulo Visión ───────────────────────
# Retorna la cédula extraída + texto raw + si se guardó en DB.
class RespuestaVision(BaseModel):
    cedula: CedulaArbitralExtraida
    raw_text: Optional[str] = None
    inserted: bool = False

# ── SCHEMA: Registro de Nuevo Usuario ─────────────────────────
# Datos requeridos para crear una cuenta en Supabase Auth.
class RegistroUsuario(BaseModel):
    email: str
    password: str
    nombre: Optional[str] = None

# ── SCHEMA: Inicio de Sesión ──────────────────────────────────
# Credenciales para autenticar al usuario en Supabase Auth.
class LoginUsuario(BaseModel):
    email: str
    password: str

# ── SCHEMA: Respuesta de Autenticación ───────────────────────
# Retorna el JWT (access_token) y datos del usuario autenticado.
# El frontend guarda el token en memoria para autorizar requests.
class RespuestaAuth(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
