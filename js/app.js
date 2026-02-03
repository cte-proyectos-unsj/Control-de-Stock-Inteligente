// ========== APP.JS - Funciones generales de la aplicación ==========

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Confirmar acción
function confirmAction(message) {
    return confirm(message);
}

// Exportar datos a CSV
function exportToCSV() {
    const products = getProducts();
    
    let csv = 'Nombre,Código de Barras,Cantidad,Stock Mínimo,Vencimiento,Proveedor,Precio\n';
    
    products.forEach(p => {
        csv += `"${p.name}","${p.barcode}",${p.quantity},${p.minStock},"${p.expiryDate || ''}","${p.supplier || ''}",${p.price}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Limpiar todos los datos (con confirmación)
function clearAllData() {
    if (confirm('⚠️ ¿Estás seguro de eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
        if (confirm('⚠️ ÚLTIMA CONFIRMACIÓN: ¿Realmente deseas borrar todo el inventario?')) {
            localStorage.removeItem(STORAGE_KEY);
            showNotification('Todos los datos han sido eliminados', 'error');
            setTimeout(() => window.location.reload(), 1500);
        }
    }
}

// Importar datos desde CSV
function importFromCSV(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        const products = [];
        
        // Saltar la primera línea (headers)
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',');
            
            products.push({
                id: Date.now() + i,
                name: values[0].replace(/"/g, ''),
                barcode: values[1].replace(/"/g, ''),
                quantity: parseInt(values[2]) || 0,
                minStock: parseInt(values[3]) || 5,
                expiryDate: values[4].replace(/"/g, ''),
                supplier: values[5].replace(/"/g, ''),
                price: parseFloat(values[6]) || 0
            });
        }
        
        if (products.length > 0) {
            const currentProducts = getProducts();
            saveProducts([...currentProducts, ...products]);
            showNotification(`${products.length} productos importados correctamente`, 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    };
    
    reader.readAsText(file);
}

// Obtener parámetros de URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Validar código de barras (formato básico)
function isValidBarcode(barcode) {
    return /^[0-9]{8,13}$/.test(barcode);
}

// Calcular días hasta vencimiento
function getDaysUntilExpiry(expiryDate) {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

// Obtener estadísticas del inventario
function getInventoryStats() {
    const products = getProducts();
    const alerts = getAlerts();
    
    return {
        totalProducts: products.length,
        totalStock: products.reduce((sum, p) => sum + p.quantity, 0),
        totalValue: products.reduce((sum, p) => sum + (p.quantity * p.price), 0),
        lowStockCount: alerts.filter(a => a.type === 'stock').length,
        expiringCount: alerts.filter(a => a.type === 'expiry').length,
        expiredCount: alerts.filter(a => a.type === 'expired').length,
        topProducts: products
            .sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price))
            .slice(0, 5)
    };
}

// Buscar productos por término
function searchProducts(searchTerm) {
    const products = getProducts();
    const term = searchTerm.toLowerCase();
    
    return products.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.barcode.includes(term) ||
        (p.supplier && p.supplier.toLowerCase().includes(term))
    );
}

// Ordenar productos
function sortProducts(products, sortBy = 'name', order = 'asc') {
    return products.sort((a, b) => {
        let compareA = a[sortBy];
        let compareB = b[sortBy];
        
        if (typeof compareA === 'string') {
            compareA = compareA.toLowerCase();
            compareB = compareB.toLowerCase();
        }
        
        if (order === 'asc') {
            return compareA > compareB ? 1 : -1;
        } else {
            return compareA < compareB ? 1 : -1;
        }
    });
}

// Generar reporte de inventario
function generateReport() {
    const stats = getInventoryStats();
    const alerts = getAlerts();
    
    return {
        fecha: new Date().toLocaleString('es-AR'),
        estadisticas: stats,
        alertas: alerts,
        productos: getProducts()
    };
}

// Imprimir reporte
function printReport() {
    const report = generateReport();
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Reporte de Inventario</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #3b82f6; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #3b82f6; color: white; }
                .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
                .stat-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>📦 Reporte de Inventario</h1>
            <p><strong>Fecha:</strong> ${report.fecha}</p>
            
            <div class="stats">
                <div class="stat-box">
                    <h3>Total Productos</h3>
                    <p style="font-size: 24px; font-weight: bold;">${report.estadisticas.totalProducts}</p>
                </div>
                <div class="stat-box">
                    <h3>Stock Total</h3>
                    <p style="font-size: 24px; font-weight: bold;">${report.estadisticas.totalStock}</p>
                </div>
                <div class="stat-box">
                    <h3>Valor Total</h3>
                    <p style="font-size: 24px; font-weight: bold;">${formatCurrency(report.estadisticas.totalValue)}</p>
                </div>
            </div>
            
            <h2>⚠️ Alertas Activas (${report.alertas.length})</h2>
            <table>
                <tr>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Mensaje</th>
                </tr>
                ${report.alertas.map(a => `
                    <tr>
                        <td>${a.type === 'stock' ? '📦 Stock' : a.type === 'expiry' ? '📅 Vencimiento' : '❌ Vencido'}</td>
                        <td>${a.product}</td>
                        <td>${a.message}</td>
                    </tr>
                `).join('')}
            </table>
            
            <h2>📋 Lista de Productos</h2>
            <table>
                <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Vencimiento</th>
                </tr>
                ${report.productos.map(p => `
                    <tr>
                        <td>${p.name}</td>
                        <td>${p.barcode}</td>
                        <td>${p.quantity}</td>
                        <td>${formatCurrency(p.price)}</td>
                        <td>${p.expiryDate || '-'}</td>
                    </tr>
                `).join('')}
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Detectar dispositivo móvil
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Vibrar dispositivo (si está disponible)
function vibrate(duration = 100) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

// Reproducir sonido de notificación
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzbF8OWiWRULUKbk77BdGAg+ltv1wXMnBSF+zfPaizsKFmS57OihUhELTKXh8bllHAU2jNXzzn0vBSZ9yPDdk0EKGF247OykWBQMUKjl8LFfGgs+mtzywHQpBSKAz/XajDwLF2W97Oijz'); 
    audio.play().catch(() => {}); // Ignorar errores si no se puede reproducir
}

console.log('✅ App.js cargado correctamente');