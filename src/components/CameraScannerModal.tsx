import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap, ZapOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { sound } from '../utils/audio';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
  continuous?: boolean; // If true, stays open for multiple scans (e.g. POS cart)
  lastScannedFeedback?: string | null;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Escanear Código con la Cámara',
  subtitle = 'Apunta la cámara del celular al código de barras o QR del producto',
  continuous = false,
  lastScannedFeedback = null,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-camera-barcode-reader';

  const [isInitializing, setIsInitializing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const lastScanTimestamp = useRef<number>(0);

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  // Start scanner
  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    setIsInitializing(true);
    setErrorMessage(null);

    try {
      await stopScanner();

      // Enumerate available camera devices
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setErrorMessage('No se encontró ninguna cámara disponible en tu dispositivo.');
        setIsInitializing(false);
        return;
      }

      setCameras(devices);

      // Prefer back/environment camera on phones
      const backCamera = devices.find((d) =>
        /back|rear|environment|trasera|posterior/i.test(d.label)
      );
      const chosenId = cameraIdToUse || (backCamera ? backCamera.id : devices[0].id);
      setActiveCameraId(chosenId);

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.333333,
      };

      await html5QrCode.start(
        chosenId,
        config,
        (decodedText: string) => {
          const now = Date.now();
          // Debounce same code scan within 1.2s to prevent multiple triggers
          if (now - lastScanTimestamp.current < 1200 && lastScannedCode === decodedText) {
            return;
          }

          lastScanTimestamp.current = now;
          setLastScannedCode(decodedText);
          sound.playBeep();
          onScanSuccess(decodedText);

          if (!continuous) {
            stopScanner().then(() => onClose());
          }
        },
        () => {
          // Frame parsed without barcode detection; ignore silently
        }
      );

      // Check for flashlight/torch capability
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && (capabilities as unknown as { torch?: boolean }).torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }

      setIsInitializing(false);
    } catch (err: unknown) {
      console.error('Camera scanner init error:', err);
      const errorStr = String(err);
      if (errorStr.includes('NotAllowedError') || errorStr.includes('Permission')) {
        setErrorMessage(
          'Permiso de cámara denegado. Por favor permite el acceso a la cámara en los permisos de tu navegador.'
        );
      } else {
        setErrorMessage(
          'No se pudo inicializar la cámara. Verifica que otra aplicación no la esté utilizando.'
        );
      }
      setIsInitializing(false);
    }
  }, [continuous, lastScannedCode, onClose, onScanSuccess, stopScanner]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle not supported:', e);
    }
  };

  // Switch camera if user has multiple (front / back)
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    await startScanner(nextCamera.id);
  };

  useEffect(() => {
    if (isOpen) {
      // Delay slightly for DOM element to mount
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner().then(() => onClose());
            }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="relative bg-black flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[300px]">
          {/* html5-qrcode target div */}
          <div id={scannerContainerId} className="w-full h-full min-h-[280px]" />

          {/* Custom scanning laser effect overlay */}
          {!isInitializing && !errorMessage && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-[280px] h-[180px] border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm"></span>
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm"></span>
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm"></span>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm"></span>

                {/* Animated Red/Green Laser Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse absolute top-1/2 -translate-y-1/2"></div>
              </div>
              <span className="mt-3 text-[11px] font-medium text-emerald-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                Centra el código de barras en el recuadro
              </span>
            </div>
          )}

          {/* Loading spinner */}
          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Iniciando cámara del dispositivo...</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Asegúrate de permitir el acceso a la cámara si el navegador lo solicita.
              </p>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No se pudo acceder a la cámara</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startScanner()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors mt-2"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>

        {/* Live Feedback banner (Continuous mode in POS) */}
        {lastScannedFeedback && (
          <div className="px-4 py-2.5 bg-emerald-600/90 border-t border-emerald-500/30 flex items-center justify-between text-xs font-bold text-white animate-in slide-in-from-bottom-2">
            <span className="flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="truncate">{lastScannedFeedback}</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-black/20 px-2 py-0.5 rounded-md shrink-0 ml-2">
              Código: {lastScannedCode}
            </span>
          </div>
        )}

        {/* Footer controls: Camera switch, Torch, and Done */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Cambiar de cámara"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cambiar Cámara</span>
              </button>
            )}

            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl text-xs font-medium transition-colors ${
                  torchOn ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title="Linterna / Flash"
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              stopScanner().then(() => onClose());
            }}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {continuous ? 'Listo (Ver Carrito)' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
