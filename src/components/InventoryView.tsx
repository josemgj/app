import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  Package,
  Boxes,
  DollarSign,
  TrendingUp,
  RefreshCw,
  X,
  Check,
  ArrowUpDown,
  Barcode,
  Camera,
} from 'lucide-react';
import { Product } from '../types/store';
import { ConfirmationModal } from './ConfirmationModal';
import { CameraScannerModal } from './CameraScannerModal';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (product: Product) => Promise<void>;
  onUpdateProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSyncWithSheets: () => Promise<void>;
  isSyncing: boolean;
  currencySymbol?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSyncWithSheets,
  isSyncing,
  currencySymbol = '$',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('Despensa');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formUnit, setFormUnit] = useState('pza');
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Camera scanner state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'form' | 'search'>('form');

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['Todos', ...cats];
  }, [products]);

  // Overall Inventory KPIs
  const { totalStockUnits, lowStockCount, valuationCost, valuationSale, projectedProfit } =
    useMemo(() => {
      let units = 0;
      let low = 0;
      let cost = 0;
      let sale = 0;

      products.forEach((p) => {
        units += p.stock;
        if (p.stock <= p.minStockAlert) low++;
        cost += p.costPrice * p.stock;
        sale += p.salePrice * p.stock;
      });

      return {
        totalStockUnits: units,
        lowStockCount: low,
        valuationCost: Number(cost.toFixed(2)),
        valuationSale: Number(sale.toFixed(2)),
        projectedProfit: Number((sale - cost).toFixed(2)),
      };
    }, [products]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesLowStock = !onlyLowStock || p.stock <= p.minStockAlert;
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchQuery, selectedCategory, onlyLowStock]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCode(Date.now().toString().slice(-8)); // auto-generated code
    setFormCategory('Despensa');
    setFormCostPrice('');
    setFormSalePrice('');
    setFormStock('10');
    setFormMinStock('5');
    setFormUnit('pza');
    setFormError('');
    setIsProductModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCode(product.code);
    setFormCategory(product.category);
    setFormCostPrice(product.costPrice.toString());
    setFormSalePrice(product.salePrice.toString());
    setFormStock(product.stock.toString());
    setFormMinStock(product.minStockAlert.toString());
    setFormUnit(product.unit);
    setFormError('');
    setIsProductModalOpen(true);
  };

  // Quick adjust stock
  const handleQuickAdjustStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    const updated: Product = {
      ...product,
      stock: newStock,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateProduct(updated);
  };

  // Save product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Por favor ingresa el nombre del producto');
      return;
    }

    const cost = parseFloat(formCostPrice) || 0;
    const sale = parseFloat(formSalePrice) || 0;
    const stock = parseFloat(formStock) || 0;
    const minStock = parseFloat(formMinStock) || 5;

    if (sale <= 0) {
      setFormError('El precio de venta debe ser mayor a 0');
      return;
    }

    const now = new Date().toISOString();

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: formName.trim(),
        code: formCode.trim(),
        category: formCategory.trim(),
        costPrice: cost,
        salePrice: sale,
        stock,
        minStockAlert: minStock,
        unit: formUnit,
        updatedAt: now,
      };
      await onUpdateProduct(updated);
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        category: formCategory.trim() || 'General',
        costPrice: cost,
        salePrice: sale,
        stock,
        minStockAlert: minStock,
        unit: formUnit,
        updatedAt: now,
      };
      await onAddProduct(newProduct);
    }

    setIsProductModalOpen(false);
  };

  // Calculated margin for modal helper
  const modalCost = parseFloat(formCostPrice) || 0;
  const modalSale = parseFloat(formSalePrice) || 0;
  const modalMargin =
    modalCost > 0
      ? (((modalSale - modalCost) / modalCost) * 100).toFixed(1)
      : '0.0';
  const modalProfitPerUnit = (modalSale - modalCost).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Inventory Valuation KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Productos (SKUs)</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{products.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">
            {totalStockUnits} unidades en total
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Alerta Bajo Stock</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-black ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {lowStockCount}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Requieren resurtido pronto
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Valor Inventario (Costo)</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {currencySymbol}{valuationCost.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Inversión en mercancía
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ganancia Proyectada</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">
            +{currencySymbol}{projectedProfit.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Venta total: {currencySymbol}{valuationSale.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action Controls & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-1.5 w-full md:w-88">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, nombre o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setScannerTarget('search');
              setIsScanModalOpen(true);
            }}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
            title="Escanear código con la cámara para buscar"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Category & Low Stock Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'Todos' ? 'Todas las Categorías' : c}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>Solo Bajo Stock ({lowStockCount})</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onSyncWithSheets}
            disabled={isSyncing}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Sincronizar inventario con Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Sincronizar Sheets</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Código / SKU</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Costo Compra</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-right">Margen</th>
                <th className="py-3 px-4 text-center">Stock Físico</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.map((p) => {
                const margin =
                  p.costPrice > 0
                    ? (((p.salePrice - p.costPrice) / p.costPrice) * 100).toFixed(0)
                    : '100';
                const isOutOfStock = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.minStockAlert;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* SKU */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {p.code || '—'}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.name}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {p.category}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {currencySymbol}{p.costPrice.toFixed(2)}
                    </td>

                    {/* Sale Price */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {currencySymbol}{p.salePrice.toFixed(2)}
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md text-[11px]">
                        +{margin}%
                      </span>
                    </td>

                    {/* Stock with quick +/- buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustStock(p, -1)}
                          className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                          title="Restar 1"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold font-mono text-slate-900">
                          {p.stock} <span className="text-[10px] text-slate-400 font-normal">{p.unit}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustStock(p, 1)}
                          className="w-5 h-5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold"
                          title="Sumar 1"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                          Agotado
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Bajo ({p.stock}/{p.minStockAlert})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No se encontraron productos en el inventario</p>
                    <p className="text-xs text-slate-400 mt-1">Modifica los filtros o registra un nuevo producto.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto al Inventario'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Leche Entera 1L, Aceite Vegetal 850ml..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* SKU & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Código de Barras / SKU
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('form');
                        setIsScanModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Escanear con Cámara</span>
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="75010..."
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('form');
                        setIsScanModalOpen(true);
                      }}
                      className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition-colors shrink-0"
                      title="Escanear con cámara"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <datalist id="category-suggestions">
                    <option value="Bebidas" />
                    <option value="Despensa" />
                    <option value="Lácteos y Huevos" />
                    <option value="Panadería" />
                    <option value="Botanas y Dulces" />
                    <option value="Limpieza y Hogar" />
                    <option value="Higiene Personal" />
                    <option value="Frutas y Verduras" />
                  </datalist>
                </div>
              </div>

              {/* Cost Price & Sale Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Costo de Compra ($)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    placeholder="0.00"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Precio de Venta al Público ($) *
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    placeholder="0.00"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-emerald-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Dynamic Profit Calculation Helper */}
              {modalSale > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
                  <span>
                    Margen de ganancia: <strong>+{modalMargin}%</strong>
                  </span>
                  <span className="font-bold">
                    Ganancia por pieza: +{currencySymbol}{modalProfitPerUnit}
                  </span>
                </div>
              )}

              {/* Stock, Min Alert & Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Stock Físico
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Alerta Mínima
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unidad
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="pza">Pieza (pza)</option>
                    <option value="kg">Kilo (kg)</option>
                    <option value="lt">Litro (lt)</option>
                    <option value="paq">Paquete (paq)</option>
                  </select>
                </div>
              </div>

              <div className="px-1 pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPLICIT CONFIRMATION MODAL FOR DELETING A PRODUCT (MANDATORY REQUIREMENT) */}
      <ConfirmationModal
        isOpen={Boolean(productToDelete)}
        title="¿Eliminar producto del inventario?"
        message={`¿Estás seguro de que deseas eliminar permanentemente "${productToDelete?.name}"? Esta acción actualizará la hoja de cálculo de Google Sheets.`}
        confirmLabel="Sí, eliminar producto"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={async () => {
          if (productToDelete) {
            await onDeleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />

      {/* MOBILE CAMERA BARCODE SCANNER MODAL */}
      <CameraScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanSuccess={(code) => {
          if (scannerTarget === 'form') {
            setFormCode(code);
          } else {
            setSearchQuery(code);
          }
          setIsScanModalOpen(false);
        }}
        title={
          scannerTarget === 'form'
            ? 'Escanear Código del Producto'
            : 'Buscar Producto por Código de Barras'
        }
        subtitle="Apunta la cámara del celular al código de barras del producto"
        continuous={false}
      />
    </div>
  );
};
