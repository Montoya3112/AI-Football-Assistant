from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

class RegistroUsuario(BaseModel):
    nombre: str = Field(..., min_length=2, description="Nombre completo")
    email: str = Field(..., description="Correo electrónico válido")
    password: str = Field(..., min_length=6, description="Contraseña mínimo 6 caracteres")

class LoginUsuario(BaseModel):
    email: str = Field(..., description="Correo electrónico registrado")
    password: str = Field(..., description="Contraseña del usuario")

class RespuestaAuth(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class MensajeChat(BaseModel):
    mensaje: str = Field(..., min_length=1, description="Consulta del usuario")

class Tarjeta(BaseModel):
    jugador: str
    minuto: Optional[int] = None
    tipo: str = Field(default="amarilla", description="amarilla o roja")

class Incidencia(BaseModel):
    descripcion: str
    minuto: Optional[int] = None

class CedulaArbitralExtraida(BaseModel):
    equipo_local: str
    equipo_visitante: str
    goles_local: int = 0
    goles_visitante: int = 0
    fecha: Optional[str] = None
    estadio: Optional[str] = None
    arbitro: Optional[str] = None
    tarjetas_amarillas: List[Tarjeta] = []
    tarjetas_rojas: List[Tarjeta] = []
    incidencias: List[Incidencia] = []

class RespuestaChat(BaseModel):
    respuesta: str

class RespuestaVision(BaseModel):
    cedula: CedulaArbitralExtraida
    raw_text: Optional[str] = None
    inserted: bool = False
