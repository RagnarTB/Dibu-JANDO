import { useState, useRef, useEffect } from "react";

// --- ESTILOS "RECORDER EDITION" ---
const styles = {
  container: {
    position: 'relative', height: '100vh', width: '100vw',
    background: '#000', overflow: 'hidden', fontFamily: '-apple-system, sans-serif'
  },
  video: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    objectFit: 'cover', opacity: 1
  },
  canvas: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    objectFit: 'contain', zIndex: 10, pointerEvents: 'none',
    mixBlendMode: 'multiply',
    filter: 'contrast(1.6) brightness(1.05) grayscale(100%)'
  },

  // INDICADOR DE GRABACIÓN (REC 🔴)
  recIndicator: {
    position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(255, 0, 0, 0.8)', color: 'white',
    padding: '5px 15px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px',
    zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)',
    animation: 'pulseRed 1.5s infinite'
  },

  // UI CAPA
  uiLayer: {
    position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%',
    zIndex: 30, pointerEvents: 'none',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)'
  },

  // NOTIFICACIÓN IA
  aiToast: {
    position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.95)', color: '#000',
    padding: '8px 20px', borderRadius: '30px',
    fontWeight: '700', fontSize: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 60,
    animation: 'slideDown 0.5s ease-out'
  },

  // BARRA FLOTANTE
  dockContainer: {
    width: '100%', padding: '20px', paddingBottom: '30px',
    display: 'flex', justifyContent: 'center', pointerEvents: 'none'
  },
  dock: {
    pointerEvents: 'auto',
    width: '100%', maxWidth: '420px',
    background: 'rgba(20, 20, 20, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px',
    padding: '16px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex', flexDirection: 'column', gap: '16px'
  },

  row: { display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' },

  btn: {
    flex: 1, height: '48px', border: 'none', borderRadius: '16px',
    fontSize: '11px', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    transition: '0.2s', textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'white', background: 'rgba(255,255,255,0.06)'
  },
  activeBtn: { background: '#00E5FF', color: '#000' },
  actionBtn: { background: '#fff', color: '#000' },

  // BOTÓN GRABAR (ESTILO ESPECIAL)
  recordBtn: {
    background: '#222', border: '1px solid #ff4444', color: '#ff4444'
  },
  recordBtnActive: {
    background: '#ff4444', color: '#fff', boxShadow: '0 0 15px rgba(255, 68, 68, 0.4)'
  },

  sliderContainer: { flex: 1, display: 'flex', alignItems: 'center', height: '100%', padding: '0 5px' },
  slider: { width: '100%', accentColor: '#00E5FF', height: '4px', cursor: 'pointer' },

  floatingUnlock: {
    position: 'absolute', top: '30px', right: '20px', zIndex: 100,
    width: '56px', height: '56px', borderRadius: '50%', border: 'none',
    background: 'rgba(255, 61, 0, 0.9)', color: 'white', fontSize: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(255, 61, 0, 0.4)', pointerEvents: 'auto'
  },

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    background: '#000', zIndex: 200,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    color: '#00E5FF'
  }
};

export default function App() {
  const [opacity, setOpacity] = useState(0.75);
  const [imgUrl, setImgUrl] = useState(null);
  const [mode, setMode] = useState('character');
  const [isCvReady, setIsCvReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);

  // ESTADOS DE GRABACIÓN
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imgHiddenRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null); // Guardamos el stream original aquí

  // 1. INICIALIZACIÓN
  useEffect(() => {
    // Estilos dinámicos
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      @keyframes pulseRed { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      .glitch { font-weight: 900; letter-spacing: 4px; text-shadow: 2px 0 #fff, -2px 0 #FF00C1; }
    `;
    document.head.appendChild(styleSheet);

    // INICIAR CÁMARA
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false // No grabamos audio por privacidad y ruido
        });

        streamRef.current = stream; // Guardamos referencia para el grabador
        if (videoRef.current) videoRef.current.srcObject = stream;

      } catch (err) {
        console.error("Error cámara:", err);
        alert("No se pudo iniciar la cámara.");
      }
    }
    startCamera();

    const checkCv = setInterval(() => {
      if (window.cv && window.cv.imread) {
        setIsCvReady(true);
        clearInterval(checkCv);
      }
    }, 500);
    return () => clearInterval(checkCv);
  }, []);

  // --- LÓGICA DE GRABACIÓN ---
  const handleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    // Detectar mejor formato soportado (WebM para Android, MP4/QuickTime para iOS)
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      options = { mimeType: 'video/webm' };
      if (!MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/mp4' }; // Safari 14.1+
        if (!MediaRecorder.isTypeSupported('video/mp4')) {
          options = undefined; // Dejar que el navegador elija
        }
      }
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = recorder;
      recordedChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      recorder.onstop = saveVideo;
      recorder.start();
      setIsRecording(true);
      setAiMessage("🔴 GRABANDO PAPEL...");
      setTimeout(() => setAiMessage(null), 2000);

    } catch (err) {
      console.error("Error al grabar:", err);
      alert("Tu celular no soporta grabación directa.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAiMessage("💾 GUARDANDO VIDEO...");
      setTimeout(() => setAiMessage(null), 3000);
    }
  };

  const saveVideo = () => {
    const blob = new Blob(recordedChunks.current, {
      type: mediaRecorderRef.current.mimeType || 'video/webm'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    // Nombre del archivo con fecha
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    a.download = `Drawing_Process_${date}.webm`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // ---------------------------

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      setAiMessage("🧠 Analizando...");
      setImgUrl(URL.createObjectURL(e.target.files[0]));
      e.target.value = null;
    }
  };

  // MOTOR DE PROCESAMIENTO (Igual que v8)
  useEffect(() => {
    if (!imgUrl || !isCvReady) return;
    const imgElement = imgHiddenRef.current;
    const process = () => {
      try {
        const cv = window.cv;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let src = cv.imread(imgElement);
        let dst = new cv.Mat();
        const internalWidth = 1000;
        let scaleFactor = internalWidth / src.cols;
        let internalHeight = src.rows * scaleFactor;
        let dsizeInternal = new cv.Size(internalWidth, internalHeight);
        let resizedSrc = new cv.Mat();
        cv.resize(src, resizedSrc, dsizeInternal, 0, 0, cv.INTER_AREA);

        if (aiMessage === "🧠 Analizando...") {
          let grayCheck = new cv.Mat();
          cv.cvtColor(resizedSrc, grayCheck, cv.COLOR_RGBA2GRAY);
          let edgesCheck = new cv.Mat();
          cv.Canny(grayCheck, edgesCheck, 80, 150);
          let complexity = cv.countNonZero(edgesCheck) / (internalWidth * internalHeight);
          if (complexity > 0.08) {
            setMode('scenery');
            setAiMessage("🏞️ Modo Paisaje");
          } else {
            setMode('character');
            setAiMessage("✨ Modo Personaje");
          }
          grayCheck.delete(); edgesCheck.delete();
          setTimeout(() => setAiMessage(null), 2500);
        }

        if (mode === 'character') {
          let gray = new cv.Mat();
          cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);
          let smooth = new cv.Mat();
          cv.bilateralFilter(gray, smooth, 12, 100, 100);
          cv.adaptiveThreshold(smooth, dst, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 17, 7);
          let kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
          cv.morphologyEx(dst, dst, cv.MORPH_CLOSE, kernel);
          gray.delete(); smooth.delete(); kernel.delete();
        }
        else if (mode === 'scenery') {
          let gray = new cv.Mat();
          cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);
          let posterized = new cv.Mat();
          cv.bilateralFilter(gray, posterized, 9, 75, 75);
          for (let i = 0; i < posterized.data.length; i++) {
            posterized.data[i] = Math.floor(posterized.data[i] / 40) * 40;
          }
          let edges = new cv.Mat();
          cv.adaptiveThreshold(gray, edges, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 9, 3);
          cv.bitwise_and(posterized, edges, dst);
          gray.delete(); posterized.delete(); edges.delete();
        }

        cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);

        let finalScale = Math.min(canvas.width / resizedSrc.cols, canvas.height / resizedSrc.rows);
        let finalW = resizedSrc.cols * finalScale;
        let finalH = resizedSrc.rows * finalScale;
        let xOff = (canvas.width - finalW) / 2;
        let yOff = (canvas.height - finalH) / 2;

        let finalResized = new cv.Mat();
        cv.resize(dst, finalResized, new cv.Size(finalW, finalH), 0, 0, cv.INTER_LINEAR);

        let fullScreenMat = new cv.Mat(canvas.height, canvas.width, cv.CV_8UC4, new cv.Scalar(255, 255, 255, 255));
        let roiRect = new cv.Rect(xOff, yOff, finalW, finalH);
        let destinationRoi = fullScreenMat.roi(roiRect);
        finalResized.copyTo(destinationRoi);

        cv.imshow('drawing-canvas', fullScreenMat);

        src.delete(); dst.delete(); resizedSrc.delete(); fullScreenMat.delete();
        destinationRoi.delete(); finalResized.delete();
        setIsProcessing(false);
      } catch (e) { console.error(e); setIsProcessing(false); }
    };

    if (imgElement.complete && imgElement.naturalHeight !== 0) {
      setTimeout(process, 100);
    } else {
      imgElement.onload = () => setTimeout(process, 100);
    }
  }, [imgUrl, isCvReady, mode, aiMessage]);

  return (
    <div style={styles.container}>

      {/* INDICADOR REC FLOTANTE */}
      {isRecording && (
        <div style={styles.recIndicator}>
          <div style={{ width: 10, height: 10, background: 'white', borderRadius: '50%' }}></div>
          REC
        </div>
      )}

      {/* TOAST MENSAJES */}
      {aiMessage && <div style={styles.aiToast}>{aiMessage}</div>}

      {/* LOADER */}
      {(!isCvReady || isProcessing) && (
        <div style={styles.loadingOverlay}>
          <div className="glitch" style={{ fontSize: '32px', marginBottom: '15px', color: 'white' }}>ART LENS</div>
          <div style={{ color: '#666', fontSize: '12px', letterSpacing: '2px' }}>
            {isProcessing ? "RENDERIZANDO..." : "CARGANDO..."}
          </div>
        </div>
      )}

      {/* RECURSOS OCULTOS */}
      <img ref={imgHiddenRef} src={imgUrl} style={{ display: 'none' }} alt="source" />
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />

      {/* VIDEO Y LIENZO */}
      <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
      <canvas id="drawing-canvas" ref={canvasRef} style={{ ...styles.canvas, opacity: opacity }} />

      {/* BOTÓN DESBLOQUEO */}
      {isLocked && (
        <button onClick={() => setIsLocked(false)} style={styles.floatingUnlock}>🔓</button>
      )}

      {/* UI DOCK */}
      {!isLocked && isCvReady && !isProcessing && (
        <div style={styles.uiLayer}>
          <div style={styles.dockContainer}>
            <div style={styles.dock}>

              <div style={styles.row}>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', opacity: 0.8 }}>OPACIDAD</span>
                <div style={styles.sliderContainer}>
                  <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(e.target.value)} style={styles.slider} />
                </div>
              </div>

              <div style={{ ...styles.row, background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '18px' }}>
                <button onClick={() => setMode('character')} style={mode === 'character' ? { ...styles.btn, ...styles.activeBtn } : styles.btn}>
                  🧑‍🦱 Pers.
                </button>
                <button onClick={() => setMode('scenery')} style={mode === 'scenery' ? { ...styles.btn, ...styles.activeBtn } : styles.btn}>
                  🏞️ Paisaje
                </button>
              </div>

              {/* BOTON DE GRABAR AGREGADO */}
              <div style={styles.row}>
                <button
                  onClick={handleRecording}
                  style={isRecording ? { ...styles.btn, ...styles.recordBtnActive } : { ...styles.btn, ...styles.recordBtn }}>
                  {isRecording ? "⏹ DETENER" : "⏺ GRABAR"}
                </button>
              </div>

              <div style={styles.row}>
                <button onClick={() => fileInputRef.current.click()} style={{ ...styles.btn, ...styles.actionBtn }}>📂 Foto</button>
                <button onClick={() => setIsLocked(true)} style={{ ...styles.btn, ...styles.lockBtnStyle }}>🔒 Lock</button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}