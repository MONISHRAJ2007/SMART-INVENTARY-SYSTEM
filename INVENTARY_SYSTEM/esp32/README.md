# ESP32 Smart Shelf Integration & Weight Calibration Guide

This guide details hardware wiring, firmware installation, REST payload format, and weight calibration procedures for integrating ESP32 with dual HX711 Load Cell sensors.

---

## 1. Hardware Pinout & Wiring Diagram

### Component List
- 1x ESP32 Dev Board
- 2x HX711 Load Cell Amplifier Modules
- 2x Load Cell Sensors (e.g., 5kg or 10kg rated)
- Jumper Wires & Breadboard

### Pin Connections

#### Load Cell 1 (Shelf A) -> HX711 Module 1
| Load Cell Wire | HX711 Terminal |
|---|---|
| Red Wire | E+ (Excitation +) |
| Black Wire | E- (Excitation -) |
| White Wire | A- (Signal -) |
| Green Wire | A+ (Signal +) |

#### HX711 Module 1 -> ESP32
| HX711 Pin | ESP32 GPIO Pin |
|---|---|
| VCC | 3.3V or 5V |
| GND | GND |
| DT (Data) | GPIO 16 |
| SCK (Clock) | GPIO 4 |

#### Load Cell 2 (Shelf B) -> HX711 Module 2
| Load Cell Wire | HX711 Terminal |
|---|---|
| Red Wire | E+ |
| Black Wire | E- |
| White Wire | A- |
| Green Wire | A+ |

#### HX711 Module 2 -> ESP32
| HX711 Pin | ESP32 GPIO Pin |
|---|---|
| VCC | 3.3V or 5V |
| GND | GND |
| DT (Data) | GPIO 17 |
| SCK (Clock) | GPIO 18 |

---

## 2. Weight Calibration Procedure

To ensure 100% accurate weight measurement:

1. **Tare (Zeroing)**:
   - Ensure both shelves are completely empty.
   - Open Serial Monitor in Arduino IDE (Baud rate `115200`).
   - Type `TARE_A` to zero Shelf A.
   - Type `TARE_B` to zero Shelf B.

2. **Unit Weight Calibration**:
   - In the web dashboard, navigate to **Product Management**.
   - Click **Calibrate Weight** on a product.
   - Place exactly ONE unit of the product (e.g., 1 Wireless Mouse = 250g) onto the load cell.
   - Click **Calibrate** in the UI.
   - The web app stores the unit weight (250g), tolerance (±10g), calibration date, and status.

3. **Finding Scale Factor (if using raw values)**:
   - Place a known test weight (e.g., 500g) on Load Cell 1.
   - Adjust `calibrationFactorA` in `smart_shelf.ino` until the serial monitor outputs exactly `500 g`.

---

## 3. ESP32 HTTP REST Payload Specification

The ESP32 sends an HTTP POST request to `http://<SERVER_IP>:5000/api/shelf/weight` every 5 seconds.

### JSON Payload:
```json
{
  "deviceId": "ESP32_01",
  "shelfAWeight": 5000,
  "shelfBWeight": 3500,
  "battery": 100,
  "timestamp": "2026-08-01T10:30:00Z"
}
```

### Curl Command for Manual Testing / Simulation:
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
