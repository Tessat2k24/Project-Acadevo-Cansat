#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>

// --- GS PINOUT (ESP32 30-PIN V1) ---
#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_NSS 5   
#define LORA_RST 14  
#define LORA_DIO0 2   

void setup() {
  Serial.begin(115200);
  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) { Serial.println("LoRa Error"); while(1); }
  
  LoRa.setSpreadingFactor(7);
  LoRa.setSyncWord(0x12);
  
  Serial.println("\n--- TESSAT-025 GROUND STATION: 19-PARAM MODE ---");
  Serial.println("LEGEND: teamId, timeMs, pkt, alt, pres, temp, volt, gTime, lat, lon, gAlt, sats, ax, ay, az, gx, gy, gz, state\n");
}

void loop() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String incoming = "";
    while (LoRa.available()) incoming += (char)LoRa.read();

    // Clean any hidden newline characters from the LoRa transmission
    incoming.trim(); 

    // Get Signal Strength
    int rssi = LoRa.packetRssi();
    
    // OUTPUT CLEAN CSV ONLY!
    // This takes the 19 parameters from the CanSat and adds the RSSI as the 20th parameter.
    Serial.println(incoming + "," + String(rssi));
  }

  // Uplink Command Handling
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n'); cmd.trim();
    LoRa.beginPacket(); LoRa.print(cmd); LoRa.endPacket();
    Serial.println(">>> UPLINK SENT: " + cmd);
  }
}