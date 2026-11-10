import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { Sale, Product } from '../types/store';

interface ProfitChartsViewProps {
  sales: Sale[];
  products: Product[];
  currencySymbol?: string;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const MONTH_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const ProfitChartsView: React.FC<ProfitChartsViewProps> = ({
  sales,
  products,
  currencySymbol = '$',
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // Group sales by month of the selected year
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: MONTH_NAMES[i],
      shortName: MONTH_SHORT[i],
      revenue: 0,
      cost: 0,
      profit: 0,
      ticketCount: 0,
    }));

    sales.forEach((s) => {
      const d = new Date(s.timestamp);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        months[m].revenue += s.totalAmount;
        months[m].cost += s.totalCost;
        months[m].profit += s.totalProfit;
        months[m].ticketCount += 1;
      }
    });

    return months.map((m) => ({
      ...m,
      revenue: Number(m.revenue.toFixed(2)),
      cost: Number(m.cost.toFixed(2)),
      profit: Number(m.profit.toFixed(2)),
      margin: m.revenue > 0 ? Number(((m.profit / m.revenue) * 100).toFixed(1)) : 0,
    }));
  }, [sales, selectedYear]);

  // Overall Year KPIs
  const { totalYearRevenue, totalYearCost, totalYearProfit, averageMargin, totalTickets } =
    useMemo(() => {
      let rev = 0;
      let cost = 0;
      let prof = 0;
      let tickets = 0;

      monthlyData.forEach((m) => {
        rev += m.revenue;
        cost += m.cost;
        prof += m.profit;
        tickets += m.ticketCount;
      });

      const avgMargin = rev > 0 ? (prof / rev) * 100 : 0;

      return {
        totalYearRevenue: Number(rev.toFixed(2)),
        totalYearCost: Number(cost.toFixed(2)),
        totalYearProfit: Number(prof.toFixed(2)),
        averageMargin: Number(avgMargin.toFixed(1)),
        totalTickets: tickets,
      };
    }, [monthlyData]);

  // Max value in monthly data for scaling chart bars
  const maxMonthlyValue = useMemo(() => {
    let max = 100;
    monthlyData.forEach((m) => {
      if (m.revenue > max) max = m.revenue;
    });
    return max * 1.15; // 15% headroom
  }, [monthlyData]);

  // Profit by Category
  const categoryProfits = useMemo(() => {
    const map = new Map<string, { category: string; profit: number; revenue: number; itemsSold: number }>();

    sales.forEach((s) => {
      s.items.forEach((item) => {
        const cat = item.product.category || 'General';
        const existing = map.get(cat) || { category: cat, profit: 0, revenue: 0, itemsSold: 0 };
        existing.profit += item.profitSubtotal;
        existing.revenue += item.subtotal;
        existing.itemsSold += item.quantity;
        map.set(cat, existing);
      });
    });

    const list = Array.from(map.values()).map((c) => ({
      ...c,
      profit: Number(c.profit.toFixed(2)),
      revenue: Number(c.revenue.toFixed(2)),
      margin: c.revenue > 0 ? Number(((c.profit / c.revenue) * 100).toFixed(1)) : 0,
    }));

    return list.sort((a, b) => b.profit - a.profit);
  }, [sales]);

  const totalCatProfit = useMemo(() => {
    return categoryProfits.reduce((acc, c) => acc + c.profit, 0);
  }, [categoryProfits]);

  // Top 5 Most Profitable Products
  const topProducts = useMemo(() => {
    const map = new Map<string, { product: Product; totalProfit: number; totalSold: number; totalRevenue: number }>();

    sales.forEach((s) => {
      s.items.forEach((item) => {
        const pId = item.product.id;
        const existing = map.get(pId) || {
          product: item.product,
          totalProfit: 0,
          totalSold: 0,
          totalRevenue: 0,
        };
        existing.totalProfit += item.profitSubtotal;
        existing.totalRevenue += item.subtotal;
        existing.totalSold += item.quantity;
        map.set(pId, existing);
      });
    });

    return Array.from(map.values())
      .map((p) => ({
        ...p,
        totalProfit: Number(p.totalProfit.toFixed(2)),
        totalRevenue: Number(p.totalRevenue.toFixed(2)),
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 5);
  }, [sales]);

  // Profit and Sales by Day of the Week
  const dayOfWeekData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => ({
      dayIndex: i,
      dayName: DAY_NAMES[i],
      shortName: DAY_SHORT[i],
      profit: 0,
      revenue: 0,
      tickets: 0,
    }));

    sales.forEach((s) => {
      const d = new Date(s.timestamp);
      const dayIdx = d.getDay();
      days[dayIdx].profit += s.totalProfit;
      days[dayIdx].revenue += s.totalAmount;
      days[dayIdx].tickets += 1;
    });

    return days.map((d) => ({
      ...d,
      profit: Number(d.profit.toFixed(2)),
      revenue: Number(d.revenue.toFixed(2)),
    }));
  }, [sales]);

  const maxDayRevenue = useMemo(() => {
    let max = 100;
    dayOfWeekData.forEach((d) => {
      if (d.revenue > max) max = d.revenue;
    });
    return max * 1.15;
  }, [dayOfWeekData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Análisis y Gráficos de Ganancias del Negocio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Rentabilidad Real
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualiza los ingresos brutos, costos de mercancía y ganancias netas calculadas mes a mes.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Año de Ejercicio:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
          </select>
        </div>
      </div>

      {/* Annual KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ventas Totales ({selectedYear})
            </span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {currencySymbol}{totalYearRevenue.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {totalTickets} tickets cobrados en el año
          </span>
        </div>

        {/* COGS (Cost of goods) */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Costo de Mercancía
            </span>
            <ShieldCheck className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-700 font-mono">
            {currencySymbol}{totalYearCost.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Inversión en resurtido y proveedores
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-teal-50/20">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Ganancia Neta Real
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">
            +{currencySymbol}{totalYearProfit.toLocaleString()}
          </p>
          <span className="text-xs text-emerald-800 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            Margen de ganancia neto: {averageMargin}%
          </span>
        </div>

        {/* Average Ticket */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ticket Promedio
            </span>
            <ShoppingBag className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {currencySymbol}{totalTickets > 0 ? (totalYearRevenue / totalTickets).toFixed(2) : '0.00'}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Gasto medio por cliente en la tienda
          </span>
        </div>
      </div>

      {/* MAIN VISUAL CHART: Monthly Revenue vs Cost vs Net Profit */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Comparativa Mensual de Ganancias vs Ventas ({selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pasa el cursor sobre cada mes para ver el detalle de ingresos, costo y ganancia neta.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-md bg-blue-500"></span>
              Venta Total
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-md bg-slate-300"></span>
              Costo Mercancía
            </span>
            <span className="flex items-center gap-1.5 text-slate-900 font-bold">
              <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
              Ganancia Neta
            </span>
          </div>
        </div>

        {/* Custom Responsive SVG / HTML Bar Chart */}
        <div className="relative pt-6">
          {/* Hover Detail Card if month selected */}
          {hoveredMonthIdx !== null && monthlyData[hoveredMonthIdx] && (
            <div className="absolute top-0 right-4 bg-slate-900 text-white p-3 rounded-xl text-xs font-mono shadow-xl z-20 flex items-center gap-4 animate-in fade-in">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">Mes</span>
                <span className="font-bold text-white font-sans text-xs">{monthlyData[hoveredMonthIdx].monthName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Ventas</span>
                <span className="font-bold text-blue-400">{currencySymbol}{monthlyData[hoveredMonthIdx].revenue.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Costo</span>
                <span className="font-bold text-slate-300">{currencySymbol}{monthlyData[hoveredMonthIdx].cost.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Ganancia Neta</span>
                <span className="font-bold text-emerald-400">+{currencySymbol}{monthlyData[hoveredMonthIdx].profit.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Margen</span>
                <span className="font-bold text-emerald-300">+{monthlyData[hoveredMonthIdx].margin}%</span>
              </div>
            </div>
          )}

          {/* Bar Chart Container */}
          <div className="h-64 sm:h-72 flex items-end justify-between gap-1 sm:gap-3 pt-8 pb-4 border-b border-slate-200">
            {monthlyData.map((m, idx) => {
              const revHeight = maxMonthlyValue > 0 ? (m.revenue / maxMonthlyValue) * 100 : 0;
              const costHeight = maxMonthlyValue > 0 ? (m.cost / maxMonthlyValue) * 100 : 0;
              const profitHeight = maxMonthlyValue > 0 ? (m.profit / maxMonthlyValue) * 100 : 0;
              const isHovered = hoveredMonthIdx === idx;

              return (
                <div
                  key={m.monthIndex}
                  onMouseEnter={() => setHoveredMonthIdx(idx)}
                  onMouseLeave={() => setHoveredMonthIdx(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                >
                  {/* Bars Group */}
                  <div className="w-full flex items-end justify-center gap-1 max-w-[48px] h-full">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${Math.max(4, revHeight)}%` }}
                      className={`w-1/3 rounded-t-md transition-all ${
                        isHovered ? 'bg-blue-600 shadow-md' : 'bg-blue-400/90 group-hover:bg-blue-500'
                      }`}
                      title={`Venta: ${currencySymbol}${m.revenue}`}
                    />

                    {/* Cost Bar */}
                    <div
                      style={{ height: `${Math.max(4, costHeight)}%` }}
                      className={`w-1/3 rounded-t-md transition-all ${
                        isHovered ? 'bg-slate-400 shadow-md' : 'bg-slate-300 group-hover:bg-slate-400'
                      }`}
                      title={`Costo: ${currencySymbol}${m.cost}`}
                    />

                    {/* Profit Bar */}
                    <div
                      style={{ height: `${Math.max(4, profitHeight)}%` }}
                      className={`w-1/3 rounded-t-md transition-all ${
                        isHovered
                          ? 'bg-emerald-600 ring-2 ring-emerald-400 shadow-lg'
                          : 'bg-emerald-500 group-hover:bg-emerald-600'
                      }`}
                      title={`Ganancia Neta: +${currencySymbol}${m.profit}`}
                    />
                  </div>

                  {/* Month Label */}
                  <div className="mt-2 text-center">
                    <span
                      className={`text-[11px] block font-semibold transition-colors ${
                        isHovered ? 'text-emerald-700 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {m.shortName}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold hidden sm:block">
                      {m.profit > 0 ? `+${currencySymbol}${Math.round(m.profit)}` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column Section: Category Profit Breakdown & Top Profitable Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Profit by Category */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Aporte de Ganancia por Categoría</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total: {currencySymbol}{totalCatProfit.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {categoryProfits.map((cat, idx) => {
              const percent = totalCatProfit > 0 ? ((cat.profit / totalCatProfit) * 100).toFixed(1) : 0;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700">
                        +{currencySymbol}{cat.profit.toLocaleString()}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({percent}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{cat.itemsSold} piezas vendidas</span>
                    <span>Margen categoría: +{cat.margin}%</span>
                  </div>
                </div>
              );
            })}

            {categoryProfits.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                No hay ventas suficientes para calcular categorías.
              </p>
            )}
          </div>
        </div>

        {/* Right: Top 5 Most Profitable Products */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top 5 Productos Más Rentables</span>
            </h3>
            <span className="text-xs text-slate-400">Mayor ganancia en pesos</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.map((item, idx) => (
              <div key={item.product.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : idx === 1
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{item.product.name}</h5>
                    <span className="text-[11px] text-slate-400">
                      {item.totalSold} vendidos • Venta: {currencySymbol}{item.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black font-mono text-emerald-700 block">
                    +{currencySymbol}{item.totalProfit.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Ganancia generada
                  </span>
                </div>
              </div>
            ))}

            {topProducts.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                Registra cobros para descubrir tus productos más rentables.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Day of Week Peak Performance & Smart Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Day of week chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Patrón Semanal: Ventas y Ganancias por Día de la Semana
            </h3>
            <span className="text-xs text-slate-400">Identifica los mejores días</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-4 pb-2 border-b border-slate-200">
            {dayOfWeekData.map((d) => {
              const heightPercent = maxDayRevenue > 0 ? (d.revenue / maxDayRevenue) * 100 : 0;
              const isPeak = d.profit > 0 && d.profit === Math.max(...dayOfWeekData.map((x) => x.profit));

              return (
                <div key={d.dayIndex} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div
                    style={{ height: `${Math.max(6, heightPercent)}%` }}
                    className={`w-full max-w-[32px] rounded-t-lg transition-all ${
                      isPeak
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-500 shadow-md'
                        : 'bg-emerald-400/80 group-hover:bg-emerald-500'
                    }`}
                    title={`${d.dayName}: Venta ${currencySymbol}${d.revenue} | Ganancia +${currencySymbol}${d.profit}`}
                  />
                  <div className="mt-2 text-center">
                    <span className={`text-xs block font-bold ${isPeak ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {d.shortName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      +{currencySymbol}{Math.round(d.profit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Business Insights */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold tracking-tight text-white">
                Diagnóstico de Rentabilidad de tu Tienda
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Basado en el historial de ventas sincronizado con Google Sheets:
            </p>

            <ul className="mt-4 space-y-3 text-xs text-slate-200">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>
                  Tu margen neto general es de <strong>+{averageMargin}%</strong>, lo cual se considera muy saludable para el sector de abarrotes y autoservicio.
                </span>
              </li>
              {topProducts[0] && (
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span>
                    El artículo que más dinero aporta es <strong>{topProducts[0].product.name}</strong> con <strong>+{currencySymbol}{topProducts[0].totalProfit.toFixed(2)}</strong> de ganancia acumulada.
                  </span>
                </li>
              )}
              {categoryProfits[0] && (
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span>
                    La categoría líder en utilidades es <strong>{categoryProfits[0].category}</strong>. Mantén siempre abastecido este pasillo.
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sincronización continua en Google Sheets</span>
            <span className="text-emerald-400 font-bold">100% al día</span>
          </div>
        </div>
      </div>
    </div>
  );
};
