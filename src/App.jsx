import { useState, useRef, useEffect } from "react";

// ==============================================
// ESTILOS: dibu-JANDO (Diseño Responsivo Total)
// ==============================================
const styles = {
  container: {
    position: 'relative',
    height: '100dvh', // Altura dinámica para móviles
    width: '100vw',
    background: '#000',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent'
  },
  video: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    objectFit: 'cover'
  },
  canvas: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    objectFit: 'contain', zIndex: 10, pointerEvents: 'none',
    mixBlendMode: 'multiply',
    filter: 'contrast(1.6) brightness(1.05) grayscale(100%)'
  },

  // --- CAPAS DE INTERFAZ ---
  uiLayer: {
    position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%',
    zIndex: 30, pointerEvents: 'none',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 30%)'
  },

  // INDICADOR DE GRABACIÓN
  recIndicator: {
    position: 'absolute', top: 'safe-area-inset-top', marginTop: '60px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(255, 59, 48, 0.95)', color: 'white',
    padding: '8px 20px', borderRadius: '30px',
    fontSize: '12px', fontWeight: '800', letterSpacing: '1px',
    zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: '0 0 20px rgba(255, 59, 48, 0.5)',
    animation: 'pulseRed 1.5s infinite'
  },

  // NOTIFICACIÓN IA (Auto-detección)
  aiToast: {
    position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.95)', color: '#000',
    padding: '10px 24px', borderRadius: '30px',
    fontWeight: '700', fontSize: '13px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 60,
    animation: 'slideDown 0.5s ease-out'
  },

  // PANTALLA DE PREVISUALIZACIÓN (PREVIEW)
  previewOverlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    background: '#050505', zIndex: 200, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '20px'
  },
  previewVideo: {
    width: '100%', maxHeight: '60dvh', borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6)', marginBottom: '30px',
    background: '#111', objectFit: 'contain'
  },
  previewActions: {
    display: 'flex', gap: '15px', width: '100%', justifyContent: 'center', maxWidth: '400px'
  },

  // MENÚ INFERIOR (DOCK)
  dockContainer: {
    width: '100%',
    padding: '15px 15px max(20px, env(safe-area-inset-bottom)) 15px',
    display: 'flex', justifyContent: 'center', pointerEvents: 'none'
  },
  dock: {
    pointerEvents: 'auto', width: '100%', maxWidth: '500px',
    background: 'rgba(18, 18, 18, 0.9)', backdropFilter: 'blur(20px)',
    borderRadius: '28px', padding: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', flexDirection: 'column', gap: '14px'
  },

  row: { display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' },

  // BOTONES
  btn: {
    flex: 1, height: '48px', border: 'none', borderRadius: '16px',
    fontSize: '11px', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    transition: '0.2s', textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'white', background: 'rgba(255,255,255,0.08)',
    touchAction: 'manipulation'
  },
  activeBtn: { background: '#00D4FF', color: '#000', boxShadow: '0 4px 12px rgba(0, 212, 255, 0.3)' },

  saveBtn: { background: '#00E676', color: '#000', padding: '16px', borderRadius: '50px', fontWeight: 'bold', border: 'none', fontSize: '14px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  discardBtn: { background: '#FF3B30', color: '#fff', padding: '16px', borderRadius: '50px', fontWeight: 'bold', border: 'none', fontSize: '14px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' },

  recordBtn: { background: '#222', border: '1px solid #ff4444', color: '#ff4444' },
  recordBtnActive: { background: '#ff4444', color: '#fff', boxShadow: '0 0 15px rgba(255, 68, 68, 0.4)' },

  sliderContainer: { flex: 1, display: 'flex', alignItems: 'center', height: '100%', padding: '0 10px' },
  slider: { width: '100%', accentColor: '#00D4FF', height: '4px', cursor: 'pointer' },

  floatingUnlock: {
    position: 'absolute', top: '40px', right: '20px', zIndex: 100,
    width: '56px', height: '56px', borderRadius: '50%', border: 'none',
    background: '#FF4757', color: 'white', fontSize: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto',
    boxShadow: '0 8px 25px rgba(0,0,0,0.4)'
  },

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    background: '#050505', zIndex: 50,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    color: '#00D4FF'
  },
  brandTitle: {
    fontSize: '32px', fontWeight: '900', letterSpacing: '2px', marginBottom: '15px',
    background: 'linear-gradient(90deg, #00D4FF, #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
  }
};

export default function App() {
  // --- ESTADOS ---
  const [opacity, setOpacity] = useState(0.75);
  const [imgUrl, setImgUrl] = useState(null);
  const [mode, setMode] = useState('character');
  const [isCvReady, setIsCvReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);

  // Estados de Grabación
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);

  // Referencias
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imgHiddenRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. INICIALIZACIÓN (Cámara y Estilos)
  useEffect(() => {
    // Inyectar animaciones
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      @keyframes pulseRed { 0% { opacity: 1; transform: translateX(-50%) scale(1); } 50% { opacity: 0.8; transform: translateX(-50%) scale(1.05); } 100% { opacity: 1; transform: translateX(-50%) scale(1); } }
      input[type=range] { -webkit-appearance: none; background: transparent; }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: #00D4FF; margin-top: -8px; box-shadow: 0 0 10px rgba(0,212,255,0.5); border: 2px solid #fff; }
      input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.2); border-radius: 2px; }
    `;
    document.head.appendChild(styleSheet);

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true // Necesario para compatibilidad de grabación
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.volume = 0; // Silenciar feedback
        }
      } catch (err) {
        alert("Para usar la app, permite el acceso a la cámara.");
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

  // 2. SISTEMA DE GRABACIÓN INTELIGENTE (Detecta Android/iOS)
  const getSupportedMimeType = () => {
    const types = [
      'video/mp4', // iOS Moderno
      'video/webm;codecs=h264', // Chrome/Android
      'video/webm;codecs=vp9',
      'video/webm'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const handleRecording = () => { isRecording ? stopRecording() : startRecording(); };

  const startRecording = () => {
    if (!streamRef.current) return;
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : undefined;

    try {
      const recorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = recorder;
      recordedChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const type = mediaRecorderRef.current.mimeType || 'video/webm';
        const blob = new Blob(recordedChunks.current, { type });
        setVideoBlob(blob);
        setRecordedVideoUrl(URL.createObjectURL(blob));
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Error grabando: " + err.message);
    }
  };

  const stopRecording = () => { if (mediaRecorderRef.current) mediaRecorderRef.current.stop(); };

  // Guardar video con extensión correcta
  const saveVideoToDevice = () => {
    if (!videoBlob) return;
    const isMp4 = videoBlob.type.includes('mp4');
    const extension = isMp4 ? 'mp4' : 'webm';

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = recordedVideoUrl;
    const date = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    a.download = `dibuJANDO_${date}.${extension}`;
    a.click();
    closePreview();
  };

  const closePreview = () => {
    setRecordedVideoUrl(null); setVideoBlob(null);
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
  };

  // 3. CARGA DE IMAGEN (Disparador de IA)
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      setAiMessage("🧠 IA Analizando...");
      setImgUrl(URL.createObjectURL(e.target.files[0]));
      e.target.value = null;
    }
  };

  // 4. MOTOR DE PROCESAMIENTO (Detección + Renderizado)
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

        // Redimensionar para consistencia
        const internalWidth = 1000;
        let scaleFactor = internalWidth / src.cols;
        let dsize = new cv.Size(internalWidth, src.rows * scaleFactor);
        let resizedSrc = new cv.Mat();
        cv.resize(src, resizedSrc, dsize, 0, 0, cv.INTER_AREA);

        // --- CEREBRO IA: CLASIFICADOR ---
        if (aiMessage === "🧠 IA Analizando...") {
          let gray = new cv.Mat(); cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);
          let edges = new cv.Mat(); cv.Canny(gray, edges, 80, 150);
          let complexity = cv.countNonZero(edges) / (internalWidth * dsize.height);

          if (complexity > 0.08) {
            setMode('scenery');
            setAiMessage("🏞️ Modo Paisaje Detectado");
          } else {
            setMode('character');
            setAiMessage("✨ Modo Personaje Detectado");
          }
          gray.delete(); edges.delete(); setTimeout(() => setAiMessage(null), 2500);
        }

        let dst = new cv.Mat();

        // --- APLICACIÓN DE FILTROS ---
        if (mode === 'character') {
          // FILTRO: LIMPIEZA DE PIEL (Elimina puntos negros)
          let gray = new cv.Mat(); cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);
          let smooth = new cv.Mat(); cv.bilateralFilter(gray, smooth, 12, 100, 100);
          // C=7 es clave para eliminar ruido
          cv.adaptiveThreshold(smooth, dst, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 17, 7);
          let kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
          cv.morphologyEx(dst, dst, cv.MORPH_CLOSE, kernel);
          gray.delete(); smooth.delete(); kernel.delete();
        }
        else {
          // FILTRO: PAISAJE MANGA (Tramas y Sombras)
          let gray = new cv.Mat(); cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);
          let posterized = new cv.Mat(); cv.bilateralFilter(gray, posterized, 9, 75, 75);
          for (let i = 0; i < posterized.data.length; i++) posterized.data[i] = Math.floor(posterized.data[i] / 40) * 40;
          let edges = new cv.Mat(); cv.adaptiveThreshold(gray, edges, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 9, 3);
          cv.bitwise_and(posterized, edges, dst);
          gray.delete(); posterized.delete(); edges.delete();
        }

        // --- RENDERIZADO CENTRADO ---
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

        // Limpieza de memoria (IMPORTANTE PARA EVITAR CRASH)
        src.delete(); dst.delete(); resizedSrc.delete(); fullScreenMat.delete();
        roi.delete(); finalResized.delete();

        setIsProcessing(false);
      } catch (e) { setIsProcessing(false); }
    };

    if (imgElement.complete && imgElement.naturalHeight !== 0) setTimeout(process, 100);
    else imgElement.onload = () => setTimeout(process, 100);
  }, [imgUrl, isCvReady, mode, aiMessage]);

  return (
    <div style={styles.container}>

      {/* 1. VISTA PREVIA (Al terminar grabación) */}
      {recordedVideoUrl && (
        <div style={styles.previewOverlay}>
          <h2 style={{ color: 'white', marginBottom: '20px', letterSpacing: '1px' }}>VISTA PREVIA</h2>
          <video src={recordedVideoUrl} controls playsInline autoPlay style={styles.previewVideo} />
          <div style={styles.previewActions}>
            <button onClick={closePreview} style={styles.discardBtn}>🗑️ DESCARTAR</button>
            <button onClick={saveVideoToDevice} style={styles.saveBtn}>💾 GUARDAR</button>
          </div>
        </div>
      )}

      {/* 2. INTERFAZ PRINCIPAL */}
      {!recordedVideoUrl && (
        <>
          {/* Indicadores flotantes */}
          {isRecording && (
            <div style={styles.recIndicator}>
              <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%' }}></div> REC
            </div>
          )}

          {aiMessage && (
            <div style={styles.aiToast}>
              {aiMessage}
            </div>
          )}

          {/* Loader Inicial */}
          {(!isCvReady || isProcessing) && (
            <div style={styles.loadingOverlay}>
              <div style={styles.brandTitle}>dibu-JANDO</div>
              <div style={{ color: '#666', fontSize: '12px', letterSpacing: '2px' }}>
                {isProcessing ? "RENDERIZANDO..." : "CARGANDO..."}
              </div>
            </div>
          )}

          {/* Elementos ocultos */}
          <img ref={imgHiddenRef} src={imgUrl} style={{ display: 'none' }} alt="source" />
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />

          {/* Capas visuales */}
          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
          <canvas id="drawing-canvas" ref={canvasRef} style={{ ...styles.canvas, opacity: opacity }} />

          {/* Botón de Desbloqueo */}
          {isLocked && <button onClick={() => setIsLocked(false)} style={styles.floatingUnlock}>🔓</button>}

          {/* DOCK INFERIOR (Controles) */}
          {!isLocked && isCvReady && !isProcessing && (
            <div style={styles.uiLayer}>
              <div style={styles.dockContainer}>
                <div style={styles.dock}>

                  {/* Slider Opacidad */}
                  <div style={styles.row}>
                    <span style={{ color: 'white', fontSize: 16 }}>👻</span>
                    <div style={styles.sliderContainer}>
                      <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(e.target.value)} style={styles.slider} />
                    </div>
                  </div>

                  {/* Selector de Modos */}
                  <div style={{ ...styles.row, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 16 }}>
                    <button onClick={() => setMode('character')} style={mode === 'character' ? { ...styles.btn, ...styles.activeBtn } : styles.btn}>🧑‍🦱 Pers.</button>
                    <button onClick={() => setMode('scenery')} style={mode === 'scenery' ? { ...styles.btn, ...styles.activeBtn } : styles.btn}>🏞️ Paisaje</button>
                  </div>

                  {/* Botón Grabar */}
                  <div style={styles.row}>
                    <button onClick={handleRecording} style={isRecording ? { ...styles.btn, ...styles.recordBtnActive } : { ...styles.btn, ...styles.recordBtn }}>
                      {isRecording ? "⏹ DETENER" : "⏺ GRABAR PROCESO"}
                    </button>
                  </div>

                  {/* Acciones Finales */}
                  <div style={styles.row}>
                    <button onClick={() => fileInputRef.current.click()} style={{ ...styles.btn, background: 'white', color: 'black' }}>📂 Foto</button>
                    <button onClick={() => setIsLocked(true)} style={{ ...styles.btn, background: '#FF4757', color: 'white' }}>🔒 Lock</button>
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