# AI-Enabled Smart Inventory Management System for MSMEs

Production-quality, mobile-responsive MERN stack web application for an AI-powered Smart Inventory Management System. Features real-time ESP32 shelf monitoring using dual HX711 Load Cell sensors, camera barcode billing, AI demand forecasting, intelligent procurement, and ExcelJS reports.

---

## Technical Architecture Overview

```
                          ┌───────────────────────────┐
                          │   ESP32 Load Cell MCU     │
                          │ (Load Cell 1 + Load Cell 2)│
                          └─────────────┬─────────────┘
                                        │ HTTP POST Payload every 5s
                                        ▼
┌──────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│ React 18 + Vite Frontend │ ◄─┤ Express Node.js Backend   ├─► │ Python AI Microservice    │
│ (Tailwind v4 + Recharts) │   │ (Mongoose + Socket.IO)    │   │ (Prophet + Scikit-Learn)  │
└──────────────────────────┘   └─────────────┬─────────────┘   └───────────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │  MongoDB Database (MERN)  │
                               └───────────────────────────┘
```

---

## 1. Prerequisites & Database Setup

### Step 1: Install Prerequisites
- **Node.js**: v18.x or v20.x
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` OR MongoDB Atlas URI.
- **Python**: v3.9 or higher (for AI Microservice)
- **Arduino IDE**: 2.x+ (for flashing ESP32 code)

### Step 2: Environment Variables
Create `.env` file in the `server` directory:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/smart_inventory_db
JWT_SECRET=smart_inventory_secret_key_2026_super_secure
JWT_EXPIRE=30d
AI_SERVICE_URL=http://localhost:8000
```

### Step 3: Seed Database with Initial Data
Run the seeding command inside `server`:
```bash
cd server
npm run seed
```
This seeds the database with default products, categories, suppliers, shelves, and default user accounts:
- **Admin**: `admin@inventory.com` | Password: `password123`
- **Store Manager**: `manager@inventory.com` | Password: `password123`

---

## 2. How to Run the Project

### Option A: Running Backend & Frontend Together

1. **Start Express Backend**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Backend starts on `http://localhost:5000`.

2. **Start React + Vite Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Frontend starts on `http://localhost:5173`.

3. **Start Python AI Service (Optional)**:
   ```bash
   cd ai-service
   pip install -r requirements.txt
   python app.py
   ```
   AI microservice runs on `http://localhost:8000`.

---

## 3. ESP32 Setup & Code Installation

1. Open `esp32/smart_shelf.ino` in Arduino IDE.
2. Install Required Libraries via Library Manager (`Ctrl+Shift+I`):
   - **HX711 Arduino Library** by Bogdan Necula
   - **ArduinoJson** by Benoit Blanchon
3. Update `ssid` and `password` with your WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
4. Update `serverApiUrl` with your computer's local IP address (e.g. `192.168.1.100`):
   ```cpp
   const char* serverApiUrl = "http://192.168.1.100:5000/api/shelf/weight";
   ```
5. Select Board: **ESP32 Dev Module** and Flash the firmware.

---

## 4. Automatic Unit Weight Calibration Guide

1. Navigate to **Product Management** in the Web Dashboard.
2. Locate the target product (e.g., Wireless Mouse) and click **Calibrate**.
3. Place **1 unit** of the item on Load Cell 1 (Shelf A) or Load Cell 2 (Shelf B).
4. Enter the measured unit weight in grams (e.g. `250g`) and acceptable tolerance (e.g. `±10g`).
5. Click **Save Calibration Data**.
6. The system stores the calibrated unit weight, calibration date, status (`Success`), and automatically uses `Math.floor(shelfWeight / unitWeight)` to count shelf units without over-counting noise.

---

## 5. HTTP REST API Documentation & Curl Testing Commands

### ESP32 Weight Telemetry Endpoint:
```bash
curl -X POST http://localhost:5000/api/shelf/weight \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ESP32_01",
    "shelfAWeight": 5000,
    "shelfBWeight": 3500,
    "battery": 100,
    "timestamp": "2026-08-01T10:30:00Z"
  }'
```

### Create POS Barcode Invoice:
```bash
curl -X POST http://localhost:5000/api/billing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "items": [{
      "product": "<PRODUCT_ID>",
      "name": "Wireless Bluetooth Mouse",
      "barcode": "8901234567890",
      "unitPrice": 799,
      "quantity": 1,
      "gstPercentage": 18,
      "gstAmount": 143.82,
      "total": 799
    }],
    "subtotal": 799,
    "totalGst": 143.82,
    "discountPercentage": 0,
    "discountAmount": 0,
    "grandTotal": 943,
    "paymentMethod": "UPI / QR",
    "customerName": "Walk-in Customer"
  }'
```

---

## 6. Features Included

- **Real-Time Smart Shelf Monitoring**: Displays Shelf Name, Current Weight, Math.floor Stock Count, Capacity Filled %, Visual Progress Bar, Verification Status Badge, and Device Battery.
- **Barcode POS Billing System**: Integrated Camera Scanner via `html5-qrcode`, Cart Management, Line-item GST, Discounting, and Invoice Generation.
- **Weight-Based Inventory Verification**: Compares Expected Shelf Weight vs Actual Shelf Weight from ESP32 with tolerance check.
- **Gmail-Style Notification Center**: Unread Badge, Priority Filters (`Critical`, `High`, `Medium`, `Low`), Search, Mark Read, Delete, and Socket.IO live updates.
- **Inventory Audit Trail History**: Tracks Billing, Restock, Calibration, Adjustments, Discrepancies, and ESP32 Updates with Excel Export.
- **AI Demand Forecasting**: Prophet & Scikit-Learn predictions with seasonal pattern analysis.
- **ExcelJS Reports**: Generates downloadable `.xlsx` Daily, Weekly, and Monthly reports.
