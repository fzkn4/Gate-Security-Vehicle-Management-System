# Gate Security & Vehicle Management System Flow

This flowchart illustrates the end-to-end process of vehicle entry and exit management, including hardware integration with the ESP32 gate controller.

```mermaid
flowchart TD
    %% Actors
    Admin([Security Administrator])
    System{{Backend System}}
    ESP32[[ESP32 Gate Controller]]
    Hardware((Gate Servo/Relay))

    %% Authentication Flow
    Admin -->|Login| System
    System -->|Admin Check & Access Granted| Dashboard[Dashboard]

    %% Main Processes
    Dashboard -->|Manage| Users[User Management]
    Dashboard -->|Manage| Vehicles[Vehicle Management]
    Dashboard -->|View| History[Entry/Exit Logs]
    Dashboard -->|Open Scanner| Scanner[QR Scanner Page]

    %% Scanning Flow
    Scanner -->|Camera Active| Camera{Scan QR Code}
    Camera -->|Valid QR| ScanAPI[POST /api/scan]
    Camera -->|Invalid Format| ErrorModal[Show Error Modal]

    %% Backend Logic
    ScanAPI -->|Analyze QR Content| VerifyVehicle{Vehicle Exists?}
    VerifyVehicle -->|No| NotFound[Return 404]
    VerifyVehicle -->|Yes| CheckHistory{Check Last Log}
    
    CheckHistory -->|Last was OUT| SetEntry[Action: ENTRY]
    CheckHistory -->|Last was IN| SetExit[Action: EXIT]
    
    SetEntry --> SaveLog[Create EntryLog Record]
    SetExit --> SaveLog
    
    %% Hardware Integration
    SaveLog --> CheckConfig{ESP32 Configured?}
    CheckConfig -->|Yes| GetAction{Action Type?}
    CheckConfig -->|No| ReturnSuccess[Return Scan Result]

    GetAction -->|ENTRY| ESP_Open[POST /open]
    GetAction -->|EXIT| ESP_Close[POST /close]

    %% ESP32 Logic
    ESP_Open -->|Handle Request| MoveServo[Move Servo to Open Position]
    ESP_Close -->|Handle Request| MoveServoClose[Move Servo to Closed Position]
    
    MoveServo --> Hardware
    MoveServoClose --> Hardware

    %% Conclusion
    ESP_Open --> ReturnSuccess
    ESP_Close --> ReturnSuccess
    ReturnSuccess -->|Update UI| Scanner
    
    %% Styling
    style ESP32 fill:#f9f,stroke:#333,stroke-width:2px
    style Hardware fill:#fff,stroke:#333,stroke-dasharray: 5 5
    style System fill:#bbf,stroke:#333,stroke-width:2px
    style Admin fill:#dfd
```

## Flow Description

1.  **Authentication**: Only users with the **admin** role can log in. The system initializes with a default admin account. Regular users registered in the system cannot log in to the web interface.
2.  **QR Scanning**: The authenticated administrator uses the device's camera to decode vehicle QR codes (Format: `VEHICLE:ID:PLATE`).
3.  **State Management**: The backend automatically toggles between **ENTRY** and **EXIT** based on the vehicle's last recorded movement.
4.  **Hardware Automation**:
    *   If the system identifies an **ENTRY**, it signals the ESP32 to open the gate.
    *   If it identifies an **EXIT**, it signals the ESP32 to close/reset the gate.
5.  **Logging**: Every scan is timestamped and stored in the database, including a link to the vehicle owner and optional images.
