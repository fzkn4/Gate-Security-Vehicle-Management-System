# Gate Security - Vehicle Management System

A modern QR code-based vehicle entry/exit management system with a beautiful UI.

## Features

- **QR Code Scanning**: Real-time QR code scanning for vehicle entry/exit tracking (app-based and ESP32 hardware)
- **ESP32 Gate Automation**: Hardware-based QR scanning at gates with automated boom control for hands-free entry/exit
- **User Management**: Admin-controlled user management with role-based access
- **Vehicle Management**: Register vehicles and generate QR codes
- **Entry/Exit Tracking**: Automatic in/out tracking (first scan = in, second scan = out)
- **Dashboard**: Real-time statistics and visualizations with charts
- **History & Analytics**: View and filter entry/exit history
- **Settings**: User profile and password management
- **Modern UI**: Beautiful, responsive design with purple/blue theme

## Tech Stack

### Backend

- Python Flask
- SQLAlchemy (SQLite database)
- Flask-JWT-Extended (Authentication)
- QRCode generation library

### Frontend

- React.js with Vite
- React Router
- Axios for API calls
- Recharts for data visualization
- React Icons
- HTML5-QRCode for scanning

### Hardware (ESP32)

- ESP32 Microcontroller
- Servo/DC Motor for boom barrier control

## Hardware Requirements

### ESP32 Components

- **ESP32 Board**: ESP32-CAM (recommended, ~$10-15) or ESP32-WROOM-32 with external camera
- **Motor**: Servo motor (e.g., SG90, ~$5) or DC motor with driver (e.g., L298N) for boom control

### Software Tools

- Arduino IDE (with ESP32 board support)
- MQTT Broker (Mosquitto, install locally or use cloud)
- Libraries: ESP32QRCodeReader, PubSubClient, Servo
### ESP32 Gate Controller (No Camera)
- Firmware provides HTTP endpoints to open/close the gate and query status without relying on a camera.
- Endpoints:
  - POST /open  - Opens the gate for the configured duration
  - POST /close - Closes the gate
  - GET  /status - Returns current gate position in degrees
- Hardware mappings:
  - SERVO_PIN: GPIO 12
  - RELAY_PIN: GPIO 13
- Gate timing:
  - GATE_OPEN_TIME: 5000 ms
- Interaction examples:
  - curl -X POST http://<ESP32_IP>/open
  - curl -X POST http://<ESP32_IP>/close
  - curl http://<ESP32_IP>/status
- Security:
  - Keep WiFi credentials out of source; consider adding basic auth or token checks on endpoints for production.
- Network:
  - ESP32 IP typically assigned via DHCP; consider static IP for predictable addressing.

### Client-Side Scanning (Laptop/Desktop)
- Scanning happens on the client device (built-in or USB camera).
- The client uses a QR scanning library (HTML5 QR code) to scan registered vehicle QR codes.
- On successful scan:
  - The UI displays vehicle information
  - The UI issues an HTTP POST to the ESP32 /open endpoint to grant entry
- Security: Only expose ESP32 endpoints within a trusted network; consider token-based authentication for production.
- End-to-end flow: Client scans QR on device -> Frontend validates -> Backend confirms vehicle -> Frontend triggers ESP32 /open -> Gate opens for 5 seconds

### End-to-End Flow (QR to Gate)
The following ASCII diagram illustrates the flow from client-side scanning to the ESP32 gate action.
```
+----------------------+     +----------------------+     +-------------------+     +-------------------+
| Client Device (QR)   | --> | Frontend QR Scanner  | --> | Backend (Vehicle DB)| --> | ESP32 Gate (/open) |
| (built-in or USB cam) |     | and UI               |     | & validation      |     | gate controller   |
+----------------------+     +----------------------+     +-------------------+     +-------------------+
                                        | on success: display vehicle info
                                        v
                               +-----------------+
                               | Gate Opens 5s   |
                               +-----------------+
```

Notes:
- Flow: Client scans on host device -> Frontend validates and shows vehicle info -> Backend confirms registration -> Frontend triggers ESP32 /open -> Gate opens for 5 seconds.
- The ESP32 gate controller operates without a camera; scanning happens on the client device.

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file (optional, defaults are provided):

```env
DATABASE_URL=sqlite:///gate_security.db
JWT_SECRET_KEY=your-secret-key-change-in-production
```

5. Run the Flask server:

```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### ESP32 Setup

1. **Install Arduino IDE**:
   - Download from [arduino.cc](https://www.arduino.cc/en/software)
   - Install ESP32 board support: Go to File > Preferences > Additional Boards Manager URLs, add `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools > Board > Boards Manager, search for ESP32 and install

2. **Install Required Libraries**:
   - In Arduino IDE: Sketch > Include Library > Manage Libraries
   - Install: `ESP32QRCodeReader`, `PubSubClient`, `Servo`, `WiFi`, `HTTPClient`

3. **Hardware Assembly**:
   - Connect camera to ESP32 I2C pins (if not integrated)
   - Wire servo/motor to GPIO pins (e.g., GPIO 12 for servo signal)
   - Connect relay to GPIO (e.g., GPIO 13) and motor power
   - Power ESP32 via USB (5V), motors via relay (12V)

 4. **Configure Firmware**:
    - Open the ESP32 sketch in the `esp32/` directory or create a new one.
    - Update WiFi credentials and switch from camera-based flow to HTTP gate control.
    - Example (illustrative; adapt to your codebase):
       ```cpp
       #include <WiFi.h>
       #include <HTTPClient.h>
       #include <Servo.h>

       const char* ssid = "your_ssid";
       const char* password = "your_password";
       const char* gateOpenURL = "http://<ESP32_IP>/open";

       Servo gateServo;

       void setup() {
         Serial.begin(115200);
         WiFi.begin(ssid, password);
         // wait for WiFi
         gateServo.attach(12);
       }

       void loop() {
         HTTPClient http;
         http.begin(gateOpenURL);
         int httpResponseCode = http.POST("");
         http.end();
         delay(10000);
       }
       ```

5. **Flash Firmware**:
   - Select board: Tools > Board > ESP32-CAM
   - Select port: Tools > Port > (your ESP32 port)
   - Upload: Sketch > Upload
   - Monitor output: Tools > Serial Monitor

6. **Install MQTT Broker** (optional for advanced setups):
   - Install Mosquitto: `sudo apt install mosquitto` (Linux) or download from mosquitto.org
   - Start: `mosquitto -v`

## Default Login

- **Username**: `admin`
- **Password**: `admin123`

## Usage

1. **Login**: Use the default admin credentials or create a new user (admin only)

2. **Register Vehicles**:

   - Go to Vehicles page
   - Click "Add Vehicle"
   - Fill in vehicle details
   - QR code is automatically generated

3. **Scan QR Codes**:

    - **App-based Scanning**: Go to QR Scanner page, click "Start Scanner", allow camera permissions, scan vehicle's QR code
    - **ESP32 Hardware Scanning**: Display QR code at gate; ESP32 camera detects and validates automatically
    - First scan records entry (IN), second scan records exit (OUT), alternating for subsequent scans

4. **View Dashboard**:

   - See real-time statistics
   - View charts and trends
   - Check recent entries

5. **View History**:

   - Filter by entry/exit type
   - View paginated history
   - See detailed entry information

6. **Manage Users** (Admin only):
   - Create, edit, or delete users
   - Assign roles (admin/user)
   - Assign vehicles to users

## Project Structure

```
gate_security/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   └── gate_security.db    # SQLite database (created on first run)
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context (Auth)
│   │   └── App.jsx         # Main app component
│   ├── package.json
│   └── vite.config.js
├── esp32/
│   ├── gate_controller.ino # ESP32 firmware for QR scanning and gate control
│   └── libraries/          # Custom libraries (if needed)
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Vehicles

- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Scanning

- `POST /api/scan` - Scan QR code and record entry/exit

### Gate Automation (ESP32)
- Endpoints exposed by the ESP32 gate controller:
- - `POST /open`  - Open the gate (no camera)
- - `POST /close` - Close the gate
- - `GET  /status`- Get gate status (position in degrees)

### Entries

- `GET /api/entries` - Get entry logs (with pagination and filters)
- `GET /api/stats` - Get dashboard statistics

## Features in Detail

### QR Code Scanning

- Uses device camera for real-time scanning
- Automatically determines entry/exit based on last recorded action
- Provides visual and audio feedback
- Auto-restarts after successful scan

### Entry/Exit Logic

- First scan of a vehicle = Entry (IN)
- Second scan of the same vehicle = Exit (OUT)
- Alternates between IN and OUT for subsequent scans
- Tracks location and timestamp for each scan

### User Roles

- **Admin**: Full access to all features including user management
- **User**: Can manage own vehicles and view own entry history

## Development

### Running in Development Mode

Backend:

```bash
cd backend
python app.py
```

Frontend:

```bash
cd frontend
npm run dev
```

### Building for Production

Frontend:

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

### ESP32 Development

- **Firmware Development**: Use Arduino IDE for ESP32 code. Test with Serial Monitor.
- **Testing**: Simulate QR scans with test images, verify motor control with multimeter.
- **OTA Updates**: Implement over-the-air firmware updates for remote patching.
- **Debugging**: Use ESP32's built-in logging; monitor network connectivity.

## Notes

- The database is SQLite by default (easy to change in `.env`)
- JWT tokens expire after 24 hours
- QR codes are stored as base64 images in the database
- Camera permissions are required for QR scanning
- The system is designed for single-premise use (Main Gate location)
- ESP32 hardware: Ensure weatherproof enclosure for outdoor use; use API keys for secure communication; test power supply stability
