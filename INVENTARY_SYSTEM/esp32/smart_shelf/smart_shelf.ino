/*
 * AI-Enabled Smart Inventory Management System - ESP32 Firmware
 * 
 * Hardware:
 * - ESP32 MCU
 * - Load Cell 1 + HX711 (Shelf A)
 * - Load Cell 2 + HX711 (Shelf B)
 * - WiFi Connection to MERN Stack REST API
 * 
 * Circuit Wiring Pinouts:
 * 
 * Load Cell 1 (Shelf A) -> HX711 Module 1:
 * - Red Wire   -> E+
 * - Black Wire -> E-
 * - White Wire -> A-
 * - Green Wire -> A+
 * HX711 Module 1 -> ESP32:
 * - VCC  -> 3.3V / 5V
 * - GND  -> GND
 * - DT   -> GPIO 16
 * - SCK  -> GPIO 4
 * 
 * Load Cell 2 (Shelf B) -> HX711 Module 2:
 * - Red Wire   -> E+
 * - Black Wire -> E-
 * - White Wire -> A-
 * - Green Wire -> A+
 * HX711 Module 2 -> ESP32:
 * - VCC  -> 3.3V / 5V
 * - GND  -> GND
 * - DT   -> GPIO 17
 * - SCK  -> GPIO 18
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "HX711.h"

// WiFi Credentials
const char* ssid = "POCO M5";
const char* password = "123456789";

// Server API Endpoint (Replace IP with your computer's local IP address)
const char* serverApiUrl = "http://192.168.137.1:5000/api/shelf/weight";

// HX711 Pin Definitions
#define LOADCELL_A_DOUT_PIN  13
#define LOADCELL_A_SCK_PIN   14

#define LOADCELL_B_DOUT_PIN  25
#define LOADCELL_B_SCK_PIN   26

HX711 scaleA;
HX711 scaleB;

// Calibration Scale Factors (Adjust these based on physical calibration)
float calibrationFactorA = 228.0; // Calibration factor for Load Cell 1
float calibrationFactorB = 225.0; // Calibration factor for Load Cell 2

String deviceId = "ESP32_01";
int batteryLevel = 50; // 100% for mains USB power

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("==================================================");
  Serial.println("Smart Inventory System - ESP32 Load Cell Firmware");
  Serial.println("==================================================");

  // Initialize HX711 Load Cell A
  scaleA.begin(LOADCELL_A_DOUT_PIN, LOADCELL_A_SCK_PIN);
  scaleA.set_scale(calibrationFactorA);
  scaleA.tare(); // Tare to zero

  // Initialize HX711 Load Cell B
  scaleB.begin(LOADCELL_B_DOUT_PIN, LOADCELL_B_SCK_PIN);
  scaleB.set_scale(calibrationFactorB);
  scaleB.tare(); // Tare to zero

  Serial.println("[HX711] Load Cells initialized and tared to 0g.");

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("[WiFi] Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connected! IP Address: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read weights in grams
    long weightA = scaleA.get_units(5); // Average 5 readings
    long weightB = scaleB.get_units(5);

    // Prevent negative numbers due to noise
    if (weightA < 0) weightA = 0;
    if (weightB < 0) weightB = 0;

    Serial.printf("[Sensor Read] Shelf A: %ld g | Shelf B: %ld g\n", weightA, weightB);

    // Construct JSON Payload
    HTTPClient http;
    http.begin(serverApiUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["deviceId"] = deviceId;
    doc["shelfAWeight"] = weightA;
    doc["shelfBWeight"] = weightB;
    doc["battery"] = batteryLevel;
    doc["timestamp"] = "2026-08-01T10:30:00Z";

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    // Send HTTP POST
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("[HTTP POST] Success Code: %d | Server Reply: %s\n", httpResponseCode, response.c_str());
    } else {
      Serial.printf("[HTTP POST] Error Code: %d (%s)\n", httpResponseCode, http.errorToString(httpResponseCode).c_str());
    }

    http.end();
  } else {
    Serial.println("[WiFi Error] Disconnected. Reconnecting...");
    WiFi.reconnect();
  }

  // Handle Serial Commands for Calibration (TARE / CALIBRATE)
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "TARE_A") {
      scaleA.tare();
      Serial.println("[Command] Shelf A Tared!");
    } else if (cmd == "TARE_B") {
      scaleB.tare();
      Serial.println("[Command] Shelf B Tared!");
    }
  }

  // Wait 5 seconds before next reading
  delay(1000);
}
