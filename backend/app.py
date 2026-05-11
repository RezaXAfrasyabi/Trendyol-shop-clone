from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import sqlite3
import hashlib
import jwt
import os
from functools import wraps
from dotenv import load_dotenv

# Project root (parent of backend/) — static frontend files
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(BACKEND_DIR)
load_dotenv(os.path.join(BASE_DIR, '.env'))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', ':)')
CORS(app)

# Database always lives next to this app (stable path regardless of cwd)
DB_NAME = os.path.join(BACKEND_DIR, 'shop.db')

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Products table
    c.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image_url TEXT,
            stock INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    ''')
    
    # Users table (for admin authentication)
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    ''')
    
    # Orders table
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_address TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            total_price REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL
        )
    ''')
    
    # Order items table
    c.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')
    
    # Create default admin user if not exists
    c.execute('SELECT COUNT(*) FROM users WHERE is_admin = 1')
    if c.fetchone()[0] == 0:
        # Default admin: admin@example.com / admin123
        password_hash = hashlib.sha256('admin123'.encode()).hexdigest()
        admin_id = hashlib.md5('admin@example.com'.encode()).hexdigest()
        c.execute('''
            INSERT INTO users (id, email, password_hash, is_admin, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (admin_id, 'admin@example.com', password_hash, 1, datetime.utcnow().isoformat()))
        print("Default admin user created: admin@example.com / admin123")
    
    conn.commit()
    conn.close()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_token(token):
    """Verify JWT token and return user info"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except:
        return None

def admin_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Check if user is admin
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT is_admin FROM users WHERE id = ?', (payload['user_id'],))
        user = c.fetchone()
        conn.close()
        
        if not user or not user[0]:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

# API Routes

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM products ORDER BY created_at DESC')
    products = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(products)

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product"""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    product = c.fetchone()
    conn.close()
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    return jsonify(dict(product))

@app.route('/api/products', methods=['POST'])
@admin_required
def create_product():
    """Create a new product"""
    data = request.json
    
    required_fields = ['name', 'price', 'stock']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    product_id = hashlib.md5(f"{data['name']}{datetime.utcnow()}".encode()).hexdigest()
    
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        INSERT INTO products (id, name, description, price, image_url, stock, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        product_id,
        data['name'],
        data.get('description'),
        data['price'],
        data.get('image_url'),
        data['stock'],
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()
    
    return jsonify({'id': product_id, 'message': 'Product created'}), 201

@app.route('/api/products/<product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    """Update a product"""
    data = request.json
    
    conn = get_db()
    c = conn.cursor()
    
    # Check if product exists
    c.execute('SELECT id FROM products WHERE id = ?', (product_id,))
    if not c.fetchone():
        conn.close()
        return jsonify({'error': 'Product not found'}), 404
    
    # Update product
    c.execute('''
        UPDATE products
        SET name = ?, description = ?, price = ?, image_url = ?, stock = ?
        WHERE id = ?
    ''', (
        data.get('name'),
        data.get('description'),
        data.get('price'),
        data.get('image_url'),
        data.get('stock'),
        product_id
    ))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Product updated'})

@app.route('/api/products/<product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    """Delete a product"""
    conn = get_db()
    c = conn.cursor()
    
    # Check if product exists
    c.execute('SELECT id FROM products WHERE id = ?', (product_id,))
    if not c.fetchone():
        conn.close()
        return jsonify({'error': 'Product not found'}), 404
    
    c.execute('DELETE FROM products WHERE id = ?', (product_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Product deleted'})

@app.route('/api/orders', methods=['GET'])
@admin_required
def get_orders():
    """Get all orders (admin only)"""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM orders ORDER BY created_at DESC')
    orders = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create a new order"""
    data = request.json
    
    required_fields = ['customer_name', 'customer_phone', 'customer_address', 'payment_method', 'total_price', 'items']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    if not data['items'] or len(data['items']) == 0:
        return jsonify({'error': 'Order must have at least one item'}), 400
    
    order_id = hashlib.md5(f"{data['customer_name']}{datetime.utcnow()}".encode()).hexdigest()
    
    conn = get_db()
    c = conn.cursor()
    
    try:
        # Create order
        c.execute('''
            INSERT INTO orders (id, customer_name, customer_phone, customer_address, 
                              payment_method, total_price, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            order_id,
            data['customer_name'],
            data['customer_phone'],
            data['customer_address'],
            data['payment_method'],
            data['total_price'],
            'pending',
            datetime.utcnow().isoformat()
        ))
        
        # Create order items and update stock
        for item in data['items']:
            item_id = hashlib.md5(f"{order_id}{item['product_id']}{datetime.utcnow()}".encode()).hexdigest()
            
            # Insert order item
            c.execute('''
                INSERT INTO order_items (id, order_id, product_id, quantity, price, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                item_id,
                order_id,
                item['product_id'],
                item['quantity'],
                item['price'],
                datetime.utcnow().isoformat()
            ))
            
            # Update product stock
            c.execute('''
                UPDATE products
                SET stock = stock - ?
                WHERE id = ?
            ''', (item['quantity'], item['product_id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({'id': order_id, 'message': 'Order created'}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    """Update order status"""
    data = request.json
    
    if 'status' not in data:
        return jsonify({'error': 'Missing status field'}), 400
    
    valid_statuses = ['pending', 'processing', 'completed', 'cancelled']
    if data['status'] not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    # Check if order exists
    c.execute('SELECT id FROM orders WHERE id = ?', (order_id,))
    if not c.fetchone():
        conn.close()
        return jsonify({'error': 'Order not found'}), 404
    
    c.execute('UPDATE orders SET status = ? WHERE id = ?', (data['status'], order_id))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Order status updated'})

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Admin login"""
    data = request.json
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password required'}), 400
    
    email = data['email']
    password = data['password']
    password_hash = hash_password(password)
    
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, is_admin FROM users WHERE email = ? AND password_hash = ?', 
              (email, password_hash))
    user = c.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user[0],
        'is_admin': bool(user[1]),
        'exp': datetime.utcnow().timestamp() + 86400  # 24 hours
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'token': token,
        'isAdmin': bool(user[1])
    })

@app.route('/api/auth/me', methods=['GET'])
@admin_required
def get_current_user():
    """Get current authenticated user info"""
    token = request.headers.get('Authorization')
    if token.startswith('Bearer '):
        token = token[7:]
    
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid token'}), 401
    
    return jsonify({
        'user': {'id': payload['user_id']},
        'isAdmin': payload.get('is_admin', False)
    })

# Serve frontend files (must be after API routes)
@app.route('/')
def index():
    """Serve the main index.html"""
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, etc.) and handle client-side routing"""
    # Don't serve API routes as static files
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    
    # Check if it's a file with extension (CSS, JS, images, etc.)
    if '.' in path and not path.endswith('.html'):
        try:
            return send_from_directory(BASE_DIR, path)
        except:
            return jsonify({'error': 'Not found'}), 404
    
    # For client-side routes (no extension), serve index.html
    return send_from_directory(BASE_DIR, 'index.html')

if __name__ == '__main__':
    init_db()
    print("Database initialized")
    print("Starting Flask server on http://localhost:5000")
    print("Frontend is served from the same server")
    print("Access the application at: http://localhost:5000")
    app.run(debug=True, port=5000)

