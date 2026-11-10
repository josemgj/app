import { Product, Sale, DailyReport } from '../types/store';

const SPREADSHEET_TITLE = 'AbarrotesSync - Control de Tienda';

export interface SpreadsheetInfo {
  id: string;
  url: string;
  name: string;
  isNew: boolean;
}

/**
 * Searches user's Google Drive for existing store spreadsheet or creates a new one
 */
export async function findOrCreateStoreSpreadsheet(
  accessToken: string,
  initialProducts: Product[] = []
): Promise<SpreadsheetInfo> {
  // 1. Search in Drive
  const query = encodeURIComponent(
    `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    console.error('Error buscando hoja en Google Drive:', errText);
    throw new Error(`Error al consultar Google Drive: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const file = searchData.files[0];
    return {
      id: file.id,
      url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      name: file.name,
      isNew: false,
    };
  }

  // 2. Not found: create a new spreadsheet with organized tabs
  const createSpreadsheetUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const newSheetPayload = {
    properties: {
      title: SPREADSHEET_TITLE,
    },
    sheets: [
      {
        properties: {
          title: 'Inventario',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.1, green: 0.7, blue: 0.4 },
        },
      },
      {
        properties: {
          title: 'Ventas',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.2, green: 0.5, blue: 0.9 },
        },
      },
      {
        properties: {
          title: 'Cierres_Diarios',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.9, green: 0.6, blue: 0.1 },
        },
      },
      {
        properties: {
          title: 'Configuracion',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.5, green: 0.5, blue: 0.5 },
        },
      },
    ],
  };

  const createRes = await fetch(createSpreadsheetUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newSheetPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Error creando hoja en Google Sheets:', errText);
    throw new Error(`Error al crear la hoja en Google Sheets: ${createRes.statusText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Initialize headers and starter data
  await initializeSpreadsheetData(accessToken, spreadsheetId, initialProducts);

  return {
    id: spreadsheetId,
    url: spreadsheetUrl,
    name: SPREADSHEET_TITLE,
    isNew: true,
  };
}

/**
 * Populates table headers and initial inventory in the spreadsheet
 */
async function initializeSpreadsheetData(
  accessToken: string,
  spreadsheetId: string,
  initialProducts: Product[]
) {
  // Headers definitions
  const inventoryHeaders = [
    'ID',
    'Código / SKU',
    'Producto',
    'Categoría',
    'Costo Compra ($)',
    'Precio Venta ($)',
    'Stock Actual',
    'Stock Mínimo',
    'Unidad',
    'Última Actualización',
  ];

  const salesHeaders = [
    'ID Venta',
    'Folio Ticket',
    'Fecha y Hora',
    'ID Producto',
    'Producto',
    'Cantidad',
    'Precio Unitario ($)',
    'Costo Unitario ($)',
    'Subtotal ($)',
    'Ganancia Neta ($)',
    'Método Pago',
    'Notas',
  ];

  const closuresHeaders = [
    'Fecha',
    'Total Ventas ($)',
    'Ganancia Total ($)',
    'Núm. Tickets',
    'Artículos Vendidos',
    'Productos Bajo Stock',
    'Valor Inventario Costo ($)',
    'Valor Inventario Venta ($)',
    'Notas',
    'Registrado El',
  ];

  const configHeaders = ['Parámetro', 'Valor', 'Descripción'];
  const configRows = [
    configHeaders,
    ['Nombre Tienda', 'Mi Tiendita Abarrotes', 'Nombre comercial del negocio'],
    ['Moneda', 'MXN', 'Moneda de operación'],
    ['Versión Sistema', '1.0', 'Versión de AbarrotesSync'],
    ['Sincronización Automática', 'ACTIVADA', 'Envío instantáneo de ventas a Sheets'],
  ];

  const inventoryRows = [
    inventoryHeaders,
    ...initialProducts.map((p) => [
      p.id,
      p.code,
      p.name,
      p.category,
      p.costPrice,
      p.salePrice,
      p.stock,
      p.minStockAlert,
      p.unit,
      p.updatedAt,
    ]),
  ];

  const dataPayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Inventario!A1:J' + inventoryRows.length,
        values: inventoryRows,
      },
      {
        range: 'Ventas!A1:L1',
        values: [salesHeaders],
      },
      {
        range: 'Cierres_Diarios!A1:J1',
        values: [closuresHeaders],
      },
      {
        range: 'Configuracion!A1:C' + configRows.length,
        values: configRows,
      },
    ],
  };

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataPayload),
    }
  );
}

/**
 * Loads products from Google Sheets
 */
export async function loadInventoryFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Product[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inventario!A2:J1000`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Error al leer el inventario desde Google Sheets');
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows
    .filter((row: string[]) => row.length > 2 && row[2])
    .map((row: string[], index: number): Product => {
      return {
        id: row[0] || `prod-${index + 1}`,
        code: row[1] || '',
        name: row[2] || 'Producto sin nombre',
        category: row[3] || 'General',
        costPrice: parseFloat(String(row[4]).replace(/[^0-9.-]/g, '')) || 0,
        salePrice: parseFloat(String(row[5]).replace(/[^0-9.-]/g, '')) || 0,
        stock: parseFloat(String(row[6]).replace(/[^0-9.-]/g, '')) || 0,
        minStockAlert: parseFloat(String(row[7]).replace(/[^0-9.-]/g, '')) || 5,
        unit: row[8] || 'pza',
        updatedAt: row[9] || new Date().toISOString(),
      };
    });
}

/**
 * Saves entire updated inventory list to Google Sheets
 */
export async function saveInventoryToSheet(
  accessToken: string,
  spreadsheetId: string,
  products: Product[]
): Promise<boolean> {
  const headers = [
    'ID',
    'Código / SKU',
    'Producto',
    'Categoría',
    'Costo Compra ($)',
    'Precio Venta ($)',
    'Stock Actual',
    'Stock Mínimo',
    'Unidad',
    'Última Actualización',
  ];

  const rows = [
    headers,
    ...products.map((p) => [
      p.id,
      p.code,
      p.name,
      p.category,
      p.costPrice,
      p.salePrice,
      p.stock,
      p.minStockAlert,
      p.unit,
      p.updatedAt,
    ]),
  ];

  // First clear old rows to prevent leftovers
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inventario!A1:J1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inventario!A1?valueInputOption=USER_ENTERED`;
  const res = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  return res.ok;
}

/**
 * Appends a completed sale to the 'Ventas' sheet in Google Sheets and updates inventory stock
 */
export async function recordSaleInGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  sale: Sale,
  allUpdatedProducts: Product[]
): Promise<boolean> {
  // 1. Prepare rows to append in 'Ventas'
  const salesRows = sale.items.map((item) => [
    sale.id,
    sale.ticketNumber,
    sale.timestamp,
    item.product.id,
    item.product.name,
    item.quantity,
    item.unitPrice,
    item.costSubtotal / (item.quantity || 1),
    item.subtotal,
    item.profitSubtotal,
    sale.paymentMethod,
    sale.notes || '',
  ]);

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Ventas!A:L:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: salesRows,
    }),
  });

  if (!appendRes.ok) {
    console.error('Error appending sale rows to Google Sheets');
  }

  // 2. Synchronize current inventory stock
  await saveInventoryToSheet(accessToken, spreadsheetId, allUpdatedProducts);

  return appendRes.ok;
}

/**
 * Loads historical sales from Google Sheets 'Ventas' sheet
 */
export async function loadSalesFromSheet(
  accessToken: string,
  spreadsheetId: string,
  currentProducts: Product[]
): Promise<Sale[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Ventas!A2:L2000`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  // Group rows by ticket ID
  const salesMap = new Map<string, Sale>();

  for (const row of rows) {
    if (!row || row.length < 5) continue;
    const saleId = row[0];
    const ticketNumber = row[1];
    const timestamp = row[2] || new Date().toISOString();
    const dateString = timestamp.split('T')[0];
    const productId = row[3];
    const productName = row[4];
    const quantity = parseFloat(row[5]) || 1;
    const unitPrice = parseFloat(row[6]) || 0;
    const unitCost = parseFloat(row[7]) || unitPrice * 0.7;
    const subtotal = parseFloat(row[8]) || unitPrice * quantity;
    const profitSubtotal = parseFloat(row[9]) || subtotal - unitCost * quantity;
    const paymentMethod = (row[10] as Sale['paymentMethod']) || 'efectivo';
    const notes = row[11] || '';

    const matchedProduct = currentProducts.find((p) => p.id === productId) || {
      id: productId,
      code: '',
      name: productName,
      category: 'General',
      costPrice: unitCost,
      salePrice: unitPrice,
      stock: 10,
      minStockAlert: 5,
      unit: 'pza',
      updatedAt: timestamp,
    };

    const cartItem = {
      product: matchedProduct,
      quantity,
      unitPrice,
      subtotal,
      costSubtotal: unitCost * quantity,
      profitSubtotal,
    };

    if (!salesMap.has(saleId)) {
      salesMap.set(saleId, {
        id: saleId,
        ticketNumber,
        timestamp,
        dateString,
        items: [cartItem],
        totalAmount: subtotal,
        totalCost: unitCost * quantity,
        totalProfit: profitSubtotal,
        paymentMethod,
        notes,
      });
    } else {
      const existing = salesMap.get(saleId)!;
      existing.items.push(cartItem);
      existing.totalAmount += subtotal;
      existing.totalCost += unitCost * quantity;
      existing.totalProfit += profitSubtotal;
    }
  }

  return Array.from(salesMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Appends a daily closure record to Google Sheets 'Cierres_Diarios'
 */
export async function appendDailyReportToSheet(
  accessToken: string,
  spreadsheetId: string,
  report: DailyReport
): Promise<boolean> {
  const row = [
    report.date,
    report.totalSalesAmount,
    report.totalProfitAmount,
    report.totalTransactions,
    report.itemsSold,
    report.lowStockCount,
    report.stockValuationCost,
    report.stockValuationSale,
    report.notes || '',
    new Date().toISOString(),
  ];

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Cierres_Diarios!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [row],
    }),
  });

  return res.ok;
}

/**
 * Loads daily reports from Google Sheets 'Cierres_Diarios'
 */
export async function loadDailyReportsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<DailyReport[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Cierres_Diarios!A2:J500`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  return rows
    .filter((r) => r.length > 0 && r[0])
    .map((r) => ({
      date: r[0],
      totalSalesAmount: parseFloat(String(r[1]).replace(/[^0-9.-]/g, '')) || 0,
      totalProfitAmount: parseFloat(String(r[2]).replace(/[^0-9.-]/g, '')) || 0,
      totalTransactions: parseInt(String(r[3]).replace(/[^0-9.-]/g, ''), 10) || 0,
      itemsSold: parseFloat(String(r[4]).replace(/[^0-9.-]/g, '')) || 0,
      lowStockCount: parseInt(String(r[5]).replace(/[^0-9.-]/g, ''), 10) || 0,
      stockValuationCost: parseFloat(String(r[6]).replace(/[^0-9.-]/g, '')) || 0,
      stockValuationSale: parseFloat(String(r[7]).replace(/[^0-9.-]/g, '')) || 0,
      notes: r[8] || '',
      timestamp: r[9] || new Date().toISOString(),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
