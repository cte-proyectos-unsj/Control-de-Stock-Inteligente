# 📦 Sistema de Control de Stock Inteligente

Sistema completo de gestión de inventario con escaneo de códigos de barras, alertas automáticas y control de vencimientos.

## 🚀 Características

✅ Dashboard con métricas en tiempo real  
✅ Escaneo de códigos de barras con cámara  
✅ Alertas automáticas de stock bajo y vencimientos  
✅ Gestión completa de productos (CRUD)  
✅ Historial de movimientos  
✅ Exportación a CSV  
✅ 100% responsive (móvil/tablet/desktop)  

## 📋 Requisitos

### Frontend (Netlify)
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Cámara (para escaneo de códigos)

### Backend (Opcional)
- Python 3.8+
- SQLite3

## 🛠️ Instalación

### Opción A: Solo Frontend (Netlify)

1. **Subir a Netlify:**
```bash
   # Arrastra la carpeta completa a Netlify
   # O conecta tu repositorio Git
```

2. **Configuración:**
   - No requiere configuración adicional
   - Los datos se guardan en LocalStorage del navegador

### Opción B: Con Backend Python

1. **Clonar el repositorio:**
```bash
   git clone [tu-repositorio]
   cd stock-inteligente
```

2. **Instalar dependencias:**
```bash
   pip install -r requirements.txt
```

3. **Iniciar el servidor:**
```bash
   python app.py
```

4. **Abrir en el navegador:**
```
   http://localhost:5000
```

## 📁 Estructura del Proyecto
```
stock-inteligente/
│
├── index.html              # Dashboard principal
├── productos.html          # Lista de productos
├── agregar.html           # Formulario de alta/edición
├── escanear.html          # Escáner de códigos
├── alertas.html           # Centro de alertas
│
├── css/
│   └── styles.css         # Estilos completos
│
├── js/
│   ├── storage.js         # Manejo de LocalStorage
│   ├── app.js             # Funciones generales
│   └── scanner.js         # Lógica del escáner
│
├── data/                  # Base de datos SQLite (backend)
│   └── inventario.db
│
├── app.py                 # Servidor Flask (backend)
├── database.py            # Manejo de base de datos
└── requirements.txt       # Dependencias Python
```

## 🎯 Uso del Sistema

### 1. Dashboard (index.html)
- Ver estadísticas generales del inventario
- Alertas activas de stock y vencimientos
- Productos con stock crítico

### 2. Productos (productos.html)
- Lista completa de productos
- Búsqueda y filtros
- Edición rápida de stock
- Eliminar productos

### 3. Agregar Producto (agregar.html)
- Formulario completo para nuevos productos
- Edición de productos existentes
- Vista previa en tiempo real

### 4. Escanear (escanear.html)
- Escaneo con cámara (QuaggaJS)
- Ingreso manual de códigos
- Búsqueda rápida de productos
- Actualización rápida de stock

### 5. Alertas (alertas.html)
- Centro de notificaciones
- Filtros por tipo de alerta
- Acciones rápidas
- Recomendaciones automáticas

## 🔧 Funcionalidades Avanzadas

### Escaneo de Códigos
```javascript
// Formatos soportados:
- EAN-13 (más común en Argentina)
- EAN-8
- UPC-A / UPC-E
- Code-128
- Code-39
```

### Alertas Automáticas
- **Stock Bajo:** Cuando cantidad ≤ stock mínimo
- **Por Vencer:** Productos que vencen en ≤ 7 días
- **Vencidos:** Productos con fecha vencida

### Exportar Datos
```javascript
// En la consola del navegador:
exportToCSV(); // Exportar todo el inventario
```

### Importar Datos
```javascript
// Formato CSV esperado:
Nombre,Código de Barras,Cantidad,Stock Mínimo,Vencimiento,Proveedor,Precio
```

## 🎨 Personalización

### Cambiar Colores
Editar las variables CSS en `css/styles.css`:
```css
:root {
    --primary-color: #3b82f6;    /* Azul principal */
    --danger-color: #ef4444;     /* Rojo alertas */
    --success-color: #10b981;    /* Verde éxito */
    --warning-color: #f59e0b;    /* Amarillo advertencia */
}
```

### Modificar Stock Mínimo por Defecto
En `js/storage.js`:
```javascript
minStock: parseInt(productData.minStock) || 5  // Cambiar el 5
```

### Ajustar Días de Alerta de Vencimiento
En `js/storage.js`, función `getAlerts()`:
```javascript
} else if (daysUntilExpiry <= 7) {  // Cambiar el 7
```

## 📊 API Backend (Opcional)

### Endpoints Disponibles

#### Productos
```
GET    /api/productos              # Listar todos
GET    /api/productos/:id          # Obtener uno
POST   /api/productos              # Crear nuevo
PUT    /api/productos/:id          # Actualizar
DELETE /api/productos/:id          # Eliminar
PATCH  /api/productos/:id/stock    # Actualizar solo stock
```

#### Búsqueda y Filtros
```
GET    /api/buscar?q=coca          # Buscar productos
GET    /api/barcode/:code          # Buscar por código
```

#### Alertas y Estadísticas
```
GET    /api/alertas                # Obtener alertas activas
GET    /api/estadisticas           # Estadísticas generales
```

### Ejemplo de Uso
```javascript
// Agregar producto vía API
fetch('/api/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Coca-Cola 2.25L',
        barcode: '7790895000015',
        quantity: 12,
        minStock: 10,
        price: 1500
    })
})
.then(res => res.json())
.then(data => console.log(data));
```

## 🐛 Solución de Problemas

### La cámara no se activa
1. Verificar permisos del navegador
2. Asegurarse de estar en HTTPS (o localhost)
3. Revisar que QuaggaJS esté cargado:
```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js"></script>
```

### Los datos no se guardan
1. Verificar que LocalStorage esté habilitado
2. Limpiar caché del navegador
3. Verificar consola de errores (F12)

### El escáner no detecta códigos
1. Mejorar iluminación
2. Acercar/alejar el código
3. Usar códigos de barras de buena calidad
4. Probar con ingreso manual

### Error al iniciar Flask
```bash
# Verificar instalación:
pip list | grep Flask

# Reinstalar si es necesario:
pip install --upgrade Flask Flask-CORS
```

## 📱 Uso en Móvil

### Instalar como PWA (Progressive Web App)
1. Abrir el sitio en el navegador móvil
2. Menú → "Agregar a pantalla de inicio"
3. Usar como app nativa

### Optimizaciones Móviles
- Interfaz táctil optimizada
- Botones grandes para fácil acceso
- Tablas responsivas con scroll horizontal
- Teclado numérico para cantidades

## 🔒 Seguridad

### LocalStorage
- Los datos solo se guardan en el dispositivo
- No se envían a ningún servidor
- Se pueden perder si se limpia el navegador

### Backend
- Implementar autenticación si es necesario
- Usar HTTPS en producción
- Validar todos los inputs del usuario

## 🚀 Mejoras Futuras

### Corto Plazo
- [ ] Gráficos con Chart.js
- [ ] Modo oscuro
- [ ] Notificaciones push
- [ ] Sincronización con Google Sheets

### Mediano Plazo
- [ ] Sistema de usuarios
- [ ] Roles y permisos
- [ ] Reportes avanzados
- [ ] API REST completa

### Largo Plazo
- [ ] App móvil nativa
- [ ] Integración con proveedores
- [ ] Sistema de ventas
- [ ] Análisis predictivo con IA

## 📞 Soporte

### Reportar Bugs
Crear un issue en el repositorio con:
- Descripción del problema
- Pasos para reproducir
- Capturas de pantalla
- Navegador y versión

### Contribuir
1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-funcion`
3. Commit: `git commit -m "Agregar nueva función"`
4. Push: `git push origin feature/nueva-funcion`
5. Pull Request

## 📄 Licencia

MIT License - Uso libre para proyectos personales y comerciales.

## 👨‍💻 Autor

Desarrollado con ❤️ para negocios que necesitan control de stock simple y efectivo.

---

**¿Necesitas ayuda?** Abre un issue en el repositorio.
**¿Te gustó el proyecto?** Dale una ⭐ en GitHub.