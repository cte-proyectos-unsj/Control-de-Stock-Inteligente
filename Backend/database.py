import sqlite3
from datetime import datetime
import os

class Database:
    def __init__(self, db_path='data/inventario.db'):
        """Inicializar conexión a la base de datos"""
        # Crear carpeta data si no existe
        os.makedirs('data', exist_ok=True)
        
        self.db_path = db_path
        self.create_tables()
    
    def get_connection(self):
        """Crear conexión a la base de datos"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def create_tables(self):
        """Crear tablas si no existen"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Tabla de productos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                barcode TEXT UNIQUE,
                quantity INTEGER NOT NULL DEFAULT 0,
                min_stock INTEGER DEFAULT 5,
                expiry_date TEXT,
                supplier TEXT,
                price REAL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabla de movimientos (historial)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                reason TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        ''')
        
        # Tabla de proveedores
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                contact TEXT,
                phone TEXT,
                email TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        
        print("✅ Base de datos inicializada correctamente")
    
    # ============= OPERACIONES CRUD =============
    
    def add_product(self, name, barcode, quantity, min_stock, expiry_date, supplier, price):
        """Agregar un nuevo producto"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO products (name, barcode, quantity, min_stock, expiry_date, supplier, price)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (name, barcode, quantity, min_stock, expiry_date, supplier, price))
            
            product_id = cursor.lastrowid
            
            # Registrar movimiento inicial
            cursor.execute('''
                INSERT INTO movements (product_id, type, quantity, reason)
                VALUES (?, 'entrada', ?, 'Stock inicial')
            ''', (product_id, quantity))
            
            conn.commit()
            print(f"✅ Producto agregado: {name} (ID: {product_id})")
            return product_id
            
        except sqlite3.IntegrityError:
            print(f"❌ Error: El código de barras {barcode} ya existe")
            return None
        finally:
            conn.close()
    
    def get_all_products(self):
        """Obtener todos los productos"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM products ORDER BY name')
        rows = cursor.fetchall()
        
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_product_by_id(self, product_id):
        """Obtener un producto por ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        row = cursor.fetchone()
        
        conn.close()
        
        return dict(row) if row else None
    
    def get_product_by_barcode(self, barcode):
        """Obtener un producto por código de barras"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM products WHERE barcode = ?', (barcode,))
        row = cursor.fetchone()
        
        conn.close()
        
        return dict(row) if row else None
    
    def update_product(self, product_id, **kwargs):
        """Actualizar un producto"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Construir query dinámicamente
        fields = []
        values = []
        
        for key, value in kwargs.items():
            if value is not None:
                fields.append(f"{key} = ?")
                values.append(value)
        
        if not fields:
            return False
        
        fields.append("updated_at = CURRENT_TIMESTAMP")
        values.append(product_id)
        
        query = f"UPDATE products SET {', '.join(fields)} WHERE id = ?"
        
        cursor.execute(query, values)
        conn.commit()
        
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def update_stock(self, product_id, new_quantity):
        """Actualizar solo el stock de un producto"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Obtener cantidad anterior
        cursor.execute('SELECT quantity FROM products WHERE id = ?', (product_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return False
        
        old_quantity = row['quantity']
        difference = new_quantity - old_quantity
        
        # Actualizar stock
        cursor.execute('''
            UPDATE products 
            SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ''', (new_quantity, product_id))
        
        # Registrar movimiento
        movement_type = 'entrada' if difference > 0 else 'salida'
        cursor.execute('''
            INSERT INTO movements (product_id, type, quantity, reason)
            VALUES (?, ?, ?, 'Ajuste de stock')
        ''', (product_id, movement_type, abs(difference)))
        
        conn.commit()
        conn.close()
        
        return True
    
    def delete_product(self, product_id):
        """Eliminar un producto"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
        conn.commit()
        
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def search_products(self, query):
        """Buscar productos por nombre o código de barras"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM products 
            WHERE name LIKE ? OR barcode LIKE ? OR supplier LIKE ?
            ORDER BY name
        ''', (f'%{query}%', f'%{query}%', f'%{query}%'))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    # ============= HISTORIAL DE MOVIMIENTOS =============
    
    def add_movement(self, product_id, movement_type, quantity, reason=''):
        """Registrar un movimiento de stock"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO movements (product_id, type, quantity, reason)
            VALUES (?, ?, ?, ?)
        ''', (product_id, movement_type, quantity, reason))
        
        conn.commit()
        conn.close()
    
    def get_movements(self, product_id=None, limit=50):
        """Obtener historial de movimientos"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if product_id:
            cursor.execute('''
                SELECT m.*, p.name as product_name
                FROM movements m
                JOIN products p ON m.product_id = p.id
                WHERE m.product_id = ?
                ORDER BY m.created_at DESC
                LIMIT ?
            ''', (product_id, limit))
        else:
            cursor.execute('''
                SELECT m.*, p.name as product_name
                FROM movements m
                JOIN products p ON m.product_id = p.id
                ORDER BY m.created_at DESC
                LIMIT ?
            ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    # ============= PROVEEDORES =============
    
    def add_supplier(self, name, contact='', phone='', email=''):
        """Agregar un proveedor"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO suppliers (name, contact, phone, email)
                VALUES (?, ?, ?, ?)
            ''', (name, contact, phone, email))
            
            supplier_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return supplier_id
        except sqlite3.IntegrityError:
            print(f"❌ Error: El proveedor {name} ya existe")
            conn.close()
            return None
    
    def get_all_suppliers(self):
        """Obtener todos los proveedores"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM suppliers ORDER BY name')
        rows = cursor.fetchall()
        
        conn.close()
        
        return [dict(row) for row in rows]