#include <ESP32Servo.h>
#include <WiFi.h>
#include <WebServer.h>

// WiFi credentials - UPDATE THESE WITH YOUR NETWORK DETAILS
const char* ssid = "hotshot";
const char* password = "admin123";

// Servo configuration
#define SERVO_PIN 18
Servo gateServo;

// Web server
WebServer server(80);

// Status LED (optional - connect to GPIO 2)
#define LED_PIN 2

void setup() {
  Serial.begin(115200);

  // Initialize servo
  gateServo.attach(SERVO_PIN);
  gateServo.write(0); // Start closed (0 degrees)

  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
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

void handleOpen() {
  Serial.println("Received /open request");
  gateServo.write(90); // Open position (90 degrees)
  digitalWrite(LED_PIN, HIGH); // LED on to indicate open
  server.send(200, "text/plain", "Gate opened");
  Serial.println("Gate opened to 90 degrees");
}

void handleClose() {
  Serial.println("Received /close request");
  gateServo.write(0); // Closed position (0 degrees)
  digitalWrite(LED_PIN, LOW); // LED off to indicate closed
  server.send(200, "text/plain", "Gate closed");
  Serial.println("Gate closed to 0 degrees");
}

void handleStatus() {
  Serial.println("Received /status request");
  int pos = gateServo.read();
  String response = "Gate position: " + String(pos) + " degrees";
  server.send(200, "text/plain", response);
  Serial.println("Status sent: " + response);
}
