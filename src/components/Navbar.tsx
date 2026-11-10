import React from 'react';
import {
  Store,
  ShoppingCart,
  Boxes,
  Receipt,
  ClipboardList,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
  AlertCircle,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import type { User } from 'firebase/auth';

export type ActiveTab = 'pos' | 'inventory' | 'sales' | 'reports' | 'charts';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
  user: User | null;
  spreadsheetUrl: string | null;
  isSyncing: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSheetsModal: () => void;
  onQuickSync: () => void;
  onOpenShareMobileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  user,
  spreadsheetUrl,
  isSyncing,
  onLogin,
  onLogout,
  onOpenSheetsModal,
  onQuickSync,
  onOpenShareMobileModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Top Banner & Brand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Store Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Abarrotes<span className="text-emerald-600">Sync</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  POS & Inventario
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Control de inventario, cobro y ganancias en Google Sheets
              </p>
            </div>
          </div>

          {/* Right Action Controls: Google Sheets, Mobile Share & Auth */}
          <div className="flex items-center gap-2">
            {/* Mobile / Share QR Trigger */}
            <button
              type="button"
              onClick={onOpenShareMobileModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Abrir y usar en el celular (código QR)"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Usar en Celular</span>
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                {/* Sheets Status Badge */}
                <button
                  type="button"
                  onClick={onOpenSheetsModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
                  title="Configurar y ver Google Sheets"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden md:inline">Google Sheets Activo</span>
                </button>

                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors hidden sm:flex items-center gap-1 text-xs font-medium"
                    title="Abrir en Google Sheets"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Abrir Hoja</span>
                  </a>
                )}

                {/* Quick Sync */}
                <button
                  type="button"
                  onClick={onQuickSync}
                  disabled={isSyncing}
                  className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                  title="Sincronizar con Google Sheets ahora"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                </button>

                {/* User Info & Logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuario'}
                      className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate hidden xl:inline">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={onLogout}
                    title="Cerrar sesión"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Official Google Sign In button design */
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-xl shadow-2xs hover:shadow-xs transition-all text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Conectar con Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1 scrollbar-none border-t border-slate-100">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Punto de Cobro (POS)</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Control de Inventario</span>
            {lowStockCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'inventory'
                    ? 'bg-rose-500 text-white'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Registro de Ventas</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Reportes Diarios de Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Gráficos de Ganancias</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
