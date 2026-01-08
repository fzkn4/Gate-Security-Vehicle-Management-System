# Gate Security - Vehicle Management System

A modern QR code-based vehicle entry/exit management system with a beautiful UI.

## Features

- **QR Code Scanning**: Real-time QR code scanning for vehicle entry/exit tracking
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

   - Go to QR Scanner page
   - Click "Start Scanner"
   - Allow camera permissions
   - Scan a vehicle's QR code
   - First scan records entry (IN)
   - Second scan records exit (OUT)

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

## Notes

- The database is SQLite by default (easy to change in `.env`)
- JWT tokens expire after 24 hours
- QR codes are stored as base64 images in the database
- Camera permissions are required for QR scanning
- The system is designed for single-premise use (Main Gate location)
