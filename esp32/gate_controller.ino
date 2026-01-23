// Gate Controller ESP32 Firmware
// Handles opening gate via laptop-triggered HTTP endpoints (no camera)

#include <WiFi.h>
#include <ESP32Servo.h>
#include <WebServer.h>

#define SERVO_PIN 12
#define RELAY_PIN 13
#define GATE_OPEN_TIME 5000  // 5 seconds

Servo gateServo;
WebServer server(80);

// WiFi credentials - UPDATE THESE WITH YOUR NETWORK DETAILS
const char* ssid = "hotshot";
const char* password = "admin123";

// Forward declarations
void openGate();
void handleOpen();
void handleClose();
void handleStatus();

void setup() {
  Serial.begin(115200);
  Serial.println();

  // Initialize servo and relay
  gateServo.attach(SERVO_PIN);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Setup HTTP endpoints
  server.on("/open", HTTP_POST, handleOpen);
  server.on("/close", HTTP_POST, handleClose);
  server.on("/status", HTTP_GET, handleStatus);

  server.begin();
  Serial.println("HTTP server started on port 80");
}

void loop() {
  server.handleClient();
}

void openGate() {
  Serial.println("Opening gate");
  gateServo.write(90);  // Open position
  digitalWrite(RELAY_PIN, HIGH);  // Activate relay if needed
  delay(GATE_OPEN_TIME);
  gateServo.write(0);   // Close position
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("Gate closed");
}

void handleOpen() {
  Serial.println("Received /open request");
  openGate();
  server.send(200, "text/plain", "Gate opened");
  Serial.println("Gate opened via /open");
}

void handleClose() {
  Serial.println("Received /close request");
  gateServo.write(0); // Closed position
  digitalWrite(RELAY_PIN, LOW);
  server.send(200, "text/plain", "Gate closed");
  Serial.println("Gate closed via /close");
}

void handleStatus() {
  int pos = gateServo.read();
  String response = "Gate position: " + String(pos) + " degrees";
  server.send(200, "text/plain", response);
  Serial.println("Status sent: " + response);
}
