const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const generateExcelReport = async (reportType, data) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Smart Inventory AI System';
  workbook.created = new Date();

  // Primary Sheet: Summary & Sales
  const salesSheet = workbook.addWorksheet('Sales & Revenue Summary');

  salesSheet.columns = [
    { header: 'Invoice #', key: 'invoiceNumber', width: 20 },
    { header: 'Customer', key: 'customerName', width: 22 },
    { header: 'Subtotal (₹)', key: 'subtotal', width: 15 },
    { header: 'GST (₹)', key: 'totalGst', width: 15 },
    { header: 'Discount (₹)', key: 'discountAmount', width: 15 },
    { header: 'Grand Total (₹)', key: 'grandTotal', width: 18 },
    { header: 'Payment Method', key: 'paymentMethod', width: 18 },
    { header: 'Date', key: 'createdAt', width: 22 },
  ];

  // Header styling
  salesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  salesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2563EB' },
  };

  if (data.billings && data.billings.length > 0) {
    data.billings.forEach((b) => {
      salesSheet.addRow({
        invoiceNumber: b.invoiceNumber,
        customerName: b.customerName,
        subtotal: b.subtotal,
        totalGst: b.totalGst,
        discountAmount: b.discountAmount,
        grandTotal: b.grandTotal,
        paymentMethod: b.paymentMethod,
        createdAt: new Date(b.createdAt).toLocaleString(),
      });
    });
  }

  // Second Sheet: Inventory & Shelf Monitoring
  const inventorySheet = workbook.addWorksheet('Inventory & Shelf Status');

  inventorySheet.columns = [
    { header: 'Product Name', key: 'name', width: 25 },
    { header: 'Barcode', key: 'barcode', width: 18 },
    { header: 'Shelf', key: 'shelfNumber', width: 15 },
    { header: 'Stock (Units)', key: 'stock', width: 15 },
    { header: 'Unit Weight (g)', key: 'unitWeight', width: 15 },
    { header: 'Selling Price (₹)', key: 'sellingPrice', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  inventorySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  inventorySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '10B981' },
  };

  if (data.products && data.products.length > 0) {
    data.products.forEach((p) => {
      inventorySheet.addRow({
        name: p.name,
        barcode: p.barcode,
        shelfNumber: p.shelfNumber,
        stock: p.stock,
        unitWeight: p.unitWeight,
        sellingPrice: p.sellingPrice,
        status: p.status,
      });
    });
  }

  // Third Sheet: Inventory History Audit Trail
  const historySheet = workbook.addWorksheet('Inventory Audit Trail');

  historySheet.columns = [
    { header: 'Product', key: 'productName', width: 25 },
    { header: 'Shelf', key: 'shelf', width: 12 },
    { header: 'Prev Weight (g)', key: 'previousWeight', width: 16 },
    { header: 'Curr Weight (g)', key: 'currentWeight', width: 16 },
    { header: 'Prev Stock', key: 'previousStock', width: 12 },
    { header: 'Curr Stock', key: 'currentStock', width: 12 },
    { header: 'Action', key: 'action', width: 20 },
    { header: 'Reason / Remarks', key: 'reason', width: 30 },
    { header: 'Timestamp', key: 'createdAt', width: 22 },
  ];

  historySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  historySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '6366F1' },
  };

  if (data.history && data.history.length > 0) {
    data.history.forEach((h) => {
      historySheet.addRow({
        productName: h.product ? h.product.name : 'Unknown Product',
        shelf: h.shelf,
        previousWeight: h.previousWeight,
        currentWeight: h.currentWeight,
        previousStock: h.previousStock,
        currentStock: h.currentStock,
        action: h.action,
        reason: `${h.reason || ''} ${h.remarks ? `(${h.remarks})` : ''}`,
        createdAt: new Date(h.createdAt).toLocaleString(),
      });
    });
  }

  // Ensure uploads/reports folder exists
  const reportsDir = path.join(__dirname, '../uploads/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `${reportType.toLowerCase()}_report_${Date.now()}.xlsx`;
  const filePath = path.join(reportsDir, filename);

  await workbook.xlsx.writeFile(filePath);

  return { filename, filePath: `/uploads/reports/${filename}` };
};

module.exports = { generateExcelReport };
