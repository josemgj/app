import { Product, Sale, DailyReport } from '../types/store';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    code: '7501055310884',
    name: 'Coca-Cola Original 600ml',
    category: 'Bebidas',
    costPrice: 13.50,
    salePrice: 19.00,
    stock: 36,
    minStockAlert: 10,
    unit: 'pza',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    code: '7501020511117',
    name: 'Leche Entera Lala 1 Litro',
    category: 'Lácteos y Huevos',
    costPrice: 22.00,
    salePrice: 29.50,
    stock: 18,
    minStockAlert: 8,
    unit: 'pza',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    code: '7501030420018',
    name: 'Huevo Blanco San Juan (1 kg)',
    category: 'Lácteos y Huevos',
    costPrice: 38.00,
    salePrice: 48.00,
    stock: 14,
    minStockAlert: 6,
    unit: 'kg',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-004',
    code: '7501000111209',
    name: 'Pan Blanco Bimbo Grande 680g',
    category: 'Panadería',
    costPrice: 37.00,
    salePrice: 48.50,
    stock: 9,
    minStockAlert: 5,
    unit: 'paq',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-005',
    code: '7501011122334',
    name: 'Tortillas de Maíz Nixtamal (1 kg)',
    category: 'Despensa',
    costPrice: 17.00,
    salePrice: 24.00,
    stock: 22,
    minStockAlert: 10,
    unit: 'kg',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-006',
    code: '7501005101010',
    name: 'Aceite Vegetal Nutrioli 850ml',
    category: 'Despensa',
    costPrice: 34.00,
    salePrice: 44.00,
    stock: 12,
    minStockAlert: 5,
    unit: 'pza',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-007',
    code: '7501791600123',
    name: 'Frijol Negro La Costeña 1kg',
    category: 'Despensa',
    costPrice: 26.50,
    salePrice: 36.00,
    stock: 15,
    minStockAlert: 6,
    unit: 'kg',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-008',
    code: '7501008020304',
    name: 'Arroz Súper Extra Verde Valle 1kg',
    category: 'Despensa',
    costPrice: 22.00,
    salePrice: 31.00,
    stock: 16,
    minStockAlert: 6,
    unit: 'kg',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-009',
    code: '7501035123456',
    name: 'Azúcar Estándar Morena 1kg',
    category: 'Despensa',
    costPrice: 21.00,
    salePrice: 28.00,
    stock: 20,
    minStockAlert: 8,
    unit: 'kg',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-010',
    code: '7501017002012',
    name: 'Atún Dolores en Agua 140g',
    category: 'Despensa',
    costPrice: 15.00,
    salePrice: 21.50,
    stock: 24,
    minStockAlert: 8,
    unit: 'pza',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-011',
    code: '7501011119020',
    name: 'Papas Sabritas Clásicas con Sal 42g',
    category: 'Botanas y Dulces',
    costPrice: 14.00,
    salePrice: 19.50,
    stock: 4, // Intentionally low stock to trigger alert demonstration
    minStockAlert: 8,
    unit: 'paq',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-012',
    code: '7501000155512',
    name: 'Galletas Marías Gamesa 170g',
    category: 'Botanas y Dulces',
    costPrice: 13.00,
    salePrice: 18.00,
    stock: 18,
    minStockAlert: 6,
    unit: 'paq',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-013',
    code: '7501026028123',
    name: 'Agua Purificada Bonafont 1.5L',
    category: 'Bebidas',
    costPrice: 11.50,
    salePrice: 17.00,
    stock: 28,
    minStockAlert: 10,
    unit: 'pza',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-014',
    code: '7501058611200',
    name: 'Café Nescafé Clásico 120g',
    category: 'Despensa',
    costPrice: 62.00,
    salePrice: 82.00,
    stock: 3, // Intentionally low stock
    minStockAlert: 5,
    unit: 'pza',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-015',
    code: '7501025409988',
    name: 'Jabón Zote Blanco 400g',
    category: 'Limpieza y Hogar',
    costPrice: 17.50,
    salePrice: 24.50,
    stock: 15,
    minStockAlert: 5,
    unit: 'pza',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-016',
    code: '7501032901124',
    name: 'Detergente Ariel Doble Poder 1kg',
    category: 'Limpieza y Hogar',
    costPrice: 33.00,
    salePrice: 45.00,
    stock: 2, // Critical low stock
    minStockAlert: 6,
    unit: 'paq',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-017',
    code: '7501024312001',
    name: 'Papel Higiénico Pétalo 4 Rollos',
    category: 'Limpieza y Hogar',
    costPrice: 25.00,
    salePrice: 35.00,
    stock: 14,
    minStockAlert: 6,
    unit: 'paq',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-018',
    code: '7501006500010',
    name: 'Salsa Botanera Valentina 370ml',
    category: 'Despensa',
    costPrice: 12.00,
    salePrice: 17.50,
    stock: 16,
    minStockAlert: 5,
    unit: 'pza',
    updatedAt: new Date().toISOString(),
  },
];

// Generate past 6 months sample sales and daily closure reports for instant visual charts
export const generateInitialSalesHistory = (products: Product[]): { sales: Sale[]; dailyReports: DailyReport[] } => {
  const sales: Sale[] = [];
  const dailyReports: DailyReport[] = [];
  const today = new Date();

  // Helper date formatter
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  let ticketCounter = 1001;

  // Generate sales across past 60 days to show rich monthly and daily analytics
  for (let daysAgo = 60; daysAgo >= 0; daysAgo--) {
    const saleDate = new Date(today);
    saleDate.setDate(saleDate.getDate() - daysAgo);
    const dateStr = formatDate(saleDate);

    // More sales on Fridays and Saturdays (day 5 and 6)
    const dayOfWeek = saleDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
    const numSalesToday = isWeekend ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 4) + 3;

    let daySalesTotal = 0;
    let dayProfitTotal = 0;
    let dayItemsTotal = 0;

    for (let s = 0; s < numSalesToday; s++) {
      const saleHour = 8 + Math.floor(Math.random() * 12);
      const saleMinute = Math.floor(Math.random() * 60);
      const timeStamp = new Date(saleDate);
      timeStamp.setHours(saleHour, saleMinute, 0);

      // Pick 1 to 4 random products for this ticket
      const numItems = Math.floor(Math.random() * 3) + 1;
      const ticketItems = [];
      let ticketTotal = 0;
      let ticketCost = 0;

      const shuffled = [...products].sort(() => 0.5 - Math.random());
      for (let i = 0; i < numItems && i < shuffled.length; i++) {
        const prod = shuffled[i];
        const qty = Math.floor(Math.random() * 2) + 1;
        const subtotal = prod.salePrice * qty;
        const costSubtotal = prod.costPrice * qty;
        const profitSubtotal = subtotal - costSubtotal;

        ticketItems.push({
          product: prod,
          quantity: qty,
          unitPrice: prod.salePrice,
          subtotal,
          costSubtotal,
          profitSubtotal,
        });

        ticketTotal += subtotal;
        ticketCost += costSubtotal;
      }

      const ticketProfit = ticketTotal - ticketCost;
      const methods: ('efectivo' | 'tarjeta' | 'transferencia')[] = ['efectivo', 'efectivo', 'efectivo', 'tarjeta', 'transferencia'];
      const method = methods[Math.floor(Math.random() * methods.length)];

      const sale: Sale = {
        id: `sale-${ticketCounter}`,
        ticketNumber: `TK-${ticketCounter}`,
        timestamp: timeStamp.toISOString(),
        dateString: dateStr,
        items: ticketItems,
        totalAmount: Number(ticketTotal.toFixed(2)),
        totalCost: Number(ticketCost.toFixed(2)),
        totalProfit: Number(ticketProfit.toFixed(2)),
        paymentMethod: method,
        amountPaid: method === 'efectivo' ? Math.ceil(ticketTotal / 50) * 50 : ticketTotal,
        change: method === 'efectivo' ? (Math.ceil(ticketTotal / 50) * 50) - ticketTotal : 0,
      };

      sales.push(sale);
      ticketCounter++;

      daySalesTotal += sale.totalAmount;
      dayProfitTotal += sale.totalProfit;
      dayItemsTotal += ticketItems.reduce((acc, curr) => acc + curr.quantity, 0);
    }

    // Add daily closure report
    if (daysAgo > 0) {
      dailyReports.push({
        date: dateStr,
        timestamp: new Date(saleDate.setHours(21, 30, 0)).toISOString(),
        totalSalesAmount: Number(daySalesTotal.toFixed(2)),
        totalProfitAmount: Number(dayProfitTotal.toFixed(2)),
        totalTransactions: numSalesToday,
        itemsSold: dayItemsTotal,
        lowStockCount: Math.floor(Math.random() * 3) + 2,
        stockValuationCost: 6850,
        stockValuationSale: 9420,
        notes: `Cierre del día ${dateStr} generado automáticamente.`,
      });
    }
  }

  return { sales, dailyReports };
};
