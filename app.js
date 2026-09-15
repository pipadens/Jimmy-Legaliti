const textInput = document.getElementById('textInput');
const speakBtn = document.getElementById('speakBtn');
const stopBtn = document.getElementById('stopBtn');
const micBtn = document.getElementById('micBtn');
const clearBtn = document.getElementById('clearBtn');
const pdfInput = document.getElementById('pdfInput');
const status = document.getElementById('status');

// Elementos de Conducción y Cámara
const legalSection = document.getElementById('legalSection');
const driveSection = document.getElementById('driveSection');
const toggleCamBtn = document.getElementById('toggleCamBtn');
const startCamBtn = document.getElementById('startCamBtn');
const backToLegalBtn = document.getElementById('backToLegalBtn');
const cameraStream = document.getElementById('cameraStream');
const voiceCommandBtn = document.getElementById('voiceCommandBtn');
const driveVoiceBtn = document.getElementById('driveVoiceBtn');

let mediaStream = null;

// Función auxiliar para que Jimmy hable de forma segura
function speakAsistente(texto) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
}

// Control Inteligente de la Cámara Principal
if (toggleCamBtn) {
    toggleCamBtn.addEventListener('click', async () => {
        if (!mediaStream) {
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "environment" }, 
                    audio: false 
                });
                cameraStream.srcObject = mediaStream;
                status.textContent = "Cámara de apoyo activa.";
                speakAsistente("Cámara encendida.");
                
                toggleCamBtn.textContent = "⏹️ Apagar Cámara";
                toggleCamBtn.classList.remove('primary');
                toggleCamBtn.classList.add('danger');
            } catch (err) {
                status.textContent = "Error al acceder a la cámara.";
                speakAsistente("No se pudo acceder a la cámara.");
                console.error(err);
            }
        } else {
            stopCamera();
            toggleCamBtn.textContent = "📷 Encender Cámara";
            toggleCamBtn.classList.remove('danger');
            toggleCamBtn.classList.add('primary');
        }
    });
}

// Control de la Cámara en Modo Conducción
if (startCamBtn) {
    startCamBtn.addEventListener('click', async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" }, 
                audio: false 
            });
            cameraStream.srcObject = mediaStream;
            status.textContent = "Cámara de apoyo activa.";
            speakAsistente("Cámara encendida. Mantén la vista al frente.");
        } catch (err) {
            status.textContent = "Error al acceder a la cámara.";
            console.error(err);
        }
    });
}

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        cameraStream.srcObject = null;
        mediaStream = null;
    }
    status.textContent = "Cámara apagada.";
}

// Volver al menú legal (Control único centralizado)
if (backToLegalBtn) {
    backToLegalBtn.addEventListener('click', () => {
        stopCamera();
        if (driveSection) driveSection.style.display = 'none';
        if (legalSection) legalSection.style.display = 'block';
        window.speechSynthesis.cancel();
        speakAsistente("Regresando al menú principal.");
    });
}

// Configurar el worker de PDF.js
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Cargar PDF
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

// Text-to-Speech principal
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

// Control por Voz (Dictado y Comandos optimizado sin bucles)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false; // Evita el bucle infinito de acumulación
    recognition.interimResults = true;

    let recognizing = false;

    recognition.onstart = () => {
        recognizing = true;
        status.textContent = "Jimmy está escuchando...";
    };

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

    recognition.onerror = (event) => {
        console.error("Error de voz:", event.error);
        status.textContent = "Error en el reconocimiento de voz.";
    };

    recognition.onend = () => {
        recognizing = false;
        status.textContent = "Dictado finalizado.";
    };

    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (recognizing) {
                recognition.stop();
            } else {
                try {
                    recognition.start();
                } catch (e) {
                    console.error(e);
                }
            }
        });
    }

    if (voiceCommandBtn) {
        voiceCommandBtn.addEventListener('click', () => {
            speakAsistente("Te escucho. Di tus comandos.");
            try {
                recognition.start();
            } catch (e) {
                console.error(e);
            }
        });
    }

    if (driveVoiceBtn) {
        driveVoiceBtn.addEventListener('click', () => {
            speakAsistente("Comando de voz activado en copiloto.");
            try {
                recognition.start();
            } catch (e) {
                console.error(e);
            }
        });
    }

} else {
    if (micBtn) micBtn.style.display = 'none';
    if (voiceCommandBtn) voiceCommandBtn.style.display = 'none';
    if (driveVoiceBtn) driveVoiceBtn.style.display = 'none';
}