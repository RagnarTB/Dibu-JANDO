import { useState, useRef, useEffect } from "react";

// --- ESTILOS "CROSS-PLATFORM" ---
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

  // UI LAYER
  uiLayer: {
    position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%',
    zIndex: 30, pointerEvents: 'none',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)'
  },

  // INDICADOR REC
  recIndicator: {
    position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(255, 59, 48, 0.9)', color: 'white',
    padding: '6px 16px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px',
    zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: '0 0 20px rgba(255, 59, 48, 0.6)',
    animation: 'pulseRed 1.5s infinite'
  },

  // PREVIEW MODAL (PANTALLA DE VIDEO)
  previewOverlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '20px'
  },
  previewVideo: {
    width: '100%', maxHeight: '70vh', borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', marginBottom: '20px',
    background: '#111'
  },
  previewActions: {
    display: 'flex', gap: '20px', width: '100%', justifyContent: 'center'
  },

  // DOCK FLOTANTE
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

  // BOTONES DE ACCIÓN (Guardar/Borrar)
  saveBtn: { background: '#00E676', color: '#000', padding: '15px 30px', borderRadius: '50px', fontWeight: 'bold', border: 'none', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  discardBtn: { background: '#FF3B30', color: '#fff', padding: '15px 30px', borderRadius: '50px', fontWeight: 'bold', border: 'none', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },

  recordBtn: { background: '#222', border: '1px solid #ff4444', color: '#ff4444' },
  recordBtnActive: { background: '#ff4444', color: '#fff' },

  sliderContainer: { flex: 1, display: 'flex', alignItems: 'center', height: '100%', padding: '0 5px' },
  slider: { width: '100%', accentColor: '#00E5FF', height: '4px', cursor: 'pointer' },

  floatingUnlock: {
    position: 'absolute', top: '30px', right: '20px', zIndex: 100,
    width: '50px', height: '50px', borderRadius: '50%', border: 'none',
    background: '#FF3D00', color: 'white', fontSize: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto'
  },

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    background: '#000', zIndex: 50,
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

  // --- ESTADOS DE VIDEO ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null); // URL para previsualizar
  const [videoBlob, setVideoBlob] = useState(null); // El archivo en crudo

  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const streamRef = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imgHiddenRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. INICIALIZACIÓN
  useEffect(() => {
    // Estilos CSS para animaciones
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes pulseRed { 0% { opacity: 1; transform: translateX(-50%) scale(1); } 50% { opacity: 0.8; transform: translateX(-50%) scale(1.05); } 100% { opacity: 1; transform: translateX(-50%) scale(1); } }
      .glitch { font-weight: 900; letter-spacing: 4px; color: white; }
    `;
    document.head.appendChild(styleSheet);

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true // IMPORTANTE: Algunos navegadores fallan si no pides audio al grabar video
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.volume = 0; // Silenciar feedback local
        }
      } catch (err) {
        console.error("Error cámara:", err);
        alert("Permite el acceso a cámara y micrófono para grabar.");
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

  // --- LÓGICA DE GRABACIÓN MULTIPLATAFORMA ---

  // Función para detectar el mejor formato soportado por el celular
  const getSupportedMimeType = () => {
    const types = [
      'video/mp4',             // Ideal para iOS (Safari 14.1+)
      'video/webm;codecs=h264',// Bueno para Chrome/Android
      'video/webm;codecs=vp9', // Alta calidad Android
      'video/webm'             // Fallback estándar
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log("Formato elegido:", type);
        return type;
      }
    }
    return ''; // Dejar que el navegador elija el default
  };

  const handleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : undefined;

    try {
      const recorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = recorder;
      recordedChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // AL DETENER, CREAMOS EL BLOB Y LA URL PARA PREVISUALIZAR
        const type = mediaRecorderRef.current.mimeType || 'video/webm';
        const blob = new Blob(recordedChunks.current, { type });
        const url = URL.createObjectURL(blob);

        setVideoBlob(blob);
        setRecordedVideoUrl(url); // Esto activará la pantalla de preview
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Error al iniciar grabación: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // --- GUARDAR O DESCARTAR ---
  const saveVideoToDevice = () => {
    if (!videoBlob) return;

    // Determinar extensión correcta
    const isMp4 = videoBlob.type.includes('mp4');
    const extension = isMp4 ? 'mp4' : 'webm';

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = recordedVideoUrl;
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    a.download = `Sketch_Video_${date}.${extension}`;
    a.click();

    closePreview();
  };

  const closePreview = () => {
    setRecordedVideoUrl(null);
    setVideoBlob(null);
    // Limpiar memoria
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
  };

  // --- PROCESAMIENTO DE IMAGEN (Igual que versión 8) ---
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      setAiMessage("🧠 Analizando...");
      setImgUrl(URL.createObjectURL(e.target.files[0]));
      e.target.value = null;
    }
  };

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
        let dsize = new cv.Size(internalWidth, src.rows * scaleFactor);
        let resizedSrc = new cv.Mat();
        cv.resize(src, resizedSrc, dsize, 0, 0, cv.INTER_AREA);

        // Auto-detección
        if (aiMessage === "🧠 Analizando...") {
          let gray = new cv.Mat(); cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);
          let edges = new cv.Mat(); cv.Canny(gray, edges, 80, 150);
          let complexity = cv.countNonZero(edges) / (internalWidth * dsize.height);
          if (complexity > 0.08) { setMode('scenery'); setAiMessage("🏞️ Modo Paisaje"); }
          else { setMode('character'); setAiMessage("✨ Modo Personaje"); }
          gray.delete(); edges.delete(); setTimeout(() => setAiMessage(null), 2000);
        }

        if (mode === 'character') {
          let gray = new cv.Mat(); cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);
          let smooth = new cv.Mat(); cv.bilateralFilter(gray, smooth, 12, 100, 100);
          cv.adaptiveThreshold(smooth, dst, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 17, 7);
          let kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
          cv.morphologyEx(dst, dst, cv.MORPH_CLOSE, kernel);
          gray.delete(); smooth.delete(); kernel.delete();
        } else {
          let gray = new cv.Mat(); cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);
          let posterized = new cv.Mat(); cv.bilateralFilter(gray, posterized, 9, 75, 75);
          for (let i = 0; i < posterized.data.length; i++) posterized.data[i] = Math.floor(posterized.data[i] / 40) * 40;
          let edges = new cv.Mat(); cv.adaptiveThreshold(gray, edges, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 9, 3);
          cv.bitwise_and(posterized, edges, dst);
          gray.delete(); posterized.delete(); edges.delete();
        }

        cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);

        let finalScale = Math.min(canvas.width / resizedSrc.cols, canvas.height / resizedSrc.rows);
        let finalW = resizedSrc.cols * finalScale;
        let finalH = resizedSrc.rows * finalScale;
        let finalResized = new cv.Mat();
        cv.resize(dst, finalResized, new cv.Size(finalW, finalH), 0, 0, cv.INTER_LINEAR);

        let fullScreenMat = new cv.Mat(canvas.height, canvas.width, cv.CV_8UC4, new cv.Scalar(255, 255, 255, 255));
        let roi = fullScreenMat.roi(new cv.Rect((canvas.width - finalW) / 2, (canvas.height - finalH) / 2, finalW, finalH));
        finalResized.copyTo(roi);

        cv.imshow('drawing-canvas', fullScreenMat);

        src.delete(); dst.delete(); resizedSrc.delete(); fullScreenMat.delete(); roi.delete(); finalResized.delete();
        setIsProcessing(false);
      } catch (e) { setIsProcessing(false); }
    };

    if (imgElement.complete && imgElement.naturalHeight !== 0) setTimeout(process, 100);
    else imgElement.onload = () => setTimeout(process, 100);
  }, [imgUrl, isCvReady, mode, aiMessage]);

  return (
    <div style={styles.container}>

      {/* 1. OVERLAY DE PREVISUALIZACIÓN (APARECE AL TERMINAR DE GRABAR) */}
      {recordedVideoUrl && (
        <div style={styles.previewOverlay}>
          <h2 style={{ color: 'white', marginBottom: '20px' }}>Vista Previa</h2>
          <video
            src={recordedVideoUrl}
            controls
            playsInline
            autoPlay
            style={styles.previewVideo}
          />
          <div style={styles.previewActions}>
            <button onClick={closePreview} style={styles.discardBtn}>🗑️ Borrar</button>
            <button onClick={saveVideoToDevice} style={styles.saveBtn}>⬇️ Guardar</button>
          </div>
        </div>
      )}

      {/* 2. UI NORMAL (SOLO VISIBLE SI NO HAY PREVIEW) */}
      {!recordedVideoUrl && (
        <>
          {isRecording && (
            <div style={styles.recIndicator}>
              <div style={{ width: 10, height: 10, background: 'white', borderRadius: '50%' }}></div>
              REC
            </div>
          )}

          {aiMessage && (
            <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '8px 16px', borderRadius: 20, fontWeight: 'bold', zIndex: 60 }}>
              {aiMessage}
            </div>
          )}

          {(!isCvReady || isProcessing) && (
            <div style={styles.loadingOverlay}>
              <div className="glitch" style={{ fontSize: 32, marginBottom: 10 }}>CARGANDO...</div>
            </div>
          )}

          <img ref={imgHiddenRef} src={imgUrl} style={{ display: 'none' }} alt="source" />
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />

          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
          <canvas id="drawing-canvas" ref={canvasRef} style={{ ...styles.canvas, opacity: opacity }} />

          {isLocked && <button onClick={() => setIsLocked(false)} style={styles.floatingUnlock}>🔓</button>}

          {!isLocked && isCvReady && !isProcessing && (
            <div style={styles.uiLayer}>
              <div style={styles.dockContainer}>
                <div style={styles.dock}>

                  <div style={styles.row}>
                    <span style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>OPACIDAD</span>
                    <div style={styles.sliderContainer}>
                      <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(e.target.value)} style={styles.slider} />
                    </div>
                  </div>

                  <div style={{ ...styles.row, background: 'rgba(255,255,255,0.05)', padding: 5, borderRadius: 16 }}>
                    <button onClick={() => setMode('character')} style={mode === 'character' ? { ...styles.btn, ...styles.activeBtn } : styles.btn}>🧑‍🦱 Pers.</button>
                    <button onClick={() => setMode('scenery')} style={mode === 'scenery' ? { ...styles.btn, ...styles.activeBtn } : styles.btn}>🏞️ Paisaje</button>
                  </div>

                  <div style={styles.row}>
                    <button onClick={handleRecording} style={isRecording ? { ...styles.btn, ...styles.recordBtnActive } : { ...styles.btn, ...styles.recordBtn }}>
                      {isRecording ? "⏹ PARAR" : "⏺ GRABAR"}
                    </button>
                  </div>

                  <div style={styles.row}>
                    <button onClick={() => fileInputRef.current.click()} style={{ ...styles.btn, background: 'white', color: 'black' }}>📂 Foto</button>
                    <button onClick={() => setIsLocked(true)} style={{ ...styles.btn, background: '#FF3D00', color: 'white' }}>🔒 Lock</button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}