// ========== STORAGE.JS - Manejo de datos en LocalStorage ==========

const STORAGE_KEY = 'stockInteligente_products';

// Inicializar con datos de ejemplo si no hay nada guardado
function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const demoProducts = [
            {
                id: 1,
                name: 'Coca-Cola 2.25L',
                barcode: '7790895000015',
                quantity: 12,
                minStock: 10,
                expiryDate: '2025-12-31',
                supplier: 'Distribuidora Sur',
                price: 1500
            },
            {
                id: 2,
                name: 'Fideos Matarazzo 500g',
                barcode: '7790042001234',
                quantity: 5,
                minStock: 15,
                expiryDate: '2025-11-15',
                supplier: 'Mayorista Central',
                price: 800
            },
            {
                id: 3,
                name: 'Aceite Cocinero 900ml',
                barcode: '7798027564123',
                quantity: 8,
                minStock: 8,
                expiryDate: '2026-03-20',
                supplier: 'Distribuidora Sur',
                price: 2200
            },
            {
                id: 4,
                name: 'Leche La Serenísima 1L',
                barcode: '7790315001456',
                quantity: 3,
                minStock: 12,
                expiryDate: '2025-10-28',
                supplier: 'Lácteos Express',
                price: 950
            },
            {
                id: 5,
                name: 'Arroz Gallo Oro 1kg',
                barcode: '779012345678',
                quantity: 20,
                minStock: 10,
                expiryDate: '2026-06-30',
                supplier: 'Mayorista Central',
                price: 1200
            }
        ];
        saveProducts(demoProducts);
    }
}

// Obtener todos los productos
function getProducts() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Guardar productos
function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

// Agregar un nuevo producto
function addProduct(productData) {
    const products = getProducts();
    const newProduct = {
        id: Date.now(),
        name: productData.name,
        barcode: productData.barcode || '',
        quantity: parseInt(productData.quantity) || 0,
        minStock: parseInt(productData.minStock) || 5,
        expiryDate: productData.expiryDate || '',
        supplier: productData.supplier || '',
        price: parseFloat(productData.price) || 0
    };
    products.push(newProduct);
    saveProducts(products);
    return newProduct.id;
}

// Actualizar un producto
function updateProduct(productId, productData) {
    const products = getProducts();
    const index = products.findIndex(p => p.id === productId);
    
    if (index !== -1) {
        products[index] = {
            ...products[index],
            ...productData,
            id: productId // Asegurar que el ID no cambie
        };
        saveProducts(products);
        return true;
    }
    return false;
}

// Actualizar solo el stock de un producto
function updateProductStock(productId, newQuantity) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
        product.quantity = Math.max(0, parseInt(newQuantity));
        saveProducts(products);
        return true;
    }
    return false;
}

// Eliminar un producto
function deleteProductById(productId) {
    const products = getProducts();
    const filtered = products.filter(p => p.id !== productId);
    saveProducts(filtered);
    return true;
}

// Buscar producto por código de barras
function findProductByBarcode(barcode) {
    const products = getProducts();
    return products.find(p => p.barcode === barcode);
}

// Obtener alertas
function getAlerts() {
    const products = getProducts();
    const alerts = [];
    const today = new Date();

    products.forEach(product => {
        // Alerta de stock bajo
        if (product.quantity <= product.minStock) {
            alerts.push({
                type: 'stock',
                severity: product.quantity === 0 ? 'critical' : 'high',
                message: `${product.name}: Quedan solo ${product.quantity} unidades (Mínimo: ${product.minStock})`,
                product: product.name,
                productId: product.id
            });
        }

        // Alerta de vencimiento
        if (product.expiryDate) {
            try {
                const expiry = new Date(product.expiryDate);
                const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= 0) {
                    alerts.push({
                        type: 'expired',
                        severity: 'critical',
                        message: `${product.name}: ¡VENCIDO! (${product.expiryDate})`,
                        product: product.name,
                        productId: product.id
                    });
                } else if (daysUntilExpiry <= 7) {
                    alerts.push({
                        type: 'expiry',
                        severity: 'medium',
                        message: `${product.name}: Vence en ${daysUntilExpiry} días (${product.expiryDate})`,
                        product: product.name,
                        productId: product.id
                    });
                }
            } catch (e) {
                console.error('Error al procesar fecha de vencimiento:', e);
            }
        }
    });

    return alerts;
}

// Inicializar al cargar
initializeStorage();