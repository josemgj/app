import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { Product, Sale, DailyReport } from './types/store';
import { INITIAL_PRODUCTS, generateInitialSalesHistory } from './utils/sampleData';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessTokenInMemory,
} from './services/firebaseAuth';
import {
  findOrCreateStoreSpreadsheet,
  loadInventoryFromSheet,
  saveInventoryToSheet,
  recordSaleInGoogleSheet,
  loadSalesFromSheet,
  appendDailyReportToSheet,
  loadDailyReportsFromSheet,
} from './services/googleSheetsService';

import { Navbar, ActiveTab } from './components/Navbar';
import { POSView } from './components/POSView';
import { InventoryView } from './components/InventoryView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { StockReportsView } from './components/StockReportsView';
import { ProfitChartsView } from './components/ProfitChartsView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ShareMobileModal } from './components/ShareMobileModal';
import { CheckCircle2, AlertCircle, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Core Data States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('abarrotessync_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('abarrotessync_sales');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const initial = generateInitialSalesHistory(INITIAL_PRODUCTS);
    return initial.sales;
  });

  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem('abarrotessync_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const initial = generateInitialSalesHistory(INITIAL_PRODUCTS);
    return initial.dailyReports;
  });

  // Auth & Google Sheets State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('abarrotessync_sheet_id') || null;
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('abarrotessync_sheet_url') || null;
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Shared App URL for mobile access
  const shareAppUrl =
    typeof window !== 'undefined' && window.location.origin.includes('localhost')
      ? 'https://ais-pre-2nkfsay3gcsfihchpgidgg-508957978333.us-west2.run.app'
      : (typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-2nkfsay3gcsfihchpgidgg-508957978333.us-west2.run.app');

  // Notifications Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Persist local copy for offline resilience
  useEffect(() => {
    localStorage.setItem('abarrotessync_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('abarrotessync_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('abarrotessync_reports', JSON.stringify(dailyReports));
  }, [dailyReports]);

  // Synchronize with Google Sheets
  const syncWithGoogleSheets = useCallback(
    async (token: string, currentProdList: Product[]) => {
      try {
        setIsSyncing(true);

        // 1. Locate or create spreadsheet
        const sheetInfo = await findOrCreateStoreSpreadsheet(token, currentProdList);
        setSpreadsheetId(sheetInfo.id);
        setSpreadsheetUrl(sheetInfo.url);
        localStorage.setItem('abarrotessync_sheet_id', sheetInfo.id);
        localStorage.setItem('abarrotessync_sheet_url', sheetInfo.url);

        // 2. If it was already existing in user's Drive, load sheets data
        if (!sheetInfo.isNew) {
          try {
            const sheetProducts = await loadInventoryFromSheet(token, sheetInfo.id);
            if (sheetProducts && sheetProducts.length > 0) {
              setProducts(sheetProducts);
            }

            const sheetSales = await loadSalesFromSheet(token, sheetInfo.id, sheetProducts.length > 0 ? sheetProducts : currentProdList);
            if (sheetSales && sheetSales.length > 0) {
              setSales(sheetSales);
            }

            const sheetReports = await loadDailyReportsFromSheet(token, sheetInfo.id);
            if (sheetReports && sheetReports.length > 0) {
              setDailyReports(sheetReports);
            }
          } catch (e) {
            console.warn('Could not read existing sheet rows, using current data', e);
          }
        } else {
          // Newly created: upload current catalog
          await saveInventoryToSheet(token, sheetInfo.id, currentProdList);
        }

        const now = new Date().toISOString();
        setLastSyncTime(now);
        showToast(
          sheetInfo.isNew
            ? '¡Hoja "AbarrotesSync - Control de Tienda" creada en tu Google Drive!'
            : '¡Datos sincronizados con Google Sheets!',
          'success'
        );
      } catch (err: unknown) {
        console.error('Error syncing with Google Sheets:', err);
        showToast('No se pudo conectar con Google Sheets. Verifica tus permisos.', 'error');
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // Initialize Auth on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setAccessTokenInMemory(token);
        syncWithGoogleSheets(token, products);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setAccessTokenInMemory(null);
      }
    );

    return () => unsubscribe();
  }, [syncWithGoogleSheets, products]);

  // Login handler
  const handleLogin = async () => {
    try {
      setIsSyncing(true);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setAccessTokenInMemory(result.accessToken);
        await syncWithGoogleSheets(result.accessToken, products);
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Error al iniciar sesión con Google.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setAccessTokenInMemory(null);
    showToast('Sesión de Google cerrada.', 'info');
  };

  // Complete a sale from POS
  const handleCompleteSale = async (newSale: Sale, updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    setSales((prev) => [newSale, ...prev]);

    // If Google token available, auto-sync
    const token = accessToken || (await getAccessToken());
    if (token && spreadsheetId) {
      try {
        setIsSyncing(true);
        await recordSaleInGoogleSheet(token, spreadsheetId, newSale, updatedProducts);
        setLastSyncTime(new Date().toISOString());
        showToast(`Venta ${newSale.ticketNumber} guardada automáticamente en Google Sheets`, 'success');
      } catch (err) {
        console.error('Error recording sale in Google Sheets:', err);
        showToast('Venta guardada localmente (error al sincronizar con Sheets)', 'error');
      } finally {
        setIsSyncing(false);
      }
    } else {
      showToast(`Venta ${newSale.ticketNumber} registrada localmente.`, 'info');
    }
  };

  // Add Product to Inventory
  const handleAddProduct = async (newProduct: Product) => {
    const updated = [newProduct, ...products];
    setProducts(updated);

    const token = accessToken || (await getAccessToken());
    if (token && spreadsheetId) {
      try {
        setIsSyncing(true);
        await saveInventoryToSheet(token, spreadsheetId, updated);
        setLastSyncTime(new Date().toISOString());
        showToast(`"${newProduct.name}" guardado en Google Sheets`, 'success');
      } catch (e) {
        console.error(e);
      } finally {
        setIsSyncing(false);
      }
    } else {
      showToast(`"${newProduct.name}" agregado al inventario`, 'success');
    }
  };

  // Update Product in Inventory
  const handleUpdateProduct = async (updatedProduct: Product) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updated);

    const token = accessToken || (await getAccessToken());
    if (token && spreadsheetId) {
      try {
        setIsSyncing(true);
        await saveInventoryToSheet(token, spreadsheetId, updated);
        setLastSyncTime(new Date().toISOString());
        showToast(`Stock de "${updatedProduct.name}" actualizado en Sheets`, 'success');
      } catch (e) {
        console.error(e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);

    const token = accessToken || (await getAccessToken());
    if (token && spreadsheetId) {
      try {
        setIsSyncing(true);
        await saveInventoryToSheet(token, spreadsheetId, updated);
        setLastSyncTime(new Date().toISOString());
        showToast(`Producto eliminado de Google Sheets`, 'info');
      } catch (e) {
        console.error(e);
      } finally {
        setIsSyncing(false);
      }
    } else {
      showToast(`Producto eliminado`, 'info');
    }
  };

  // Cancel / Refund a Sale
  const handleCancelSale = async (saleId: string) => {
    const saleToCancel = sales.find((s) => s.id === saleId);
    if (!saleToCancel) return;

    // Rollback stock
    const updatedProducts = products.map((prod) => {
      const soldItem = saleToCancel.items.find((i) => i.product.id === prod.id);
      if (soldItem) {
        return {
          ...prod,
          stock: prod.stock + soldItem.quantity,
          updatedAt: new Date().toISOString(),
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    setSales((prev) => prev.filter((s) => s.id !== saleId));

    const token = accessToken || (await getAccessToken());
    if (token && spreadsheetId) {
      try {
        setIsSyncing(true);
        await saveInventoryToSheet(token, spreadsheetId, updatedProducts);
        showToast(`Venta cancelada y stock devuelto en Google Sheets`, 'info');
      } catch (e) {
        console.error(e);
      } finally {
        setIsSyncing(false);
      }
    } else {
      showToast(`Venta cancelada y stock restituido`, 'info');
    }
  };

  // Save Daily Closure
  const handleSaveDailyClosure = async (report: DailyReport) => {
    setDailyReports((prev) => [report, ...prev]);

    const token = accessToken || (await getAccessToken());
    if (token && spreadsheetId) {
      try {
        setIsSyncing(true);
        await appendDailyReportToSheet(token, spreadsheetId, report);
        setLastSyncTime(new Date().toISOString());
        showToast('Cierre de jornada guardado en Google Sheets (Cierres_Diarios)', 'success');
      } catch (e) {
        console.error(e);
        showToast('Error al guardar el cierre en Google Sheets', 'error');
      } finally {
        setIsSyncing(false);
      }
    } else {
      showToast('Cierre diario guardado localmente', 'info');
    }
  };

  // Manual Full Sync
  const handleManualSync = async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      handleLogin();
      return;
    }
    await syncWithGoogleSheets(token, products);
  };

  // Custom sheet ID update
  const handleUpdateSpreadsheetId = async (newId: string) => {
    setSpreadsheetId(newId);
    const newUrl = `https://docs.google.com/spreadsheets/d/${newId}/edit`;
    setSpreadsheetUrl(newUrl);
    localStorage.setItem('abarrotessync_sheet_id', newId);
    localStorage.setItem('abarrotessync_sheet_url', newUrl);

    const token = accessToken || (await getAccessToken());
    if (token) {
      try {
        setIsSyncing(true);
        const sheetProds = await loadInventoryFromSheet(token, newId);
        if (sheetProds.length > 0) {
          setProducts(sheetProds);
        }
        showToast('Hoja personalizada vinculada correctamente', 'success');
      } catch (e) {
        console.error(e);
        showToast('No se pudieron leer los datos del nuevo ID', 'error');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Calculate low stock alert count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert).length;
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
        user={user}
        spreadsheetUrl={spreadsheetUrl}
        isSyncing={isSyncing}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onQuickSync={handleManualSync}
        onOpenShareMobileModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Views */}
      <main className="flex-1">
        {activeTab === 'pos' && (
          <POSView
            products={products}
            onCompleteSale={handleCompleteSale}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onSyncWithSheets={handleManualSync}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'sales' && (
          <SalesHistoryView
            sales={sales}
            onCancelSale={handleCancelSale}
          />
        )}

        {activeTab === 'reports' && (
          <StockReportsView
            products={products}
            sales={sales}
            dailyReports={dailyReports}
            onSaveDailyClosure={handleSaveDailyClosure}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'charts' && (
          <ProfitChartsView
            sales={sales}
            products={products}
          />
        )}
      </main>

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        onUpdateSpreadsheetId={handleUpdateSpreadsheetId}
      />

      {/* Mobile Share & QR Code Modal */}
      <ShareMobileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareAppUrl}
      />
    </div>
  );
}
