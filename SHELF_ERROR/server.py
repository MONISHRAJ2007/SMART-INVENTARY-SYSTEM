import os
import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import requests
import json
import base64
from detector import detector_instance, DEFAULT_PLANOGRAM, INVENTORY_API_BASE
from color_shelf_detector import robust_color_detector

app = FastAPI(
    title="Shelf Product Color Mismatch Detection AI Service",
    description="Vision AI service that detects misplaced products on retail shelves using color anomaly detection and dispatches notifications to INVENTARY_SYSTEM",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "samples"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "uploads"), exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

scan_history: List[Dict[str, Any]] = []

class Base64ScanRequest(BaseModel):
    shelf: str = "Shelf A"
    imageBase64: str
    samplePreset: Optional[str] = None
    mode: str = "color"
    sensitivity: float = 28.0
    slots: int = 0
    scope: str = "all"

class ResolveRequest(BaseModel):
    shelf: str = "Shelf A"

@app.get("/")
def get_dashboard():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Shelf Color Anomaly Detection API is Running."}

@app.get("/api/shelves")
def get_shelves():
    detector_instance.refresh_planogram()
    return {
        "success": True,
        "shelves": detector_instance.planogram,
        "inventoryApiUrl": INVENTORY_API_BASE,
    }

@app.get("/api/samples")
def get_sample_presets():
    samples = [
        {
            "id": "shelf_soap_with_cinthol_mismatch",
            "name": "Soap Shelf - Cinthol Cool Unwanted in Hammam Neem",
            "shelf": "Shelf A",
            "description": "3-Tier retail shelf of green Hammam Neem soaps with 1 unwanted Cinthol Cool soap mixed into Tier 2.",
            "image": "/static/samples/shelf_soap_with_cinthol_mismatch.jpg",
            "expectedOutcome": "UNWANTED PRODUCT: Exactly 1 Cinthol Cool soap detected in Tier 2 - Slot 4 (0 false positives).",
        },
        {
            "id": "real_oil_shelf_multiple_mismatches",
            "name": "Supermarket Oil Rack - Multiple Misplaced Items",
            "shelf": "Shelf A",
            "description": "Supermarket shelf with 3 misplaced foreign items (Blue, Red, and Green packaging).",
            "image": "/static/samples/real_oil_shelf_multiple_mismatches.jpg",
            "expectedOutcome": "COLOR ANOMALIES: 3 Misplaced items detected (Blue, Red, Green).",
        },
        {
            "id": "real_oil_shelf_single_mismatch",
            "name": "Supermarket Oil Rack - 1 Misplaced Item",
            "shelf": "Shelf A",
            "description": "Supermarket shelf with 1 misplaced item (Blue packaging) on Tier 1.",
            "image": "/static/samples/real_oil_shelf_single_mismatch.jpg",
            "expectedOutcome": "COLOR MISMATCH: 1 Misplaced blue item detected in Tier 1.",
        },
        {
            "id": "real_oil_shelf_clean",
            "name": "Supermarket Oil Rack - 100% Clean (All Yellow Pouches)",
            "shelf": "Shelf A",
            "description": "Real supermarket rack with all pouches matching the dominant yellow packaging.",
            "image": "/static/samples/real_oil_shelf_clean.jpg",
            "expectedOutcome": "VERIFIED: 100% compliant, 0 mismatches.",
        },
        {
            "id": "shelf_yellow_oil_with_mismatch",
            "name": "Oil Shelf Single Row - Blue Box Anomaly",
            "shelf": "Shelf A",
            "description": "Row of yellow cooking oil pouches with a foreign blue box.",
            "image": "/static/samples/shelf_yellow_oil_with_mismatch.jpg",
            "expectedOutcome": "COLOR MISMATCH: Blue item on Yellow shelf.",
        },
        {
            "id": "shelf_yellow_oil_clean",
            "name": "Oil Shelf Single Row - Clean Batch",
            "shelf": "Shelf A",
            "description": "All cooking oil pouches are the same yellow color.",
            "image": "/static/samples/shelf_yellow_oil_clean.jpg",
            "expectedOutcome": "VERIFIED: 100% matching color.",
        },
        {
            "id": "shelf_a_with_misplaced_book",
            "name": "Grocery Shelf with Misplaced Book",
            "shelf": "Shelf A",
            "description": "Customer placed a blue textbook from Shelf B onto Shelf A.",
            "image": "/static/samples/shelf_a_with_misplaced_book.jpg",
            "expectedOutcome": "COLOR MISMATCH: Blue book on grocery shelf.",
        },
    ]
    return {"success": True, "samples": samples}

@app.post("/api/scan")
async def scan_shelf(
    shelf: str = Form("Shelf A"),
    mode: str = Form("color"),
    sensitivity: float = Form(28.0),
    slots: int = Form(0),
    scope: str = Form("all"),
    image: Optional[UploadFile] = File(None),
    samplePreset: Optional[str] = Form(None),
):
    try:
        image_bytes = None
        if samplePreset:
            preset_file = os.path.join(STATIC_DIR, "samples", f"{samplePreset}.jpg")
            if not os.path.exists(preset_file):
                preset_file = os.path.join(STATIC_DIR, "samples", samplePreset)
            if os.path.exists(preset_file):
                with open(preset_file, "rb") as f:
                    image_bytes = f.read()
            else:
                raise HTTPException(status_code=404, detail=f"Preset {samplePreset} not found")
        elif image:
            image_bytes = await image.read()
        else:
            raise HTTPException(status_code=400, detail="Either image file or samplePreset must be provided")

        # Color-based anomaly detection (default)
        if mode == "color":
            result = robust_color_detector.analyze_shelf(
                image_bytes,
                shelf_name=shelf,
                sensitivity_threshold=sensitivity,
                num_slots=slots,
                scope=scope
            )
        else:
            result = detector_instance.analyze_shelf_image(image_bytes, shelf_name=shelf)

        # Record scan history
        history_entry = {
            "id": len(scan_history) + 1,
            "shelf": shelf,
            "dominantColor": result.get("dominantColor", "Standard"),
            "hasMismatch": result["hasMismatch"],
            "totalDetected": result["totalDetected"],
            "mismatchCount": result["mismatchCount"],
            "mismatches": [
                {
                    "slot": m["slot"],
                    "detectedItem": m.get("detectedItem", m.get("colorName")),
                    "expectedItem": m.get("expectedItem", result.get("dominantColor")),
                    "rightfulShelf": m.get("rightfulShelf", "Other Shelf"),
                }
                for m in result.get("mismatches", [])
            ],
            "notified": (result.get("notificationReceipt") or {}).get("status") == "delivered",
            "timestamp": cv2_timestamp_str(),
        }
        scan_history.insert(0, history_entry)
        if len(scan_history) > 20:
            scan_history.pop()

        return {"success": True, "data": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/scan/base64")
async def scan_shelf_base64(req: Base64ScanRequest):
    try:
        if req.samplePreset:
            preset_file = os.path.join(STATIC_DIR, "samples", f"{req.samplePreset}.jpg")
            if not os.path.exists(preset_file):
                preset_file = os.path.join(STATIC_DIR, "samples", req.samplePreset)
            if os.path.exists(preset_file):
                with open(preset_file, "rb") as f:
                    image_input = f.read()
            else:
                raise HTTPException(status_code=404, detail="Preset not found")
        else:
            image_input = req.imageBase64

        if req.mode == "color":
            result = robust_color_detector.analyze_shelf(
                image_input,
                shelf_name=req.shelf,
                sensitivity_threshold=req.sensitivity,
                num_slots=req.slots,
                scope=req.scope
            )
        else:
            result = detector_instance.analyze_shelf_image(image_input, shelf_name=req.shelf)

        return {"success": True, "data": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/resolve")
def resolve_mismatch(req: ResolveRequest):
    try:
        resp = requests.post(
            f"{INVENTORY_API_BASE}/shelf/mismatch/resolve",
            json={"shelf": req.shelf},
            timeout=3.0
        )
        if resp.status_code == 200:
            return {"success": True, "message": f"Product mismatch resolved for {req.shelf} in INVENTARY_SYSTEM"}
        return {"success": False, "message": f"Inventory server error: {resp.text}"}
    except Exception as e:
        return {"success": False, "message": f"Could not connect to inventory system: {str(e)}"}

@app.get("/api/history")
def get_history():
    return {"success": True, "history": scan_history}

def cv2_timestamp_str():
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5050))
    print(f"[SHELF_ERROR AI Service] Starting server on http://localhost:{port}")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
