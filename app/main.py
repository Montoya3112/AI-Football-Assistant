from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from typing import Optional

from .core import supabase
from .schemas import (
    MensajeChat, RespuestaChat, RespuestaVision,
    RegistroUsuario, LoginUsuario, RespuestaAuth
)
from .ai_sports_engine import asistente_tecnico_chat, procesar_cedula_vision

app = FastAPI(
    title="MRCA AI Football Assistant",
    version="1.0.0",
    description="Plataforma Web con IA Futbolística, Modo Invitado & Verificación Supabase - MRCA Solutions",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_path = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

# ═════════════════════════════════════════════════════════════════════
# AUTENTICACIÓN & CONTROL DE ACCESO (INVITADOS Y USUARIOS REGISTRADOS)
# ═════════════════════════════════════════════════════════════════════
async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Permite acceso a Invitados ("guest-access") o valida el token JWT de Supabase
    para usuarios registrados.
    """
    if not authorization:
        # Acceso por defecto como Invitado
        return {"user": "Invitado", "type": "guest"}
    
    token = authorization.replace("Bearer ", "").strip()
    if token == "guest-access" or token == "Invitado" or not token:
        return {"user": "Invitado", "type": "guest"}
    
    # Validar token de usuario registrado con Supabase Auth
    try:
        user_resp = supabase.auth.get_user(token)
        if user_resp and user_resp.user:
            return {
                "id": user_resp.user.id,
                "email": user_resp.user.email,
                "type": "authenticated"
            }
    except Exception:
        pass
    
    return {"user": "Usuario", "token": token, "type": "authenticated"}

# ═════════════════════════════════════════════════════════════════════
# RUTAS DE REGISTRO CON VERIFICACIÓN Y LOGIN
# ═════════════════════════════════════════════════════════════════════
@app.post("/api/v1/auth/register")
async def register(usuario: RegistroUsuario):
    """
    Registra un usuario en Supabase Auth.
    Envía correo de confirmación y exige validación antes de poder iniciar sesión.
    """
    try:
        res = supabase.auth.sign_up({
            "email": usuario.email,
            "password": usuario.password,
            "options": {
                "data": {"nombre": usuario.nombre}
            }
        })
        
        if not res or not res.user:
            raise HTTPException(status_code=400, detail="No se pudo registrar el usuario.")
            
        # Registrar en la tabla publica.usuarios
        try:
            supabase.table("usuarios").insert({
                "id": res.user.id,
                "email": usuario.email,
                "nombre": usuario.nombre,
                "verificado": False
            }).execute()
        except Exception:
            pass

        return {
            "status": "success",
            "message": "✉️ Registro exitoso. Se ha enviado un correo de verificación a tu email. Por favor, confirma tu correo e inicia sesión.",
            "require_verification": True
        }
    except Exception as e:
        err_msg = str(e)
        if "User already registered" in err_msg or "already exists" in err_msg:
            raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")
        raise HTTPException(status_code=400, detail=f"Error en registro: {err_msg}")

@app.post("/api/v1/auth/login", response_model=RespuestaAuth)
async def login(credenciales: LoginUsuario):
    """
    Autentica un usuario registrado en Supabase Auth tras validar su contraseña.
    """
    try:
        res = supabase.auth.sign_in_with_password({
            "email": credenciales.email,
            "password": credenciales.password
        })
        
        if not res or not res.session:
            raise HTTPException(
                status_code=401,
                detail="No se pudo iniciar sesión. Verifica tu contraseña o confirma tu correo electrónico."
            )

        nombre = credenciales.email.split("@")[0]
        if res.user and res.user.user_metadata and "nombre" in res.user.user_metadata:
            nombre = res.user.user_metadata["nombre"]

        return RespuestaAuth(
            access_token=res.session.access_token,
            user={"id": res.user.id, "email": res.user.email, "nombre": nombre}
        )
    except Exception as e:
        err_msg = str(e)
        if "Email not confirmed" in err_msg:
            raise HTTPException(
                status_code=400,
                detail="✉️ Correo no verificado. Por favor, revisa tu bandeja de entrada y confirma tu email antes de entrar."
            )
        if "Invalid login credentials" in err_msg:
            raise HTTPException(status_code=401, detail="Correo electrónico o contraseña incorrectos.")
        raise HTTPException(status_code=400, detail=f"Error de acceso: {err_msg}")

# ═════════════════════════════════════════════════════════════════════
# RUTAS PRINCIPALES DEL ASISTENTE FUTBOLÍSTICO
# ═════════════════════════════════════════════════════════════════════
@app.get("/")
async def root():
    return FileResponse(os.path.join(static_path, "index.html"))

@app.post("/api/v1/futbol/chat", response_model=RespuestaChat)
async def chat(payload: MensajeChat, current_user: dict = Depends(get_current_user)):
    """
    Endpoint del Asistente Técnico (disponible para Invitados y Usuarios Autenticados).
    """
    try:
        respuesta = await asistente_tecnico_chat(payload.mensaje)
        return RespuestaChat(respuesta=respuesta)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/futbol/vision/cedulas", response_model=RespuestaVision)
async def vision_cedulas(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Endpoint de Visión Artificial para procesar cédulas e insertarlas en Supabase.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se aceptan imágenes (JPG, PNG, WEBP)")
    try:
        imagen_bytes = await file.read()
        cedula = await procesar_cedula_vision(imagen_bytes)
        record = cedula.model_dump()
        
        for key in ["tarjetas_amarillas", "tarjetas_rojas", "incidencias"]:
            if isinstance(record.get(key), list):
                record[key] = json.dumps(record[key], ensure_ascii=False)
        
        try:
            supabase.table("reportes_partidos").insert(record).execute()
            inserted = True
        except Exception:
            inserted = False
            
        return RespuestaVision(cedula=cedula, raw_text=str(record), inserted=inserted)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "MRCA AI Football Assistant"}
