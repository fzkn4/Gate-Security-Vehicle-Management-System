from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import qrcode
import io
import base64
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///gate_security.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT Configuration - MUST be set before JWTManager initialization
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
# Flask-JWT-Extended defaults to looking for tokens in Authorization header with Bearer format

db = SQLAlchemy(app)
CORS(app, supports_credentials=True, allow_headers=['Content-Type', 'Authorization'])
jwt = JWTManager(app)

# JWT Error Handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'message': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"Invalid token error: {str(error)}")
    print(f"Request headers: {request.headers}")
    return jsonify({'message': f'Invalid token: {str(error)}'}), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"Missing token error: {str(error)}")
    print(f"Request headers: {request.headers}")
    return jsonify({'message': 'Authorization token is missing'}), 401

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), default='user')  # admin, user
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    vehicles = db.relationship('Vehicle', backref='owner', lazy=True)

class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    plate_number = db.Column(db.String(50), unique=True, nullable=False)
    vehicle_type = db.Column(db.String(50), nullable=False)  # car, motorcycle, truck, etc.
    make = db.Column(db.String(100))
    model = db.Column(db.String(100))
    color = db.Column(db.String(50))
    qr_code = db.Column(db.Text, unique=True, nullable=False)  # Base64 QR code
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    entries = db.relationship('EntryLog', backref='vehicle', lazy=True, order_by='EntryLog.timestamp.desc()')

class EntryLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    entry_type = db.Column(db.String(10), nullable=False)  # 'in' or 'out'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    location = db.Column(db.String(100), default='Main Gate')
    notes = db.Column(db.Text)

# Initialize database
with app.app_context():
    db.create_all()
    
    # Create admin user if not exists
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('admin123'),
            full_name='Administrator',
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()

# Helper function to generate QR code
def generate_qr_code(data):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_base64}"

# Authentication Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
            
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            # JWT identity must be a string
            access_token = create_access_token(identity=str(user.id))
            print(f"Token created for user {user.id} (username: {user.username})")
            print(f"Token (first 50 chars): {access_token[:50]}...")
            return jsonify({
                'access_token': access_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role
                }
            }), 200
        
        return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@app.route('/api/auth/register', methods=['POST'])
@jwt_required()
def register():
    # JWT identity is a string, convert to int for database lookup
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if current_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    user = User(
        username=data.get('username'),
        email=data.get('email'),
        password_hash=generate_password_hash(data.get('password')),
        full_name=data.get('full_name'),
        role=data.get('role', 'user')
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role
        }
    }), 201

# User Management Routes
@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        # JWT identity is a string, convert to int for database lookup
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'full_name': u.full_name,
            'role': u.role,
            'created_at': u.created_at.isoformat(),
            'vehicle_count': len(u.vehicles)
        } for u in users]), 200
    except Exception as e:
        print(f"Error in get_users: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    except Exception as e:
        print(f"Error in get_users: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'created_at': user.created_at.isoformat(),
        'vehicles': [{
            'id': v.id,
            'plate_number': v.plate_number,
            'vehicle_type': v.vehicle_type
        } for v in user.vehicles]
    }), 200

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    # JWT identity is a string, convert to int for database lookup
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if current_user.role != 'admin' and current_user.id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    if 'email' in data:
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user_id:
            return jsonify({'message': 'Email already exists'}), 400
        user.email = data['email']
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    
    if 'role' in data and current_user.role == 'admin':
        user.role = data['role']
    
    if 'password' in data:
        user.password_hash = generate_password_hash(data['password'])
    
    db.session.commit()
    return jsonify({'message': 'User updated successfully'}), 200

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    # JWT identity is a string, convert to int for database lookup
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if current_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200

# Vehicle Management Routes
@app.route('/api/vehicles', methods=['GET'])
@jwt_required()
def get_vehicles():
    try:
        # JWT identity is a string, convert to int for database lookup
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        if current_user.role == 'admin':
            vehicles = Vehicle.query.all()
        else:
            vehicles = Vehicle.query.filter_by(user_id=current_user_id).all()
        
        return jsonify([{
            'id': v.id,
            'plate_number': v.plate_number,
            'vehicle_type': v.vehicle_type,
            'make': v.make,
            'model': v.model,
            'color': v.color,
            'qr_code': v.qr_code,
            'user_id': v.user_id,
            'owner_name': v.owner.full_name,
            'created_at': v.created_at.isoformat()
        } for v in vehicles]), 200
    except Exception as e:
        print(f"Error in get_vehicles: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@app.route('/api/vehicles', methods=['POST'])
@jwt_required()
def create_vehicle():
    # JWT identity is a string, convert to int for database lookup
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    data = request.get_json()
    
    user_id = data.get('user_id', current_user_id)
    
    # Only admin can assign vehicles to other users
    if user_id != current_user_id and current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    if Vehicle.query.filter_by(plate_number=data.get('plate_number')).first():
        return jsonify({'message': 'Plate number already exists'}), 400
    
    # Generate QR code data (using vehicle ID will be set after creation)
    qr_data = f"VEHICLE:{data.get('plate_number')}"
    qr_code_image = generate_qr_code(qr_data)
    
    vehicle = Vehicle(
        plate_number=data.get('plate_number'),
        vehicle_type=data.get('vehicle_type'),
        make=data.get('make'),
        model=data.get('model'),
        color=data.get('color'),
        qr_code=qr_code_image,
        user_id=user_id
    )
    
    db.session.add(vehicle)
    db.session.commit()
    
    # Update QR code with actual vehicle ID
    qr_data = f"VEHICLE:{vehicle.id}:{vehicle.plate_number}"
    vehicle.qr_code = generate_qr_code(qr_data)
    db.session.commit()
    
    return jsonify({
        'message': 'Vehicle created successfully',
        'vehicle': {
            'id': vehicle.id,
            'plate_number': vehicle.plate_number,
            'vehicle_type': vehicle.vehicle_type,
            'make': vehicle.make,
            'model': vehicle.model,
            'color': vehicle.color,
            'qr_code': vehicle.qr_code,
            'user_id': vehicle.user_id
        }
    }), 201

@app.route('/api/vehicles/<int:vehicle_id>', methods=['PUT'])
@jwt_required()
def update_vehicle(vehicle_id):
    # JWT identity is a string, convert to int for database lookup
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    
    if current_user.role != 'admin' and vehicle.user_id != current_user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if 'plate_number' in data and data['plate_number'] != vehicle.plate_number:
        if Vehicle.query.filter_by(plate_number=data['plate_number']).first():
            return jsonify({'message': 'Plate number already exists'}), 400
        vehicle.plate_number = data['plate_number']
        # Regenerate QR code
        qr_data = f"VEHICLE:{vehicle.id}:{vehicle.plate_number}"
        vehicle.qr_code = generate_qr_code(qr_data)
    
    if 'vehicle_type' in data:
        vehicle.vehicle_type = data['vehicle_type']
    if 'make' in data:
        vehicle.make = data['make']
    if 'model' in data:
        vehicle.model = data['model']
    if 'color' in data:
        vehicle.color = data['color']
    
    db.session.commit()
    return jsonify({'message': 'Vehicle updated successfully'}), 200

@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
@jwt_required()
def delete_vehicle(vehicle_id):
    # JWT identity is a string, convert to int for database lookup
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    
    if current_user.role != 'admin' and vehicle.user_id != current_user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted successfully'}), 200

# QR Code Scanning Route
@app.route('/api/scan', methods=['POST'])
@jwt_required()
def scan_qr_code():
    data = request.get_json()
    qr_data = data.get('qr_data')
    location = data.get('location', 'Main Gate')
    
    if not qr_data or not qr_data.startswith('VEHICLE:'):
        return jsonify({'message': 'Invalid QR code'}), 400
    
    try:
        parts = qr_data.split(':')
        vehicle_id = int(parts[1])
        vehicle = Vehicle.query.get(vehicle_id)
        
        if not vehicle:
            return jsonify({'message': 'Vehicle not found'}), 404
        
        # Get the last entry for this vehicle
        last_entry = EntryLog.query.filter_by(vehicle_id=vehicle_id).order_by(EntryLog.timestamp.desc()).first()
        
        # Determine entry type: if last entry was 'in', this is 'out', and vice versa
        if last_entry and last_entry.entry_type == 'in':
            entry_type = 'out'
        else:
            entry_type = 'in'
        
        # Create new entry log
        entry = EntryLog(
            vehicle_id=vehicle_id,
            entry_type=entry_type,
            location=location,
            timestamp=datetime.utcnow()
        )
        
        db.session.add(entry)
        db.session.commit()
        
        return jsonify({
            'message': f'Vehicle {entry_type.upper()} recorded successfully',
            'entry': {
                'id': entry.id,
                'vehicle_id': vehicle.id,
                'plate_number': vehicle.plate_number,
                'vehicle_type': vehicle.vehicle_type,
                'owner_name': vehicle.owner.full_name,
                'entry_type': entry_type,
                'timestamp': entry.timestamp.isoformat(),
                'location': entry.location
            }
        }), 200
        
    except (ValueError, IndexError):
        return jsonify({'message': 'Invalid QR code format'}), 400

# Test endpoint to verify token
@app.route('/api/test-token', methods=['GET'])
@jwt_required()
def test_token():
    try:
        # JWT identity is a string, convert to int for database lookup
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        return jsonify({
            'message': 'Token is valid',
            'user_id': current_user_id,
            'username': current_user.username if current_user else None
        }), 200
    except Exception as e:
        print(f"Test token error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Entry Log Routes
@app.route('/api/entries', methods=['GET'])
@jwt_required()
def get_entries():
    try:
        # JWT identity is a string, convert to int for database lookup
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        entry_type = request.args.get('type')  # 'in' or 'out'
        vehicle_id = request.args.get('vehicle_id', type=int)
        
        query = EntryLog.query
        
        if current_user.role != 'admin':
            # Regular users can only see their own vehicle entries
            user_vehicles = [v.id for v in Vehicle.query.filter_by(user_id=current_user_id).all()]
            query = query.filter(EntryLog.vehicle_id.in_(user_vehicles))
        
        if entry_type:
            query = query.filter_by(entry_type=entry_type)
        
        if vehicle_id:
            query = query.filter_by(vehicle_id=vehicle_id)
        
        entries = query.order_by(EntryLog.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'entries': [{
                'id': e.id,
                'vehicle_id': e.vehicle_id,
                'plate_number': e.vehicle.plate_number,
                'vehicle_type': e.vehicle.vehicle_type,
                'owner_name': e.vehicle.owner.full_name,
                'entry_type': e.entry_type,
                'timestamp': e.timestamp.isoformat(),
                'location': e.location,
                'notes': e.notes
            } for e in entries.items],
            'total': entries.total,
            'pages': entries.pages,
            'current_page': page
        }), 200
    except Exception as e:
        print(f"Error in get_entries: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    try:
        # JWT identity is a string, convert to int for database lookup
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        query = EntryLog.query
        if current_user.role != 'admin':
            user_vehicles = [v.id for v in Vehicle.query.filter_by(user_id=current_user_id).all()]
            query = query.filter(EntryLog.vehicle_id.in_(user_vehicles))
        
        total_entries = query.count()
        entries_in = query.filter_by(entry_type='in').count()
        entries_out = query.filter_by(entry_type='out').count()
        
        # Get today's entries
        today = datetime.utcnow().date()
        today_entries = query.filter(
            db.func.date(EntryLog.timestamp) == today
        ).count()
        
        # Get vehicles currently inside (last entry was 'in')
        all_vehicles = Vehicle.query.all() if current_user.role == 'admin' else Vehicle.query.filter_by(user_id=current_user_id).all()
        vehicles_inside = 0
        for vehicle in all_vehicles:
            last_entry = EntryLog.query.filter_by(vehicle_id=vehicle.id).order_by(EntryLog.timestamp.desc()).first()
            if last_entry and last_entry.entry_type == 'in':
                vehicles_inside += 1
        
        return jsonify({
            'total_entries': total_entries,
            'entries_in': entries_in,
            'entries_out': entries_out,
            'today_entries': today_entries,
            'vehicles_inside': vehicles_inside,
            'total_vehicles': len(all_vehicles)
        }), 200
    except Exception as e:
        print(f"Error in get_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

# Root route for health check
@app.route('/')
def index():
    return jsonify({
        'message': 'Gate Security API',
        'status': 'running',
        'version': '1.0.0'
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)

