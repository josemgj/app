import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  X,
  Share2,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

interface ShareMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export const ShareMobileModal: React.FC<ShareMobileModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && shareUrl) {
      QRCode.toDataURL(
        shareUrl,
        {
          width: 320,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrDataUrl(url);
          }
        }
      );
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const whatsappMessage = encodeURIComponent(
    `¡Hola! Aquí está el enlace de AbarrotesSync para cobrar y controlar inventario desde el celular con la cámara:\n${shareUrl}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Usar en el Celular</h3>
              <p className="text-xs text-emerald-100">Accede y escanea códigos desde tu móvil</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 mb-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR para abrir en celular"
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center bg-slate-100 rounded-xl">
                  <QrCode className="w-12 h-12 text-slate-300 animate-pulse" />
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-slate-800">
              Escanea este código QR con la cámara de tu celular
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
              Se abrirá automáticamente el punto de venta en tu navegador móvil con el escáner de cámara listo.
            </p>
          </div>

          {/* Share Link Actions */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              O comparte el enlace directo:
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-mono truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* WhatsApp Share Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar enlace por WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
            </a>
          </div>

          {/* How to install on mobile instructions (Android & iPhone) */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Instalar como App en la pantalla de inicio:</span>
            </div>

            <div className="text-[11px] text-slate-700 space-y-2">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <strong className="text-slate-900 font-semibold block mb-0.5">En Android (Chrome):</strong>
                Abre el enlace en Chrome, presiona los <strong>tres puntos ⋮</strong> arriba a la derecha y selecciona <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a la pantalla principal&quot;</strong>.
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <strong className="text-slate-900 font-semibold block mb-0.5">En iPhone (Safari):</strong>
                Abre el enlace en Safari, presiona el botón <strong>Compartir (icono con flecha hacia arriba)</strong> y selecciona <strong>&quot;Agregar al inicio&quot;</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
