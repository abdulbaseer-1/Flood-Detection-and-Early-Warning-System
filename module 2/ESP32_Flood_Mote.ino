#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// --- Project Configuration ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "YOUR_BROKER_IP"; // E.g., "192.168.1.10"
const char* mote_id = "MOTE_Peshawar_01";

// --- Pin Assignments ---
#define TRIG_PIN 5
#define ECHO_PIN 18
#define FLOW_SENSOR_PIN 21
#define DHT_PIN 4
#define DHT_TYPE DHT22

// --- Objects & Globals ---
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHT_PIN, DHT_TYPE);
volatile long pulseCount = 0;

// Interrupt for Flow Sensor
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

// --- Task 02: CRC-8 Generation (Error Detection) ---
uint8_t calculateCRC8(String data) {
  uint8_t crc = 0x00;
  for (int i = 0; i < data.length(); i++) {
    uint8_t extract = data[i];
    for (uint8_t j = 8; j; j--) {
      uint8_t sum = (crc ^ extract) & 0x01;
      crc >>= 1;
      if (sum) crc ^= 0x8C;
      extract >>= 1;
    }
  }
  return crc;
}

// --- Task 02: Reliability (MQTT Reconnection) ---
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(mote_id)) {
      Serial.println("connected");
      client.subscribe("flood/commands"); // For retransmission requests
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000); // 5 sec wait before retransmission attempt
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, RISING);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // 1. Data Acquisition & Unit Conversion
  // Water Height (Meters)
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  float water_height = (pulseIn(ECHO_PIN, HIGH) * 0.0343) / 2 / 100;

  // Flow Rate (m^3/s)
  float flow_rate = (pulseCount / 7.5) / 60000.0; 
  pulseCount = 0;

  // Temperature (Kelvin)
  float temp_k = dht.readTemperature() + 273.15;

  // 2. Task 02: Serialization (JSON)
  StaticJsonDocument<512> doc;
  doc["mote_id"] = mote_id;
  doc["water_height"] = water_height;
  doc["flow_rate"] = flow_rate;
  doc["temp_k"] = temp_k;
  doc["lat"] = 34.0151; // Hardcoded coordinate
  doc["lon"] = 71.5249;

  String payload;
  serializeJson(doc, payload);

  // 3. Task 02: Integrity (CRC Injection)
  uint8_t crc = calculateCRC8(payload);
  doc["crc"] = crc;

  String finalMessage;
  serializeJson(doc, finalMessage);

  // 4. Task 02: Delivery & Error Handling
  if (client.publish("flood/telemetry", finalMessage.c_str())) {
    Serial.println("Data Delivered: " + finalMessage);
  } else {
    Serial.println("Delivery Failed. Retransmitting in next cycle...");
  }

  delay(10000); 
}
