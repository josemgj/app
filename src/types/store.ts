export interface Product {
  id: string;
  code: string; // SKU or Barcode
  name: string;
  category: string;
  costPrice: number; // Cost to buy
  salePrice: number; // Price sold to customer
  stock: number; // Current physical inventory
  minStockAlert: number; // Minimum threshold to re-order
  unit: string; // 'pza' | 'kg' | 'lt' | 'paq'
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  costSubtotal: number;
  profitSubtotal: number;
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface Sale {
  id: string;
  ticketNumber: string;
  timestamp: string; // ISO string
  dateString: string; // YYYY-MM-DD
  items: CartItem[];
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  amountPaid?: number;
  change?: number;
  notes?: string;
}

export interface DailyReport {
  date: string; // YYYY-MM-DD
  timestamp: string;
  totalSalesAmount: number;
  totalProfitAmount: number;
  totalTransactions: number;
  itemsSold: number;
  lowStockCount: number;
  stockValuationCost: number;
  stockValuationSale: number;
  notes?: string;
}

export interface StoreConfig {
  storeName: string;
  currencySymbol: string;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncTime: string | null;
  autoSync: boolean;
}
