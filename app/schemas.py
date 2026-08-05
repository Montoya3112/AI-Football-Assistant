from pydantic import BaseModel, Field
from typing import Optional, List

class MensajeChat(BaseModel):
    mensaje: str = Field(..., min_length=1, description="Consulta del usuario")

class Tarjeta(BaseModel):
    jugador: str
    minuto: Optional[int] = None
    tipo: str = Field(default="amarilla", description="amarilla o roja")
    equipo: Optional[str] = None

class Incidencia(BaseModel):
    descripcion: str
    minuto: Optional[int] = None

class JugadorPlantilla(BaseModel):
    numero: Optional[int] = None
    nombre: str
    posicion: Optional[str] = None

class GolDetalle(BaseModel):
    jugador: str
    equipo: str
    minuto: Optional[int] = None

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

class RespuestaChat(BaseModel):
    respuesta: str

class RespuestaVision(BaseModel):
    cedula: CedulaArbitralExtraida
    raw_text: Optional[str] = None
    inserted: bool = False

class RegistroUsuario(BaseModel):
    email: str
    password: str
    nombre: Optional[str] = None

class LoginUsuario(BaseModel):
    email: str
    password: str

class RespuestaAuth(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
