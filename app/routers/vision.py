from fastapi import APIRouter, File, UploadFile, HTTPException
from ..schemas import ResultadoVision
from ..ai_sports_engine import process_vision

router = APIRouter(prefix="/api/v1/futrol/vision/cedulas", tags=["vision"])

@router.post("/", response_model=ResultadoVision)
async def vision_endpoint(file: UploadFile = File(...)):
    try:
        # Read image bytes (placeholder for OCR)
        _ = await file.read()
        raw_text = "Extracted OCR text placeholder"
        result = await process_vision(raw_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
