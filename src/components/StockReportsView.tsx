import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  AlertOctagon,
  Calendar,
  CheckCircle2,
  Printer,
  TrendingUp,
  Boxes,
  DollarSign,
  PackageCheck,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, Sale, DailyReport } from '../types/store';

interface StockReportsViewProps {
  products: Product[];
  sales: Sale[];
  dailyReports: DailyReport[];
  onSaveDailyClosure: (report: DailyReport) => Promise<void>;
  isSyncing: boolean;
  currencySymbol?: string;
}

export const StockReportsView: React.FC<StockReportsViewProps> = ({
  products,
  sales,
  dailyReports,
  onSaveDailyClosure,
  isSyncing,
  currencySymbol = '$',
}) => {
  const [closureNotes, setClosureNotes] = useState('');
  const [isSavingClosure, setIsSavingClosure] = useState(false);
  const [closureSuccessMessage, setClosureSuccessMessage] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Today's sales calculations
  const todaySales = useMemo(() => {
    return sales.filter((s) => s.dateString === todayStr);
  }, [sales, todayStr]);

  const { todayTotalSales, todayTotalProfit, todayTotalTickets, todayUnitsSold } = useMemo(() => {
    let salesAmt = 0;
    let profitAmt = 0;
    let units = 0;

    todaySales.forEach((s) => {
      salesAmt += s.totalAmount;
      profitAmt += s.totalProfit;
      s.items.forEach((i) => {
        units += i.quantity;
      });
    });

    return {
      todayTotalSales: Number(salesAmt.toFixed(2)),
      todayTotalProfit: Number(profitAmt.toFixed(2)),
      todayTotalTickets: todaySales.length,
      todayUnitsSold: units,
    };
  }, [todaySales]);

  // Inventory valuation & critical stock
  const { criticalProducts, valuationCost, valuationSale, healthyCount, lowCount, outOfStockCount } =
    useMemo(() => {
      let cost = 0;
      let sale = 0;
      let healthy = 0;
      let low = 0;
      let out = 0;
      const critical: (Product & { deficit: number; restockCost: number })[] = [];

      products.forEach((p) => {
        cost += p.costPrice * p.stock;
        sale += p.salePrice * p.stock;

        if (p.stock <= 0) {
          out++;
          critical.push({
            ...p,
            deficit: Math.max(1, p.minStockAlert * 2),
            restockCost: Math.max(1, p.minStockAlert * 2) * p.costPrice,
          });
        } else if (p.stock <= p.minStockAlert) {
          low++;
          critical.push({
            ...p,
            deficit: (p.minStockAlert * 2) - p.stock,
            restockCost: ((p.minStockAlert * 2) - p.stock) * p.costPrice,
          });
        } else {
          healthy++;
        }
      });

      return {
        criticalProducts: critical,
        valuationCost: Number(cost.toFixed(2)),
        valuationSale: Number(sale.toFixed(2)),
        healthyCount: healthy,
        lowCount: low,
        outOfStockCount: out,
      };
    }, [products]);

  // Total required investment to restock low items
  const totalRestockInvestment = useMemo(() => {
    return criticalProducts.reduce((acc, curr) => acc + curr.restockCost, 0);
  }, [criticalProducts]);

  // Trigger daily closure
  const handlePerformClosure = async () => {
    setIsSavingClosure(true);
    setClosureSuccessMessage(null);

    try {
      const report: DailyReport = {
        date: todayStr,
        timestamp: new Date().toISOString(),
        totalSalesAmount: todayTotalSales,
        totalProfitAmount: todayTotalProfit,
        totalTransactions: todayTotalTickets,
        itemsSold: todayUnitsSold,
        lowStockCount: criticalProducts.length,
        stockValuationCost: valuationCost,
        stockValuationSale: valuationSale,
        notes: closureNotes.trim() || `Cierre regular de jornada ${todayStr}`,
      };

      await onSaveDailyClosure(report);
      setClosureSuccessMessage(`¡Cierre del ${todayStr} guardado con éxito en Google Sheets!`);
      setClosureNotes('');
      setTimeout(() => setClosureSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error saving daily report:', err);
    } finally {
      setIsSavingClosure(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Reporte Diario de Stock
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Cierre de Operaciones & Salud de Inventario
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Supervisa las existencias físicas del día, productos por reordenar y consolida el corte en Google Sheets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-start md:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Reporte del Día</span>
        </button>
      </div>

      {/* KPI Cards for Today */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Ventas de Hoy
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {currencySymbol}{todayTotalSales.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {todayTotalTickets} tickets cobrados hoy
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Ganancia Neta Hoy
          </span>
          <p className="text-2xl font-black text-emerald-700 font-mono">
            +{currencySymbol}{todayTotalProfit.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Margen de hoy: {todayTotalSales > 0 ? ((todayTotalProfit / todayTotalSales) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Artículos Despachados
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {todayUnitsSold}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Salidas de inventario hoy
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Productos en Alerta
          </span>
          <p className={`text-2xl font-black ${criticalProducts.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {criticalProducts.length}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {outOfStockCount} agotados • {lowCount} por agotarse
          </span>
        </div>
      </div>

      {/* Inventory Health Progress Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider">
            Estado Global de Abastecimiento ({products.length} productos)
          </span>
          <span className="text-slate-500">
            {healthyCount} en nivel óptimo ({products.length > 0 ? Math.round((healthyCount / products.length) * 100) : 0}%)
          </span>
        </div>

        {/* Multi-segmented bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${products.length > 0 ? (healthyCount / products.length) * 100 : 0}%` }}
            className="bg-emerald-500 h-full"
            title={`${healthyCount} productos con stock saludable`}
          />
          <div
            style={{ width: `${products.length > 0 ? (lowCount / products.length) * 100 : 0}%` }}
            className="bg-amber-400 h-full"
            title={`${lowCount} productos con bajo stock`}
          />
          <div
            style={{ width: `${products.length > 0 ? (outOfStockCount / products.length) * 100 : 0}%` }}
            className="bg-rose-500 h-full"
            title={`${outOfStockCount} productos agotados`}
          />
        </div>

        <div className="flex items-center gap-4 text-xs pt-1">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            {healthyCount} Óptimos
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            {lowCount} Bajos
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            {outOfStockCount} Agotados
          </span>
        </div>
      </div>

      {/* Critical Stock Table: Suggested Re-Order */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <span>Lista de Resurtido Urgente (Stock Crítico)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Productos que necesitan pedido con proveedores para no perder ventas.
            </p>
          </div>

          {criticalProducts.length > 0 && (
            <div className="text-xs bg-rose-50 border border-rose-200/80 text-rose-800 px-3 py-1.5 rounded-xl font-medium">
              Inversión estimada para resurtir: <strong>{currencySymbol}{totalRestockInvestment.toFixed(2)}</strong>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-center">Stock Mínimo</th>
                <th className="py-3 px-4 text-center">Sugerencia Resurtido</th>
                <th className="py-3 px-4 text-right">Costo Estimado</th>
                <th className="py-3 px-4 text-center">Prioridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalProducts.map((p) => {
                const isZero = p.stock <= 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.category}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={isZero ? 'text-rose-600' : 'text-amber-600'}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {p.minStockAlert} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                      +{p.deficit} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {currencySymbol}{p.restockCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isZero
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isZero ? 'Agotado (Urgente)' : 'Bajo Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {criticalProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                    <p className="font-semibold text-slate-700">¡Todo el inventario está en niveles óptimos!</p>
                    <p className="text-xs text-slate-400">No hay productos en alerta baja ni agotados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Perform Daily Closure Section */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Registrar Cierre Diario en Google Sheets
            </h3>
            <p className="text-xs text-slate-500">
              Consolida el balance de ventas del día ({currencySymbol}{todayTotalSales.toFixed(2)}), ganancia neta (+{currencySymbol}{todayTotalProfit.toFixed(2)}) e inventario en la pestaña &quot;Cierres_Diarios&quot;.
            </p>
          </div>
        </div>

        {closureSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{closureSuccessMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Anotaciones para el cierre del día (opcional: ej. turno matutino, pago a proveedor de pan...)"
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
          />

          <button
            type="button"
            disabled={isSavingClosure || isSyncing}
            onClick={handlePerformClosure}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {isSavingClosure ? 'Guardando en Sheets...' : 'Guardar Cierre de Hoy'}
            </span>
          </button>
        </div>
      </div>

      {/* Historical Closures Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Historial de Cierres Diarios Anteriores
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro cronológico guardado en tu Google Sheet (Cierres_Diarios).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-right">Venta Total</th>
                <th className="py-3 px-4 text-right">Ganancia Neta</th>
                <th className="py-3 px-4 text-center">Tickets</th>
                <th className="py-3 px-4 text-center">Artículos</th>
                <th className="py-3 px-4 text-center">Productos Bajo Stock</th>
                <th className="py-3 px-4">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {dailyReports.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {r.date}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-950">
                    {currencySymbol}{r.totalSalesAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    +{currencySymbol}{r.totalProfitAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {r.totalTransactions}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {r.itemsSold}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-amber-600 font-bold">
                    {r.lowStockCount}
                  </td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                    {r.notes || '—'}
                  </td>
                </tr>
              ))}

              {dailyReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-700">No hay cierres diarios guardados todavía</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Haz clic en &quot;Guardar Cierre de Hoy&quot; al finalizar el día para registrarlo en Google Sheets.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
