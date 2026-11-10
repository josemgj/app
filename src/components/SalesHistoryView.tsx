import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Receipt,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  SendHorizontal,
  ChevronDown,
  ChevronUp,
  XCircle,
  FileSpreadsheet,
  Package,
} from 'lucide-react';
import { Sale } from '../types/store';
import { ConfirmationModal } from './ConfirmationModal';

interface SalesHistoryViewProps {
  sales: Sale[];
  onCancelSale: (saleId: string) => Promise<void>;
  currencySymbol?: string;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  sales,
  onCancelSale,
  currencySymbol = '$',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('month');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Date filter
      const saleDate = new Date(sale.timestamp);
      let matchesDate = true;

      if (dateFilter === 'today') {
        matchesDate = sale.dateString === todayStr;
      } else if (dateFilter === 'yesterday') {
        matchesDate = sale.dateString === yesterdayStr;
      } else if (dateFilter === 'week') {
        matchesDate = saleDate >= sevenDaysAgo;
      } else if (dateFilter === 'month') {
        matchesDate = saleDate >= thirtyDaysAgo;
      }

      // Search filter (ticket folio or items inside)
      const matchesSearch =
        searchQuery === '' ||
        sale.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.items.some((item) =>
          item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesDate && matchesSearch;
    });
  }, [sales, dateFilter, searchQuery, todayStr, yesterdayStr, sevenDaysAgo, thirtyDaysAgo]);

  // Aggregate stats for filtered period
  const { totalSalesAmount, totalProfitAmount, totalTickets, totalUnitsSold, averageTicket } =
    useMemo(() => {
      let amount = 0;
      let profit = 0;
      let units = 0;

      filteredSales.forEach((s) => {
        amount += s.totalAmount;
        profit += s.totalProfit;
        s.items.forEach((i) => {
          units += i.quantity;
        });
      });

      const avg = filteredSales.length > 0 ? amount / filteredSales.length : 0;

      return {
        totalSalesAmount: Number(amount.toFixed(2)),
        totalProfitAmount: Number(profit.toFixed(2)),
        totalTickets: filteredSales.length,
        totalUnitsSold: units,
        averageTicket: Number(avg.toFixed(2)),
      };
    }, [filteredSales]);

  const toggleExpand = (saleId: string) => {
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Aggregated Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ventas del Periodo</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {currencySymbol}{totalSalesAmount.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {totalTickets} transacciones realizadas
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ganancia Neta Real</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">
            +{currencySymbol}{totalProfitAmount.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Margen neto: {totalSalesAmount > 0 ? ((totalProfitAmount / totalSalesAmount) * 100).toFixed(1) : '0'}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Promedio</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {currencySymbol}{averageTicket.toFixed(2)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Gasto promedio por cliente
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Artículos Despachados</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {totalUnitsSold}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Unidades vendidas
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Date pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'today', label: 'Hoy' },
            { id: 'yesterday', label: 'Ayer' },
            { id: 'week', label: 'Últimos 7 días' },
            { id: 'month', label: 'Últimos 30 días' },
            { id: 'all', label: 'Todo el Historial' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setDateFilter(pill.id as typeof dateFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                dateFilter === pill.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search by Folio or Product */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por folio o producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Sales Transactions List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {filteredSales.map((sale) => {
          const isExpanded = expandedSaleId === sale.id;

          return (
            <div key={sale.id} className="transition-colors hover:bg-slate-50/50">
              {/* Sale Summary Row */}
              <div
                onClick={() => toggleExpand(sale.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-xs font-bold shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {sale.ticketNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          sale.paymentMethod === 'efectivo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.paymentMethod === 'tarjeta'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {sale.paymentMethod === 'efectivo' ? (
                          <Banknote className="w-3 h-3" />
                        ) : sale.paymentMethod === 'tarjeta' ? (
                          <CreditCard className="w-3 h-3" />
                        ) : (
                          <SendHorizontal className="w-3 h-3" />
                        )}
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(sale.timestamp).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' • '}
                      {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-black text-slate-950 font-mono">
                      {currencySymbol}{sale.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 font-mono">
                      +{currencySymbol}{sale.totalProfit.toFixed(2)} ganancia
                    </div>
                  </div>

                  <div className="text-slate-400 hover:text-slate-600 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Ticket Details */}
              {isExpanded && (
                <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Desglose de Productos Vendidos:
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Producto</th>
                          <th className="py-2 px-3 text-center">Cant.</th>
                          <th className="py-2 px-3 text-right">Precio Unit.</th>
                          <th className="py-2 px-3 text-right">Costo Unit.</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                          <th className="py-2 px-3 text-right">Ganancia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sale.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-900">
                              {item.product.name}
                            </td>
                            <td className="py-2 px-3 text-center font-mono">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {currencySymbol}{item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-400">
                              {currencySymbol}{(item.costSubtotal / (item.quantity || 1)).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {currencySymbol}{item.subtotal.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              +{currencySymbol}{item.profitSubtotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500 italic">
                      {sale.notes ? `Nota: "${sale.notes}"` : 'Sincronizado automáticamente en Google Sheets (Hoja Ventas)'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSaleToCancel(sale)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancelar Venta y Devolver Stock</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredSales.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No hay ventas registradas en este periodo</p>
            <p className="text-xs text-slate-400 mt-1">Realiza cobros en el Punto de Venta para ver el historial automático.</p>
          </div>
        )}
      </div>

      {/* EXPLICIT CONFIRMATION FOR CANCELING A SALE (DESTRUCTIVE OPERATION) */}
      <ConfirmationModal
        isOpen={Boolean(saleToCancel)}
        title="¿Cancelar esta venta?"
        message={`¿Estás seguro de cancelar el ticket ${saleToCancel?.ticketNumber}? Se restablecerá el stock físico de los ${saleToCancel?.items.length} productos en el inventario y se actualizará Google Sheets.`}
        confirmLabel="Sí, cancelar y revertir stock"
        cancelLabel="Conservar venta"
        isDestructive={true}
        onConfirm={async () => {
          if (saleToCancel) {
            await onCancelSale(saleToCancel.id);
            setSaleToCancel(null);
          }
        }}
        onCancel={() => setSaleToCancel(null)}
      />
    </div>
  );
};
