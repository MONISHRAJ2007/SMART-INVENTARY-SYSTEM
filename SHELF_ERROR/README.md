# AI Shelf Product Mismatch & Misplaced Item Detector (`SHELF_ERROR`)

Computer Vision & Deep Learning microservice and web application for retail and supermarket shelves. Detects when customers take a product and mistakenly or intentionally leave it on the wrong shelf, highlights the misplaced items with visual bounding boxes, and automatically triggers critical alerts to `INVENTARY_SYSTEM`.

---

## 🎯 The Problem It Solves

In physical stores and supermarkets:
- Customers pick up an item from **Shelf B** (e.g. *Books*).
- They walk over to **Shelf A** (e.g. *Tea Powder*), change their mind, and abandon the book on Shelf A.
- This creates inventory mismatch, lost sales, planogram violation, and weight sensor confusion on smart shelves.

**With this solution**:
Store staff or automated shelf cameras upload an image of the shelf. The Computer Vision engine:
1. Identifies each product and its shelf slot.
2. Compares against the shelf planogram.
3. Flags the **Wrong Product** with pulsing red bounding boxes.
4. Tells staff where the product rightfully belongs (e.g. *"Move books to Shelf B"*).
5. Instantly sends a **Critical Webhook Notification** to `INVENTARY_SYSTEM` via Socket.IO!

---

## 🚀 Quick Start

### 1. Start the SHELF_ERROR AI Service
```bash
cd SHELF_ERROR
# Virtual environment is already configured in .venv
.\.venv\Scripts\python.exe server.py
```
The Shelf Error Detection Web UI and API runs on:
👉 **`http://localhost:5050`**

### 2. Run Automated Test Scenarios
```bash
cd SHELF_ERROR
.\.venv\Scripts\python.exe test_detector.py
```

---

## 🔌 API Endpoints

### 1. Upload & Scan Shelf Image
`POST /api/scan` (Multipart Form)
- `shelf`: `"Shelf A"` or `"Shelf B"`
- `image`: Image file (JPEG/PNG/WEBP)
- `samplePreset`: (Optional) `"shelf_a_with_misplaced_book"`, `"shelf_b_with_misplaced_tea"`, etc.

**Response**:
```json
{
  "success": true,
  "data": {
    "shelf": "Shelf A",
    "expectedProduct": "tea powder",
    "totalDetected": 3,
    "correctCount": 2,
    "mismatchCount": 1,
    "hasMismatch": true,
    "mismatches": [
      {
        "slot": "Slot 2 (Center)",
        "detectedItem": "books",
        "expectedItem": "tea powder",
        "rightfulShelf": "Shelf B",
        "confidence": 0.96,
        "action": "Misplaced item: Customer left 'books' on Shelf A. Please re-shelve to Shelf B."
      }
    ],
    "annotatedImage": "data:image/jpeg;base64,...",
    "notificationReceipt": {
      "status": "delivered",
      "code": 200,
      "message": "Notification successfully transmitted to INVENTARY_SYSTEM!"
    }
  }
}
```

### 2. Resolve Mismatch
`POST /api/resolve`
```json
{ "shelf": "Shelf A" }
```
Clears the mismatch and restores the shelf status in `INVENTARY_SYSTEM`.

---

## 🔗 Live Integration with `INVENTARY_SYSTEM`
When a mismatch occurs, `SHELF_ERROR` sends an HTTP POST request to:
`http://localhost:5000/api/shelf/mismatch`
This causes `INVENTARY_SYSTEM` to:
- Create a `critical` notification of type `product_mismatch`.
- Emit `notification:new` and `shelf:mismatch` via Socket.IO.
- Ring the navbar bell badge and play an alert chime.
- Flag the shelf status as `Mismatch` on the Smart Shelf Telemetry dashboard.
