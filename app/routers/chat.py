from fastapi import APIRouter, HTTPException
from ..schemas import MensajeChat
from ..ai_sports_engine import get_coach_advice

router = APIRouter(prefix="/api/v1/futrol/chat", tags=["chat"])

@router.post("/")
async def chat_endpoint(payload: MensajeChat):
    try:
        respuesta = await get_coach_advice(payload.mensaje)
        return {"respuesta": respuesta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
