const textInput = document.getElementById('textInput');
const speakBtn = document.getElementById('speakBtn');
const stopBtn = document.getElementById('stopBtn');
const micBtn = document.getElementById('micBtn');
const clearBtn = document.getElementById('clearBtn');
const pdfInput = document.getElementById('pdfInput');
const status = document.getElementById('status');

// Elementos del Modo Conducción y Cámara
const toggleDriveBtn = document.getElementById('toggleDriveBtn');
const legalSection = document.getElementById('legalSection');
const driveSection = document.getElementById('driveSection');
const backToLegalBtn = document.getElementById('backToLegalBtn');
const cameraStream = document.getElementById('cameraStream');
const driveVoiceBtn = document.getElementById('driveVoiceBtn');

// Controles de Visión Artificial (Zoom, Filtros y Linterna)
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const contrastBtn = document.getElementById('contrastBtn');
const antiglareBtn = document.getElementById('antiglareBtn');
const torchBtn = document.getElementById('torchBtn');

let mediaStream = null;
let currentZoom = 1;
let highContrastActive = false;
let antiGlareActive = false;
let torchOn = false;

// Función auxiliar para que Jimmy hable
function speakAsistente(texto) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
}

// Activar Modo Ojo Artificial y encender cámara automáticamente
if (toggleDriveBtn) {
    toggleDriveBtn.addEventListener('click', async () => {
        legalSection.style.display = 'none';
        driveSection.style.display = 'block';
        speakAsistente("Modo Ojo Artificial activado. Encendiendo cámara.");
        await activarCamaraConduccion();
    });
}

// Función central para iniciar la cámara trasera de forma segura
async function activarCamaraConduccion() {
    try {
        stopCamera();
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" }, 
            audio: false 
        });
        
        if (cameraStream && mediaStream) {
            cameraStream.srcObject = mediaStream;
            status.textContent = "Ojo artificial (cámara) activo.";
        }
    } catch (err) {
        status.textContent = "Error: No se pudo acceder a la cámara.";
        speakAsistente("No se pudo acceder a la cámara. Revisa los permisos.");
        console.error(err);
    }
}

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        cameraStream.srcObject = null;
        mediaStream = null;
    }
}

// Volver al menú legal
if (backToLegalBtn) {
    backToLegalBtn.addEventListener('click', () => {
        stopCamera();
        if (driveSection) driveSection.style.display = 'none';
        if (legalSection) legalSection.style.display = 'block';
        window.speechSynthesis.cancel();
        speakAsistente("Regresando al menú legal.");
    });
}

// --- CONTROLES DE ADAPTACIÓN VISUAL (Para la carnosidad y distancia) ---

// 1. Zoom para Distancia
if (zoomInBtn && zoomOutBtn) {
    zoomInBtn.addEventListener('click', async () => {
        if (!mediaStream) return;
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if ('zoom' in capabilities) {
            currentZoom = Math.min(currentZoom + 1, capabilities.zoom.max);
            await track.applyConstraints({ advanced: [{ zoom: currentZoom }] });
        } else {
            currentZoom += 0.5;
            cameraStream.style.transform = `scale(${currentZoom})`;
        }
        speakAsistente("Zoom acercado.");
    });

    zoomOutBtn.addEventListener('click', async () => {
        if (!mediaStream) return;
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if ('zoom' in capabilities) {
            currentZoom = Math.max(currentZoom - 1, capabilities.zoom.min);
            await track.applyConstraints({ advanced: [{ zoom: currentZoom }] });
        } else {
            currentZoom = Math.max(1, currentZoom - 0.5);
            cameraStream.style.transform = `scale(${currentZoom})`;
        }
        speakAsistente("Zoom alejado.");
    });
}

// 2. Filtro de Alto Contraste (Para texto y señales)
if (contrastBtn) {
    contrastBtn.addEventListener('click', () => {
        highContrastActive = !highContrastActive;
        antiGlareActive = false;
        updateCameraFilters();
        speakAsistente(highContrastActive ? "Alto contraste activado." : "Contraste normal.");
    });
}

// 3. Filtro Anti-reflejo (Para proteger de la luz molesta / fotofobia)
if (antiglareBtn) {
    antiglareBtn.addEventListener('click', () => {
        antiGlareActive = !antiGlareActive;
        highContrastActive = false;
        updateCameraFilters();
        speakAsistente(antiGlareActive ? "Filtro anti-reflejo activado." : "Filtro anti-reflejo desactivado.");
    });
}

function updateCameraFilters() {
    if (highContrastActive) {
        cameraStream.style.filter = "contrast(220%) saturate(150%)";
        contrastBtn.textContent = "👁️ Desactivar Contraste";
        antiglareBtn.textContent = "🕶️ Anti-reflejo";
    } else if (antiGlareActive) {
        cameraStream.style.filter = "brightness(0.65) contrast(140%)";
        antiglareBtn.textContent = "🕶️ Desactivar Anti-reflejo";
        contrastBtn.textContent = "👁️ Alto Contraste";
    } else {
        cameraStream.style.filter = "none";
        contrastBtn.textContent = "👁️ Alto Contraste";
        antiglareBtn.textContent = "🕶️ Anti-reflejo";
    }
}

// 4. Linterna / Visión Nocturna
if (torchBtn) {
    torchBtn.addEventListener('click', async () => {
        if (!mediaStream) {
            speakAsistente("Enciende el Ojo Artificial primero.");
            return;
        }

        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();

        try {
            if ('torch' in capabilities) {
                torchOn = !torchOn;
                await track.applyConstraints({ advanced: [{ torch: torchOn }] });
                torchBtn.textContent = torchOn ? "💡 Apagar Linterna" : "🔦 Linterna / Visión Nocturna";
                speakAsistente(torchOn ? "Linterna encendida." : "Linterna apagada.");
            } else {
                torchOn = !torchOn;
                if (torchOn) {
                    cameraStream.style.filter = "brightness(1.9) contrast(1.5)";
                    torchBtn.textContent = "🌙 Apagar Modo Noche";
                    speakAsistente("Modo noche visual activado.");
                } else {
                    cameraStream.style.filter = "none";
                    torchBtn.textContent = "🔦 Linterna / Visión Nocturna";
                    speakAsistente("Modo noche desactivado.");
                }
            }
        } catch (err) {
            console.error("Error con la linterna:", err);
            speakAsistente("No se pudo encender la linterna en este equipo.");
        }
    });
}

// --- LECTOR DE PDF Y TEXTO ---
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

if (pdfInput) {
    pdfInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        status.textContent = "Jimmy está procesando el PDF...";
        const fileReader = new FileReader();

        fileReader.onload = async function() {
            const typedarray = new Uint8Array(this.result);
            try {
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += `--- Página ${i} ---\n` + pageText + '\n\n';
                }
                textInput.value = fullText;
                status.textContent = "¡PDF cargado con éxito!";
                speakAsistente("PDF cargado con éxito. Listo para leer.");
            } catch (error) {
                status.textContent = "Error al leer el PDF.";
                console.error(error);
            }
        };
        fileReader.readAsArrayBuffer(file);
    });
}

if (speakBtn) {
    speakBtn.addEventListener('click', () => {
        if (!textInput.value.trim()) {
            speakAsistente("No hay texto para leer.");
            return;
        }
        speakAsistente(textInput.value);
        status.textContent = "Jimmy Legaliti está leyendo...";
    });
}

if (stopBtn) {
    stopBtn.addEventListener('click', () => {
        window.speechSynthesis.cancel();
        status.textContent = "Lectura detenida.";
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        window.speechSynthesis.cancel();
        textInput.value = '';
        status.textContent = "Texto borrado.";
    });
}

// --- RECONOCIMIENTO DE VOZ (Sin bucles) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        if (finalTranscript) {
            textInput.value += (textInput.value ? ' ' : '') + finalTranscript.trim();
        }
    };

    recognition.onend = () => {
        status.textContent = "Dictado finalizado.";
    };

    if (micBtn) {
        micBtn.addEventListener('click', () => {
            try {
                recognition.start();
                status.textContent = "Jimmy está escuchando...";
            } catch (e) {
                recognition.stop();
            }
        });
    }

    if (driveVoiceBtn) {
        driveVoiceBtn.addEventListener('click', () => {
            speakAsistente("Te escucho en modo copiloto.");
            try {
                recognition.start();
                status.textContent = "Escuchando comandos...";
            } catch (e) {
                recognition.stop();
            }
        });
    }
}