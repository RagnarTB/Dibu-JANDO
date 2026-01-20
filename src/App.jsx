import { useState, useRef, useEffect } from "react";

// --- ESTILOS "PREMIUM UI" (RESPONSIVE & CLEAN) ---
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
    // Filtro calibrado para líneas negras puras
    filter: 'contrast(1.6) brightness(1.05) grayscale(100%)'
  },

  // --- CAPA DE INTERFAZ ---
  uiLayer: {
    position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%',
    zIndex: 30, pointerEvents: 'none',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)'
  },

  // NOTIFICACIÓN IA (Capsula superior)
  aiToast: {
    position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.95)', color: '#000',
    padding: '10px 24px', borderRadius: '30px',
    fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 60,
    display: 'flex', alignItems: 'center', gap: '8px',
    animation: 'slideDown 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
  },

  // BARRA FLOTANTE (ISLAND DESIGN)
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

  // FILAS DE CONTROLES
  row: { display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' },

  // BOTONES MODERNOS
  btn: {
    flex: 1, height: '48px', border: 'none', borderRadius: '16px',
    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'white', background: 'rgba(255,255,255,0.06)'
  },
  activeBtn: {
    background: '#00E5FF', color: '#000',
    boxShadow: '0 4px 15px rgba(0, 229, 255, 0.3)'
  },
  actionBtn: {
    background: '#fff', color: '#000'
  },
  lockBtnStyle: {
    background: '#FF3D00', color: '#fff',
    boxShadow: '0 4px 15px rgba(255, 61, 0, 0.3)'
  },

  // SLIDER
  sliderIcon: { fontSize: '18px', opacity: 0.8 },
  sliderContainer: { flex: 1, display: 'flex', alignItems: 'center', height: '100%', padding: '0 5px' },
  slider: { width: '100%', accentColor: '#00E5FF', height: '4px', cursor: 'pointer', outline: 'none' },

  // BOTÓN FLOTANTE DESBLOQUEO
  floatingUnlock: {
    position: 'absolute', top: '30px', right: '20px', zIndex: 100,
    width: '56px', height: '56px', borderRadius: '50%', border: 'none',
    background: 'rgba(255, 61, 0, 0.9)', color: 'white', fontSize: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(255, 61, 0, 0.4)',
    pointerEvents: 'auto',
    animation: 'pulse 2s infinite'
  },

  // LOADING SCREEN
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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imgHiddenRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. INICIALIZACIÓN
  useEffect(() => {
    // Inyectar animaciones CSS dinámicamente
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 61, 0, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 61, 0, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 61, 0, 0); } }
      .glitch { font-weight: 900; letter-spacing: 4px; text-shadow: 2px 0 #fff, -2px 0 #FF00C1; }
    `;
    document.head.appendChild(styleSheet);

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(err => console.error(err));

    const checkCv = setInterval(() => {
      if (window.cv && window.cv.imread) {
        setIsCvReady(true);
        clearInterval(checkCv);
      }
    }, 500);
    return () => clearInterval(checkCv);
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      setAiMessage("🧠 Analizando...");
      setImgUrl(URL.createObjectURL(e.target.files[0]));
      e.target.value = null;
    }
  };

  // 2. MOTOR DE PROCESAMIENTO V8 (CLEAN EDITION)
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

        // Resolución interna balanceada (Alta calidad pero rápida)
        const internalWidth = 1000;
        let scaleFactor = internalWidth / src.cols;
        let internalHeight = src.rows * scaleFactor;
        let dsizeInternal = new cv.Size(internalWidth, internalHeight);
        let resizedSrc = new cv.Mat();
        cv.resize(src, resizedSrc, dsizeInternal, 0, 0, cv.INTER_AREA);

        // --- AUTO-DETECCIÓN ---
        if (aiMessage === "🧠 Analizando...") {
          let grayCheck = new cv.Mat();
          cv.cvtColor(resizedSrc, grayCheck, cv.COLOR_RGBA2GRAY);
          let edgesCheck = new cv.Mat();
          cv.Canny(grayCheck, edgesCheck, 80, 150);
          let complexity = cv.countNonZero(edgesCheck) / (internalWidth * internalHeight);

          // Si es mayor a 0.08 es complejo (Paisaje), si no es simple (Anime)
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

        // --- FILTROS MEJORADOS (NO MÁS PUNTITOS NEGROS) ---
        if (mode === 'character') {
          // >> ALGORITMO "PIEL DE PORCELANA" <<
          let gray = new cv.Mat();
          cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);

          // 1. Desenfoque Bilateral AGRESIVO
          // Aumentamos sigmaColor (80->100) y sigmaSpace (80->100) para borrar imperfecciones
          let smooth = new cv.Mat();
          cv.bilateralFilter(gray, smooth, 12, 100, 100);

          // 2. Umbral Adaptativo LIMPIO
          // BlockSize: 15 (Mira áreas más grandes)
          // C (Constante): 7 (ANTES ERA 2). Esto es CLAVE. 
          // Al subir 'C', exigimos que el borde sea MUCHO más oscuro que el fondo.
          // Esto elimina sombras suaves y deja solo las líneas fuertes.
          cv.adaptiveThreshold(smooth, dst, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 17, 7);

          // 3. Limpieza Morfológica (Erode/Dilate)
          // Eliminamos cualquier puntito negro restante de 1 o 2 pixeles
          let kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
          // MORPH_CLOSE en imagen invertida (o MORPH_OPEN en normal)
          // Aquí queremos cerrar los huecos blancos en lo negro? No, queremos borrar puntos negros.
          // Como adaptiveThreshold devuelve fondo blanco (255) y lineas negras (0):
          // Usamos MORPH_CLOSE para "cerrar" el blanco sobre los puntos negros pequeños.
          cv.morphologyEx(dst, dst, cv.MORPH_CLOSE, kernel);

          gray.delete(); smooth.delete(); kernel.delete();
        }
        else if (mode === 'scenery') {
          // >> ALGORITMO PAISAJE DETALLADO <<
          let gray = new cv.Mat();
          cv.cvtColor(resizedSrc, gray, cv.COLOR_RGBA2GRAY);

          // Efecto tinta + tramas
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

        // --- RENDERIZADO FINAL ---
        cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);

        // Calculo de centrado perfecto
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

      {/* NOTIFICACIÓN SUPERIOR */}
      {aiMessage && (
        <div style={styles.aiToast}>
          <span>{aiMessage}</span>
        </div>
      )}

      {/* PANTALLA DE CARGA */}
      {(!isCvReady || isProcessing) && (
        <div style={styles.loadingOverlay}>
          <div className="glitch" style={{ fontSize: '32px', marginBottom: '15px', color: 'white' }}>ART LENS</div>
          <div style={{ color: '#666', fontSize: '12px', letterSpacing: '2px' }}>
            {isProcessing ? "RENDERIZANDO..." : "INICIANDO MOTOR..."}
          </div>
        </div>
      )}

      {/* HIDDEN INPUTS */}
      <img ref={imgHiddenRef} src={imgUrl} style={{ display: 'none' }} alt="source" />
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />

      {/* CAPA DE VIDEO Y DIBUJO */}
      <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
      <canvas
        id="drawing-canvas"
        ref={canvasRef}
        style={{ ...styles.canvas, opacity: opacity }}
      />

      {/* BOTÓN DESBLOQUEO FLOTANTE (Solo visible al bloquear) */}
      {isLocked && (
        <button onClick={() => setIsLocked(false)} style={styles.floatingUnlock}>
          🔓
        </button>
      )}

      {/* INTERFAZ PRINCIPAL (DOCK) */}
      {!isLocked && isCvReady && !isProcessing && (
        <div style={styles.uiLayer}>
          <div style={styles.dockContainer}>
            <div style={styles.dock}>

              {/* SLIDER OPACIDAD */}
              <div style={styles.row}>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', opacity: 0.8 }}>OPACIDAD</span>
                <div style={styles.sliderContainer}>
                  <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(e.target.value)} style={styles.slider} />
                </div>
              </div>

              {/* SELECTOR DE MODOS */}
              <div style={{ ...styles.row, background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '18px' }}>
                <button
                  onClick={() => setMode('character')}
                  style={mode === 'character' ? { ...styles.btn, ...styles.activeBtn } : styles.btn}>
                  🧑‍🦱 Personaje
                </button>
                <button
                  onClick={() => setMode('scenery')}
                  style={mode === 'scenery' ? { ...styles.btn, ...styles.activeBtn } : styles.btn}>
                  🏞️ Paisaje
                </button>
              </div>

              {/* ACCIONES */}
              <div style={styles.row}>
                <button onClick={() => fileInputRef.current.click()} style={{ ...styles.btn, ...styles.actionBtn }}>
                  📂 Abrir Foto
                </button>
                <button onClick={() => setIsLocked(true)} style={{ ...styles.btn, ...styles.lockBtnStyle }}>
                  🔒 Bloquear
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}