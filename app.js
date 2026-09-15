const textInput = document.getElementById('textInput');
const speakBtn = document.getElementById('speakBtn');
const stopBtn = document.getElementById('stopBtn');
const micBtn = document.getElementById('micBtn');
const clearBtn = document.getElementById('clearBtn');
const pdfInput = document.getElementById('pdfInput');
const status = document.getElementById('status');

// Elementos de Conducción
const toggleDriveBtn = document.getElementById('toggleDriveBtn');
const legalSection = document.getElementById('legalSection');
const driveSection = document.getElementById('driveSection');
const startCamBtn = document.getElementById('startCamBtn');
const backToLegalBtn = document.getElementById('backToLegalBtn');
const cameraStream = document.getElementById('cameraStream');
const voiceCommandBtn = document.getElementById('voiceCommandBtn');

let mediaStream = null;

// Cambiar entre Modo Legal y Modo Conducción
toggleDriveBtn.addEventListener('click', () => {
    legalSection.style.display = 'none';
    driveSection.style.display = 'block';
    toggleDriveBtn.style.display = 'none';
    speakAsistente("Modo Ojo Artificial activado. Listo para el camino.");
});

backToLegalBtn.addEventListener('click', () => {
    stopCamera();
    driveSection.style.display = 'none';
    legalSection.style.display = 'block';
    toggleDriveBtn.style.display = 'block';
    window.speechSynthesis.cancel();
});

// Encender Cámara del Celular para el Copiloto
startCamBtn.addEventListener('click', async () => {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" }, // Usa la cámara trasera del auto
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

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        cameraStream.srcObject = null;
    }
}

// Función auxiliar para que Jimmy hable
function speakAsistente(texto) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
}

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Cargar PDF
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
        }
    };
    fileReader.readAsArrayBuffer(file);
});

// Text-to-Speech principal
speakBtn.addEventListener('click', () => {
    if (!textInput.value.trim()) return;
    speakAsistente(textInput.value);
    status.textContent = "Jimmy Legaliti está leyendo...";
});

stopBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    status.textContent = "Lectura detenida.";
});

clearBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    textInput.value = '';
    status.textContent = "Texto borrado.";
});

// Control por Voz (Dictado y Comandos)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    micBtn.addEventListener('click', () => {
        try {
            recognition.start();
            status.textContent = "Jimmy está escuchando tu dictado...";
        } catch (e) {
            recognition.stop();
        }
    });

    voiceCommandBtn.addEventListener('click', () => {
        speakAsistente("Te escucho en modo conducción. Di tus notas o comandos.");
        try {
            recognition.start();
            status.textContent = "Escuchando comandos de voz...";
        } catch (e) {
            recognition.stop();
        }
    });

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        textInput.value += ' ' + transcript;
    };
} else {
    micBtn.style.display = 'none';
    voiceCommandBtn.style.display = 'none';
}