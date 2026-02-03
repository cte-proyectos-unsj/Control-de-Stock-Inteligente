from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from database import Database
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)  # Permite peticiones desde el frontend

# Inicializar base de datos
db = Database()

# Rutas para servir archivos estáticos
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# ============= API ENDPOINTS =============

@app.route('/api/productos', methods=['GET'])
def get_productos():
    """Obtener todos los productos"""
    productos = db.get_all_products()
    return jsonify(productos)

@app.route('/api/productos/<int:product_id>', methods=['GET'])
def get_producto(product_id):
    """Obtener un producto específico"""
    producto = db.get_product_by_id(product_id)
    if producto:
        return jsonify(producto)
    return jsonify({'error': 'Producto no encontrado'}), 404

@app.route('/api/productos', methods=['POST'])
def add_producto():
    """Agregar un nuevo producto"""
    data = request.json
    
    # Validaciones
    if not data.get('name') or not data.get('quantity'):
        return jsonify({'error': 'Nombre y cantidad son obligatorios'}), 400
    
    product_id = db.add_product(
        name=data['name'],
        barcode=data.get('barcode', ''),
        quantity=int(data['quantity']),
        min_stock=int(data.get('minStock', 5)),
        expiry_date=data.get('expiryDate'),
        supplier=data.get('supplier', ''),
        price=float(data.get('price', 0))
    )
    
    return jsonify({'id': product_id, 'message': 'Producto agregado exitosamente'}), 201

@app.route('/api/productos/<int:product_id>', methods=['PUT'])
def update_producto(product_id):
    """Actualizar un producto existente"""
    data = request.json
    
    success = db.update_product(
        product_id=product_id,
        name=data.get('name'),
        barcode=data.get('barcode'),
        quantity=data.get('quantity'),
        min_stock=data.get('minStock'),
        expiry_date=data.get('expiryDate'),
        supplier=data.get('supplier'),
        price=data.get('price')
    )
    
    if success:
        return jsonify({'message': 'Producto actualizado'})
    return jsonify({'error': 'Producto no encontrado'}), 404

@app.route('/api/productos/<int:product_id>', methods=['DELETE'])
def delete_producto(product_id):
    """Eliminar un producto"""
    success = db.delete_product(product_id)
    
    if success:
        return jsonify({'message': 'Producto eliminado'})
    return jsonify({'error': 'Producto no encontrado'}), 404

@app.route('/api/productos/<int:product_id>/stock', methods=['PATCH'])
def update_stock(product_id):
    """Actualizar solo el stock de un producto"""
    data = request.json
    quantity = data.get('quantity')
    
    if quantity is None:
        return jsonify({'error': 'Cantidad es requerida'}), 400
    
    success = db.update_stock(product_id, int(quantity))
    
    if success:
        return jsonify({'message': 'Stock actualizado'})
    return jsonify({'error': 'Producto no encontrado'}), 404

@app.route('/api/alertas', methods=['GET'])
def get_alertas():
    """Obtener todas las alertas activas"""
    alertas = []
    productos = db.get_all_products()
    today = datetime.now()
    
    for producto in productos:
        # Alerta de stock bajo
        if producto['quantity'] <= producto['min_stock']:
            alertas.append({
                'type': 'stock',
                'severity': 'high',
                'message': f"{producto['name']}: Quedan solo {producto['quantity']} unidades (Mínimo: {producto['min_stock']})",
                'product_id': producto['id'],
                'product_name': producto['name']
            })
        
        # Alerta de vencimiento
        if producto['expiry_date']:
            try:
                expiry = datetime.strptime(producto['expiry_date'], '%Y-%m-%d')
                days_until_expiry = (expiry - today).days
                
                if days_until_expiry <= 0:
                    alertas.append({
                        'type': 'expired',
                        'severity': 'critical',
                        'message': f"{producto['name']}: ¡VENCIDO! ({producto['expiry_date']})",
                        'product_id': producto['id'],
                        'product_name': producto['name']
                    })
                elif days_until_expiry <= 7:
                    alertas.append({
                        'type': 'expiry',
                        'severity': 'medium',
                        'message': f"{producto['name']}: Vence en {days_until_expiry} días ({producto['expiry_date']})",
                        'product_id': producto['id'],
                        'product_name': producto['name']
                    })
            except ValueError:
                pass
    
    return jsonify(alertas)

@app.route('/api/buscar', methods=['GET'])
def buscar_productos():
    """Buscar productos por nombre o código de barras"""
    query = request.args.get('q', '')
    productos = db.search_products(query)
    return jsonify(productos)

@app.route('/api/estadisticas', methods=['GET'])
def get_estadisticas():
    """Obtener estadísticas del inventario"""
    productos = db.get_all_products()
    
    total_productos = len(productos)
    total_stock = sum(p['quantity'] for p in productos)
    valor_total = sum(p['quantity'] * p['price'] for p in productos)
    
    # Contar alertas
    alertas = get_alertas().json
    stock_bajo = len([a for a in alertas if a['type'] == 'stock'])
    por_vencer = len([a for a in alertas if a['type'] in ['expiry', 'expired']])
    
    return jsonify({
        'total_productos': total_productos,
        'total_stock': total_stock,
        'valor_total': valor_total,
        'alertas_stock_bajo': stock_bajo,
        'alertas_vencimiento': por_vencer
    })

@app.route('/api/barcode/<barcode>', methods=['GET'])
def buscar_por_barcode(barcode):
    """Buscar producto por código de barras"""
    producto = db.get_product_by_barcode(barcode)
    
    if producto:
        return jsonify(producto)
    return jsonify({'error': 'Producto no encontrado', 'barcode': barcode}), 404

if __name__ == '__main__':
    print("🚀 Servidor iniciado en http://localhost:5000")
    print("📦 Base de datos: data/inventario.db")
    app.run(debug=True, host='0.0.0.0', port=5000)