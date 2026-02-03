// ========== SCANNER.JS - Funcionalidades del escáner de códigos de barras ==========

let scannerActive = false;
let lastScannedCode = null;
let scanCooldown = false;

// Inicializar escáner con QuaggaJS
function initializeScanner() {
    if (typeof Quagga === 'undefined') {
        console.warn('QuaggaJS no está cargado. Escaneo por cámara no disponible.');
        return false;
    }

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner-container'),
            constraints: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "environment", // Cámara trasera en móviles
                aspectRatio: { min: 1, max: 2 }
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: 4,
        decoder: {
            readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "code_39_reader",
                "upc_reader",
                "upc_e_reader"
            ]
        },
        locate: true
    }, function(err) {
        if (err) {
            console.error("Error al inicializar QuaggaJS:", err);
            showNotification('Error al iniciar la cámara: ' + err.name, 'error');
            return;
        }
        
        console.log("✅ Escáner inicializado correctamente");
        Quagga.start();
        scannerActive = true;
        
        // Dibujar líneas de detección en el canvas
        Quagga.onProcessed(function(result) {
            const drawingCtx = Quagga.canvas.ctx.overlay;
            const drawingCanvas = Quagga.canvas.dom.overlay;

            if (result) {
                if (result.boxes) {
                    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    
                    // Dibujar cajas de detección
                    result.boxes.filter(box => box !== result.box).forEach(box => {
                        Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {
                            color: "green",
                            lineWidth: 2
                        });
                    });
                }

                // Dibujar caja principal
                if (result.box) {
                    Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {
                        color: "#00F",
                        lineWidth: 2
                    });
                }

                // Dibujar línea del código
                if (result.codeResult && result.codeResult.code) {
                    Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {
                        color: 'red',
                        lineWidth: 3
                    });
                }
            }
        });
    });

    // Detectar códigos
    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        
        // Evitar escaneos duplicados rápidos
        if (code === lastScannedCode && scanCooldown) {
            return;
        }
        
        lastScannedCode = code;
        scanCooldown = true;
        
        // Feedback visual y sonoro
        vibrate(200);
        playNotificationSound();
        
        console.log("📷 Código detectado:", code);
        
        // Procesar el código detectado
        if (typeof handleBarcodeDetected === 'function') {
            handleBarcodeDetected(code);
        }
        
        // Resetear cooldown después de 2 segundos
        setTimeout(() => {
            scanCooldown = false;
            lastScannedCode = null;
        }, 2000);
    });

    return true;
}

// Detener el escáner
function stopScanner() {
    if (scannerActive && typeof Quagga !== 'undefined') {
        Quagga.stop();
        scannerActive = false;
        console.log("⏹️ Escáner detenido");
    }
}

// Cambiar cámara (frontal/trasera)
function switchCamera() {
    if (!scannerActive) return;
    
    stopScanner();
    
    // Alternar entre cámaras
    const currentFacingMode = Quagga.CameraAccess.getActiveStreamLabel();
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    // Reiniciar con la nueva cámara
    setTimeout(() => {
        initializeScanner(newFacingMode);
    }, 500);
}

// Tomar foto del escáner
function captureFrame() {
    if (!scannerActive) return null;
    
    const canvas = Quagga.canvas.dom.image;
    return canvas.toDataURL('image/jpeg');
}

// Escaneo manual mediante input
function setupManualInput(inputId, callbackFn) {
    const input = document.getElementById(inputId);
    
    if (!input) {
        console.warn(`Input con id "${inputId}" no encontrado`);
        return;
    }
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = input.value.trim();
            
            if (code) {
                console.log("⌨️ Código ingresado manualmente:", code);
                
                if (typeof callbackFn === 'function') {
                    callbackFn(code);
                } else if (typeof handleBarcodeDetected === 'function') {
                    handleBarcodeDetected(code);
                }
                
                input.value = '';
            }
        }
    });
}

// Validar formato de código de barras
function validateBarcodeFormat(code) {
    const formats = {
        'EAN-13': /^[0-9]{13}$/,
        'EAN-8': /^[0-9]{8}$/,
        'UPC-A': /^[0-9]{12}$/,
        'Code-128': /^[0-9A-Za-z\-\.\/\+\%]{1,}$/,
        'Code-39': /^[0-9A-Z\-\.\ \$\/\+\%]{1,}$/
    };
    
    for (let [format, regex] of Object.entries(formats)) {
        if (regex.test(code)) {
            return { valid: true, format: format };
        }
    }
    
    return { valid: false, format: 'Desconocido' };
}

// Calcular dígito verificador EAN-13
function calculateEAN13CheckDigit(code) {
    if (code.length !== 12) return null;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(code[i]);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit;
}

// Verificar si un código EAN-13 es válido
function isValidEAN13(code) {
    if (!/^[0-9]{13}$/.test(code)) return false;
    
    const providedCheckDigit = parseInt(code[12]);
    const calculatedCheckDigit = calculateEAN13CheckDigit(code.substring(0, 12));
    
    return providedCheckDigit === calculatedCheckDigit;
}

// Obtener información del país por código de barras
function getCountryFromBarcode(code) {
    if (code.length < 3) return 'Desconocido';
    
    const prefix = code.substring(0, 3);
    const countries = {
        '779': 'Argentina',
        '780': 'Chile',
        '850': 'Cuba',
        '00-09': 'Estados Unidos/Canadá',
        '30-37': 'Francia',
        '40-44': 'Alemania',
        '50': 'Reino Unido',
        '690-699': 'China',
        '80-83': 'Italia',
        '84': 'España',
        '87': 'Países Bajos',
        '90-91': 'Austria'
    };
    
    for (let [range, country] of Object.entries(countries)) {
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(Number);
            const prefixNum = parseInt(prefix);
            if (prefixNum >= start && prefixNum <= end) {
                return country;
            }
        } else if (prefix.startsWith(range)) {
            return country;
        }
    }
    
    return 'Otro país';
}

// Generar código de barras ficticio (para testing)
function generateRandomBarcode(type = 'EAN-13') {
    if (type === 'EAN-13') {
        const countryCode = '779'; // Argentina
        const randomDigits = Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
        const code12 = countryCode + randomDigits;
        const checkDigit = calculateEAN13CheckDigit(code12);
        return code12 + checkDigit;
    }
    
    return '0000000000000';
}

// Limpiar recursos al salir de la página
window.addEventListener('beforeunload', () => {
    if (scannerActive) {
        stopScanner();
    }
});

console.log('✅ Scanner.js cargado correctamente');