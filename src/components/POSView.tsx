import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Banknote,
  SendHorizontal,
  Printer,
  CheckCircle,
  AlertTriangle,
  Barcode,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Receipt,
  X,
  Camera,
} from 'lucide-react';
import { Product, CartItem, Sale, PaymentMethod } from '../types/store';
import { sound } from '../utils/audio';
import { CameraScannerModal } from './CameraScannerModal';

interface POSViewProps {
  products: Product[];
  onCompleteSale: (sale: Sale, updatedProducts: Product[]) => Promise<void>;
  isSyncing: boolean;
  currencySymbol?: string;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  onCompleteSale,
  isSyncing,
  currencySymbol = '$',
}) => {
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Checkout modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Digital Ticket Receipt Modal state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Mobile Camera Barcode Scanner state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [lastCameraScanFeedback, setLastCameraScanFeedback] = useState<string | null>(null);

  // Get categories from product list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['Todos', ...cats];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart totals calculation
  const { totalAmount, totalCost, totalProfit, totalItemsCount } = useMemo(() => {
    let amount = 0;
    let cost = 0;
    let count = 0;

    cart.forEach((item) => {
      amount += item.subtotal;
      cost += item.costSubtotal;
      count += item.quantity;
    });

    return {
      totalAmount: Number(amount.toFixed(2)),
      totalCost: Number(cost.toFixed(2)),
      totalProfit: Number((amount - cost).toFixed(2)),
      totalItemsCount: count,
    };
  }, [cart]);

  // Handle adding product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      sound.playWarning();
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          sound.playWarning();
          return prev;
        }
        sound.playBeep();
        const updatedQty = existing.quantity + 1;
        const subtotal = Number((updatedQty * product.salePrice).toFixed(2));
        const costSubtotal = Number((updatedQty * product.costPrice).toFixed(2));
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: updatedQty,
                subtotal,
                costSubtotal,
                profitSubtotal: Number((subtotal - costSubtotal).toFixed(2)),
              }
            : item
        );
      } else {
        sound.playBeep();
        const subtotal = product.salePrice;
        const costSubtotal = product.costPrice;
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.salePrice,
            subtotal,
            costSubtotal,
            profitSubtotal: Number((subtotal - costSubtotal).toFixed(2)),
          },
        ];
      }
    });
  };

  // Handle quantity change
  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > product.stock) {
              sound.playWarning();
              return item;
            }
            sound.playBeep();
            const subtotal = Number((newQty * product.salePrice).toFixed(2));
            const costSubtotal = Number((newQty * product.costPrice).toFixed(2));
            return {
              ...item,
              quantity: newQty,
              subtotal,
              costSubtotal,
              profitSubtotal: Number((subtotal - costSubtotal).toFixed(2)),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove single item from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Handle barcode or exact search enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const match = products.find(
        (p) =>
          p.code.toLowerCase() === searchQuery.trim().toLowerCase() ||
          p.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (match) {
        addToCart(match);
        setSearchQuery('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  // Handle barcode scanned from mobile camera
  const handleCameraScanSuccess = (decodedText: string) => {
    const cleanText = decodedText.trim().toLowerCase();
    const match = products.find(
      (p) =>
        p.code.trim().toLowerCase() === cleanText ||
        cleanText.includes(p.code.trim().toLowerCase())
    );

    if (match) {
      if (match.stock <= 0) {
        sound.playWarning();
        setLastCameraScanFeedback(`⚠️ "${match.name}" está agotado`);
      } else {
        addToCart(match);
        setLastCameraScanFeedback(`✅ ¡Agregado: ${match.name}! (${currencySymbol}${match.salePrice.toFixed(2)})`);
      }
    } else {
      sound.playWarning();
      setLastCameraScanFeedback(`❌ Código "${decodedText}" no registrado en inventario`);
    }
  };

  // Open payment modal
  const openPaymentModal = () => {
    if (cart.length === 0) return;
    setCashReceived(totalAmount.toString());
    setIsPaymentModalOpen(true);
  };

  // Cash change calculation
  const cashNum = parseFloat(cashReceived) || 0;
  const changeToReturn = cashNum >= totalAmount ? Number((cashNum - totalAmount).toFixed(2)) : 0;

  // Process and finalize sale
  const handleConfirmSale = async () => {
    if (cart.length === 0 || isProcessingSale) return;
    setIsProcessingSale(true);

    try {
      const now = new Date();
      const ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;

      // Deduct stock for all purchased items
      const updatedProducts = products.map((prod) => {
        const itemSold = cart.find((c) => c.product.id === prod.id);
        if (itemSold) {
          const newStock = Math.max(0, prod.stock - itemSold.quantity);
          return {
            ...prod,
            stock: newStock,
            updatedAt: now.toISOString(),
          };
        }
        return prod;
      });

      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        ticketNumber: ticketId,
        timestamp: now.toISOString(),
        dateString: now.toISOString().split('T')[0],
        items: [...cart],
        totalAmount,
        totalCost,
        totalProfit,
        paymentMethod,
        amountPaid: paymentMethod === 'efectivo' ? cashNum : totalAmount,
        change: paymentMethod === 'efectivo' ? changeToReturn : 0,
        notes: saleNotes,
      };

      // Play cash register sound
      sound.playCashRegister();

      // Submit to parent for state & Google Sheets sync
      await onCompleteSale(newSale, updatedProducts);

      // Show digital ticket receipt
      setCompletedSale(newSale);
      setIsPaymentModalOpen(false);
      setCart([]);
      setSaleNotes('');
    } catch (error) {
      console.error('Error al procesar la venta:', error);
    } finally {
      setIsProcessingSale(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 2-column layout: Products Catalog (Left) & Cart / POS register (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Products Browser (7 or 8 cols on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search bar & quick filter */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código de barras o presiona Enter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-11 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-md transition-colors"
                  >
                    Limpiar
                  </button>
                ) : (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    <Barcode className="w-3.5 h-3.5" />
                    <span>Escáner</span>
                  </div>
                )}
              </div>

              {/* Mobile Camera Barcode Scanner Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setLastCameraScanFeedback(null);
                  setIsCameraOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
                title="Escanear código de barras con la cámara del celular"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Escanear con Cámara</span>
                <span className="sm:hidden">Cámara</span>
              </button>
            </div>

            {/* Category horizontal pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const isOutOfStock = prod.stock <= 0;
              const isLowStock = prod.stock > 0 && prod.stock <= prod.minStockAlert;
              const inCart = cart.find((item) => item.product.id === prod.id);

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  className={`group relative bg-white p-3.5 rounded-2xl border transition-all flex flex-col justify-between text-left cursor-pointer select-none ${
                    isOutOfStock
                      ? 'opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-200/90 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Category & Stock Pill */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-medium text-slate-500 truncate max-w-[90px]">
                        {prod.category}
                      </span>
                      {isOutOfStock ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 rounded-md">
                          Agotado
                        </span>
                      ) : isLowStock ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded-md">
                          Quedan {prod.stock}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          {prod.stock} {prod.unit}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {prod.name}
                    </h4>
                  </div>

                  {/* Price & Add indicator */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Precio</span>
                      <span className="text-base font-extrabold text-slate-900 tracking-tight">
                        {currencySymbol}
                        {prod.salePrice.toFixed(2)}
                      </span>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                        inCart
                          ? 'bg-emerald-600 text-white font-bold text-xs shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                      }`}
                    >
                      {inCart ? inCart.quantity : <Plus className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No se encontraron productos</p>
                <p className="text-xs text-slate-400 mt-1">Prueba con otra palabra clave o agrega un producto en Inventario</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Terminal de Cobro / Ticket de Venta */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 overflow-hidden flex flex-col h-[calc(100vh-120px)] max-h-[750px]">
            {/* Header of Ticket */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Ticket de Venta Actual</h3>
                  <p className="text-[11px] text-slate-400">
                    {totalItemsCount} {totalItemsCount === 1 ? 'artículo' : 'artículos'} en canasta
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold p-1 hover:bg-white/10 rounded-lg transition-colors"
                  title="Vaciar ticket"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.product.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h5 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-slate-500">
                        {currencySymbol}{item.unitPrice.toFixed(2)} c/u
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                        +{currencySymbol}{item.profitSubtotal.toFixed(2)} ganancia
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-black text-slate-800 font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="text-right shrink-0 w-16">
                    <div className="text-xs font-black text-slate-900 font-mono">
                      {currencySymbol}{item.subtotal.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-300 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <ShoppingBag className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">El ticket está vacío</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                    Haz clic en los productos del catálogo o escanea su código de barras para agregarlos.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Summary & Big Checkout Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Estimated merchant profit for this ticket */}
              {cart.length > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-100/60 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
                  <span className="flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Ganancia neta estimada:
                  </span>
                  <span className="font-extrabold font-mono text-emerald-700">
                    +{currencySymbol}{totalProfit.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total a Cobrar</span>
                <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                  {currencySymbol}{totalAmount.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || isSyncing}
                onClick={openPaymentModal}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DollarSign className="w-5 h-5" />
                <span>Cobrar Ticket ({currencySymbol}{totalAmount.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Cobrar Venta</h3>
                <p className="text-xs text-slate-400">Total a liquidar: {currencySymbol}{totalAmount.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('efectivo');
                      setCashReceived(totalAmount.toString());
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'efectivo'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('tarjeta');
                      setCashReceived(totalAmount.toString());
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'tarjeta'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Tarjeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('transferencia');
                      setCashReceived(totalAmount.toString());
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'transferencia'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <SendHorizontal className="w-4 h-4 text-purple-600" />
                    <span>Transferencia</span>
                  </button>
                </div>
              </div>

              {/* Cash Controls (Only if 'efectivo') */}
              {paymentMethod === 'efectivo' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Monto Recibido</label>
                    <span className="text-xs text-slate-500 font-mono">Total: {currencySymbol}{totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Fast Bills shortcuts */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashReceived(totalAmount.toString())}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
                    >
                      Exacto
                    </button>
                    {[50, 100, 200, 500, 1000].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setCashReceived(bill.toString())}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-mono"
                      >
                        +{currencySymbol}{bill}
                      </button>
                    ))}
                  </div>

                  {/* Change calculation */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Cambio a Entregar:</span>
                    <span
                      className={`text-xl font-black font-mono ${
                        cashNum < totalAmount ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {cashNum < totalAmount ? (
                        <span className="text-xs font-semibold">Faltan {currencySymbol}{(totalAmount - cashNum).toFixed(2)}</span>
                      ) : (
                        `${currencySymbol}${changeToReturn.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Optional notes */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Notas del ticket (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Cliente frecuente / Pago con billete de $500..."
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isProcessingSale || (paymentMethod === 'efectivo' && cashNum < totalAmount)}
                onClick={handleConfirmSale}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {isProcessingSale ? 'Registrando en Sheets...' : 'Completar Venta y Registrar en Sheets'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE TICKET MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Success header */}
            <div className="p-4 bg-emerald-600 text-white text-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1.5">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-extrabold text-base">¡Venta Registrada Exitosamente!</h3>
              <p className="text-xs text-emerald-100">Guardado automáticamente en Google Sheets</p>
            </div>

            {/* Ticket representation */}
            <div className="p-6 bg-slate-50/50 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h4 className="font-bold text-sm tracking-tight text-slate-900">MI TIENDITA ABARROTES</h4>
                <p className="text-[11px] text-slate-500">Ticket #{completedSale.ticketNumber}</p>
                <p className="text-[10px] text-slate-400">{new Date(completedSale.timestamp).toLocaleString()}</p>
              </div>

              {/* Items */}
              <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[170px]">{item.quantity}x {item.product.name}</span>
                    <span className="font-bold">{currencySymbol}{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Financials */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-sm text-slate-950 pt-1">
                  <span>TOTAL:</span>
                  <span>{currencySymbol}{completedSale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Método de Pago:</span>
                  <span className="capitalize">{completedSale.paymentMethod}</span>
                </div>
                {completedSale.paymentMethod === 'efectivo' && (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Pagó con:</span>
                      <span>{currencySymbol}{(completedSale.amountPaid || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-emerald-700">
                      <span>Cambio entregado:</span>
                      <span>{currencySymbol}{(completedSale.change || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                  <span>Ganancia neta:</span>
                  <span className="text-emerald-700">+{currencySymbol}{completedSale.totalProfit.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                ¡Gracias por su compra!
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA BARCODE SCANNER MODAL FOR POS */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          setLastCameraScanFeedback(null);
        }}
        onScanSuccess={handleCameraScanSuccess}
        title="Escáner de Código de Barras (Cámara)"
        subtitle="Apunta la cámara al código de barras del producto para agregarlo al carrito"
        continuous={true}
        lastScannedFeedback={lastCameraScanFeedback}
      />
    </div>
  );
};
