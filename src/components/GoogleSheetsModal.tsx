import React, { useState } from 'react';
import { ExternalLink, Sheet, RefreshCw, CheckCircle2, Copy, Check, X, ShieldAlert } from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncTime: string | null;
  isSyncing: boolean;
  onManualSync: () => Promise<void>;
  onUpdateSpreadsheetId: (newId: string) => Promise<void>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
  spreadsheetUrl,
  lastSyncTime,
  isSyncing,
  onManualSync,
  onUpdateSpreadsheetId,
}) => {
  const [copied, setCopied] = useState(false);
  const [customId, setCustomId] = useState('');
  const [isChangingId, setIsChangingId] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (spreadsheetUrl) {
      navigator.clipboard.writeText(spreadsheetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveCustomId = async () => {
    if (customId.trim()) {
      await onUpdateSpreadsheetId(customId.trim());
      setIsChangingId(false);
      setCustomId('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
              <Sheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Conexión con Google Sheets</h3>
              <p className="text-xs text-emerald-100">Base de datos sincronizada en la nube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Box */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-emerald-950">Hoja de Cálculo Activa</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Los datos de tu inventario, ventas en el mostrador y cierres diarios se guardan automáticamente en tu cuenta de Google Drive.
              </p>
              {lastSyncTime && (
                <p className="text-xs text-emerald-700 font-medium mt-2">
                  Última sincronización: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          {/* Links & ID */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Enlace a tu Hoja de Google Sheets
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={spreadsheetUrl || 'No generada aún'}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-mono truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copiar enlace"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-xs hover:shadow-md"
              >
                <span>Abrir Hoja en Google Sheets</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Tabs Description */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
              Pestañas configuradas en tu Hoja:
            </h5>
            <ul className="text-xs space-y-1.5 text-slate-700">
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <strong className="font-semibold text-slate-900">Inventario:</strong> Catálogo, costos, precios y control de stock en tiempo real.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <strong className="font-semibold text-slate-900">Ventas:</strong> Registro automático de cada producto y ticket cobrado con ganancia neta.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <strong className="font-semibold text-slate-900">Cierres_Diarios:</strong> Resumen diario de ventas, ganancias e inventario crítico.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <strong className="font-semibold text-slate-900">Configuracion:</strong> Parámetros de la tienda y moneda.
              </li>
            </ul>
          </div>

          {/* Advanced: Switch ID */}
          <div className="pt-2 border-t border-slate-100">
            {!isChangingId ? (
              <button
                type="button"
                onClick={() => setIsChangingId(true)}
                className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
              >
                ¿Quieres vincular otra Hoja de Google Sheets existente?
              </button>
            ) : (
              <div className="space-y-2 mt-2">
                <label className="text-xs font-semibold text-slate-700">
                  Introduce el ID de tu Google Spreadsheet:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    onClick={handleSaveCustomId}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Vincular
                  </button>
                  <button
                    onClick={() => setIsChangingId(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Forzar Sincronización'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
