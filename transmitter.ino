#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <LoRa.h>
#include <Preferences.h>
#include <ESP32Servo.h>
#include <Adafruit_BMP085.h>
#include <Adafruit_MPU6050.h>
#include <RTClib.h>
#include <TinyGPSPlus.h>

// --- PINOUT (LOCKED) ---
#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_NSS 16
#define LORA_RST 4
#define LORA_DIO0 17
#define I2C1_SDA 21
#define I2C1_SCL 22
#define I2C2_SDA 26
#define I2C2_SCL 33
#define GPS_RX_PIN 35 
#define GPS_TX_PIN 27 
#define LED_PIN 2
#define BUZZER_PIN 14
#define BAT_ADC 34
#define SERVO_PIN 13

// --- MISSION CONFIG ---
const char TEAM_ID[] = "Cansat-025";
const float V_DIV_RATIO = 4.0; // 14.1k/4.7k divider
const int SERVO_CLOSED = 90;
const int SERVO_OPEN = 180;

// --- OBJECTS ---
TwoWire I2C_Sensors = TwoWire(0);
TwoWire I2C_RTC = TwoWire(1);
Adafruit_BMP085 bmp;
Adafruit_MPU6050 mpu;
RTC_DS3231 rtc;
TinyGPSPlus gps;
HardwareSerial GPS_Serial(1);
Servo parachuteServo;
Preferences prefs;

// --- MISSION VARIABLES ---
enum FlightState { STATE_LAUNCH_PAD=2, STATE_ASCENT=3, STATE_DESCENT=5, STATE_AEROBRAKE_RELEASE=6, STATE_IMPACT=7, STATE_RECOVERY=8 };
FlightState flightState = STATE_LAUNCH_PAD;

float baseAltitude = 0.0f;
bool calValid = true;
uint32_t packetCount = 0;
unsigned long missionStartMillis = 0;
unsigned long lastTelemetryMillis = 0;
float peakAltitude = 0.0f;

// --- UTILS ---
float getVoltage() { return (analogRead(BAT_ADC) / 4095.0) * 3.3 * V_DIV_RATIO; }

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  I2C_Sensors.begin(I2C1_SDA, I2C1_SCL);
  I2C_RTC.begin(I2C2_SDA, I2C2_SCL);
  
  bmp.begin(0x77, &I2C_Sensors);
  mpu.begin(0x68, &I2C_Sensors);
  rtc.begin(&I2C_RTC);

  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);
  if (LoRa.begin(433E6)) {
    LoRa.setSpreadingFactor(7);
    LoRa.setSyncWord(0x12);
  }

  GPS_Serial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  parachuteServo.attach(SERVO_PIN);
  parachuteServo.write(SERVO_CLOSED);

  prefs.begin("mission", false);
  flightState = (FlightState)prefs.getInt("state", 2);
  baseAltitude = prefs.getFloat("base", 0.0f);
  calValid = prefs.getBool("v", false);

  missionStartMillis = millis();
}

void loop() {
  while (GPS_Serial.available() > 0) gps.encode(GPS_Serial.read());

  // Listen for Uplink Commands
  if (LoRa.parsePacket()) {
    String cmd = ""; while (LoRa.available()) cmd += (char)LoRa.read();
    cmd.trim(); cmd.toUpperCase();
    if (cmd == "CALIB") { baseAltitude = bmp.readAltitude(); calValid = true; prefs.putFloat("base", baseAltitude); prefs.putBool("v", true); }
    if (cmd == "SERVO OPEN") parachuteServo.write(SERVO_OPEN);
    if (cmd == "SERVO CLOSE") parachuteServo.write(SERVO_CLOSED);
  }

  if (millis() - lastTelemetryMillis >= 1000) {
    lastTelemetryMillis = millis();

    sensors_event_t a, g, t;
    mpu.getEvent(&a, &g, &t);
    float currentAlt = bmp.readAltitude();
    float displayAlt = calValid ? (currentAlt - baseAltitude) : currentAlt;

    // BUILD 19-PARAMETER CSV
    String csv = String(TEAM_ID) + ",";                             // 1. teamId
    csv += String(millis() - missionStartMillis) + ",";             // 2. timeStampMs
    csv += String(packetCount) + ",";                               // 3. packetCount
    csv += String(displayAlt, 1) + ",";                             // 4. altitude
    csv += String(bmp.readPressure()) + ",";                        // 5. pressure
    csv += String(bmp.readTemperature(), 1) + ",";                  // 6. temp
    csv += String(getVoltage(), 2) + ",";                           // 7. voltage
    
    char timeBuf[10]; sprintf(timeBuf, "%02d:%02d:%02d", gps.time.hour(), gps.time.minute(), gps.time.second());
    csv += String(timeBuf) + ",";                                   // 8. gnssTime
    csv += String(gps.location.lat(), 6) + ",";                     // 9. gnssLat
    csv += String(gps.location.lng(), 6) + ",";                     // 10. gnssLon
    csv += String(gps.altitude.meters(), 1) + ",";                  // 11. gnssAlt
    csv += String(gps.satellites.value()) + ",";                    // 12. gnssSats
    
    csv += String(a.acceleration.x, 2) + ",";                       // 13. accelX
    csv += String(a.acceleration.y, 2) + ",";                       // 14. accelY
    csv += String(a.acceleration.z, 2) + ",";                       // 15. accelZ
    csv += String(g.gyro.x, 2) + ",";                               // 16. gyroX
    csv += String(g.gyro.y, 2) + ",";                               // 17. gyroY
    csv += String(g.gyro.z, 2) + ",";                               // 18. gyroZ
    
    csv += String(flightState);                                     // 19. flightState

    // Transmit
    digitalWrite(LED_PIN, HIGH);
    LoRa.beginPacket(); LoRa.print(csv); LoRa.endPacket();
    digitalWrite(LED_PIN, LOW);
    Serial.println(csv);

    // Flight Logic
    if (flightState == STATE_LAUNCH_PAD && displayAlt > 200.0) { flightState = STATE_ASCENT; peakAltitude = displayAlt; }
    if (flightState == STATE_ASCENT) { 
        if (displayAlt > peakAltitude) peakAltitude = displayAlt; 
        if (displayAlt < (peakAltitude - 15.0)) flightState = STATE_DESCENT; 
    }
    if (flightState == STATE_DESCENT && displayAlt <= 600.0) { flightState = STATE_AEROBRAKE_RELEASE; parachuteServo.write(SERVO_OPEN); digitalWrite(BUZZER_PIN, HIGH); }
    if (displayAlt < 3.0 && flightState >= STATE_DESCENT) flightState = STATE_RECOVERY;

    packetCount++;
    if (packetCount % 5 == 0) prefs.putInt("state", (int)flightState);
  }
}