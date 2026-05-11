"""
Script to add sample products to the database
Run this after starting the Flask server or independently
"""
import sqlite3
import hashlib
import os
from datetime import datetime, timezone
import sys
import io

# Fix Windows console encoding for emoji
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BACKEND_DIR, 'shop.db')

# Sample products to add
SAMPLE_PRODUCTS = [
    {
        'name': 'Premium Essential Oil Set',
        'description': 'A luxurious set of 5 premium essential oils including lavender, eucalyptus, tea tree, peppermint, and lemon.',
        'price': 49.99,
        'image_url': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
        'stock': 25
    },
    {
        'name': 'Organic Herbal Tea Collection',
        'description': 'A curated collection of 10 organic herbal teas for relaxation and wellness.',
        'price': 29.99,
        'image_url': 'https://images.unsplash.com/photo-1556679343-c7306c1976b5?w=400',
        'stock': 40
    },
    {
        'name': 'Natural Skincare Bundle',
        'description': 'Complete skincare set with face wash, moisturizer, and serum made from natural ingredients.',
        'price': 79.99,
        'image_url': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
        'stock': 15
    },
    {
        'name': 'Aromatherapy Diffuser',
        'description': 'Ultrasonic aromatherapy diffuser with LED lights and timer function.',
        'price': 39.99,
        'image_url': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
        'stock': 30
    },
    {
        'name': 'Vitamin C Serum',
        'description': 'Brightening vitamin C serum with hyaluronic acid for glowing skin.',
        'price': 24.99,
        'image_url': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
        'stock': 50
    },
    {
        'name': 'Bamboo Fiber Towel Set',
        'description': 'Eco-friendly bamboo fiber bath towels - set of 4 in various sizes.',
        'price': 59.99,
        'image_url': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400',
        'stock': 20
    },
    {
        'name': 'Yoga Mat Premium',
        'description': 'Non-slip premium yoga mat with carrying strap and alignment lines.',
        'price': 34.99,
        'image_url': 'https://images.unsplash.com/photo-1601925260368-ae2f83f8b774?w=400',
        'stock': 35
    },
    {
        'name': 'Meditation Cushion Set',
        'description': 'Comfortable meditation cushions set with buckwheat hull filling.',
        'price': 44.99,
        'image_url': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
        'stock': 18
    },
    {
        'name': 'Natural Soap Collection',
        'description': 'Handcrafted natural soaps - 6 bars with different scents and ingredients.',
        'price': 19.99,
        'image_url': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
        'stock': 60
    },
    {
        'name': 'Wellness Gift Box',
        'description': 'Curated wellness gift box containing essential oils, teas, and self-care items.',
        'price': 89.99,
        'image_url': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
        'stock': 12
    }
]

def init_db_if_needed():
    """Initialize database if it doesn't exist"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
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
    
    conn.commit()
    conn.close()

def add_products():
    """Add sample products to the database"""
    init_db_if_needed()
    
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    added_count = 0
    skipped_count = 0
    
    for product in SAMPLE_PRODUCTS:
        # Generate unique ID
        product_id = hashlib.md5(f"{product['name']}{datetime.now(timezone.utc)}".encode()).hexdigest()
        
        # Check if product with same name already exists
        c.execute('SELECT id FROM products WHERE name = ?', (product['name'],))
        if c.fetchone():
            print(f"[SKIP] Skipping '{product['name']}' - already exists")
            skipped_count += 1
            continue
        
        # Insert product
        c.execute('''
            INSERT INTO products (id, name, description, price, image_url, stock, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            product_id,
            product['name'],
            product['description'],
            product['price'],
            product['image_url'],
            product['stock'],
            datetime.now(timezone.utc).isoformat()
        ))
        
        print(f"[OK] Added: {product['name']} - ${product['price']:.2f}")
        added_count += 1
    
    conn.commit()
    conn.close()
    
    print(f"\n{'='*50}")
    print(f"[SUCCESS] Successfully added {added_count} products")
    if skipped_count > 0:
        print(f"[INFO] Skipped {skipped_count} products (already exist)")
    print(f"{'='*50}")

if __name__ == '__main__':
    print("Adding sample products to the database...")
    print(f"{'='*50}\n")
    add_products()
    print("\nProducts are now available in the shop!")
    print("Start the Flask server with: python app.py")

