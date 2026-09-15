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
const startCamBtn = document.getElementById('startCamBtn');
const backToLegalBtn = document.getElementById('backToLegalBtn');
const cameraStream = document.getElementById('cameraStream');
const driveVoiceBtn = document.getElementById('driveVoiceBtn');

let mediaStream = null;

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

// Botón para reiniciar/reactivar la cámara
if (startCamBtn) {
    startCamBtn.addEventListener('click', async () => {
        status.textContent = "Reiniciando cámara...";
        await activarCamaraConduccion();
        speakAsistente("Cámara reiniciada.");
    });
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

// Configurar PDF.js
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

// Controles de Lectores de Texto
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

// Control por Voz (Sin bucles infinitos)
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