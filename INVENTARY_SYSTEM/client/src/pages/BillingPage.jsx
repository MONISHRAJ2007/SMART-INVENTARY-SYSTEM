import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import {
  Html5QrcodeScanner,
  Html5QrcodeSupportedFormats,
  Html5Qrcode,
} from 'html5-qrcode';
import {
  FiMaximize,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiPrinter,
  FiCheckCircle,
  FiSearch,
  FiUploadCloud,
  FiInfo,
  FiX,
} from 'react-icons/fi';

const BillingPage = () => {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI / QR');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [showScanner, setShowScanner] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [imageScanning, setImageScanning] = useState(false);
  const barcodeInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch all products for quick-select and autocomplete
  const fetchProducts = async () => {
    try {
      const res = await API.get('/products?limit=100');
      setAvailableProducts(res.data.data || []);
    } catch (err) {
      console.error('Error fetching products for billing:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Initialize html5-qrcode camera scanner optimized for 1D Barcodes + QR
  useEffect(() => {
    let scanner = null;

    if (showScanner) {
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
      ];

      scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 15,
          // Wide horizontal rectangle tailored for standard 1D product barcodes
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const width = Math.min(Math.floor(viewfinderWidth * 0.88), 380);
            const height = Math.min(Math.floor(viewfinderHeight * 0.45), 180);
            return {
              width: Math.max(width, 240),
              height: Math.max(height, 120),
            };
          },
          aspectRatio: 1.777778, // 16:9 widescreen
          disableFlip: false,
          formatsToSupport,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          useBarCodeDetectorIfSupported: true,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
        },
        /* verbose= */ false
      );

      scanner.render(
        async (decodedText) => {
          handleBarcodeScan(decodedText);
          scanner.clear().catch(() => {});
          setShowScanner(false);
        },
        (error) => {
          // Ignore transient per-frame decode errors while searching
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [showScanner]);

  // Handle Barcode Image File Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageScanning(true);
    const html5QrCode = new Html5Qrcode('reader-hidden', {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      useBarCodeDetectorIfSupported: true,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    });

    try {
      const decodedText = await html5QrCode.scanFile(file, false);
      await handleBarcodeScan(decodedText);
    } catch (err) {
      alert(
        'Unable to detect a clear barcode in the uploaded image. Please ensure the barcode is clear and well-lit, or type the barcode number manually.'
      );
    } finally {
      html5QrCode.clear().catch(() => {});
      setImageScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBarcodeScan = async (code) => {
    if (!code) return;
    const cleanCode = code.trim();
    try {
      const res = await API.get(`/products/${encodeURIComponent(cleanCode)}`);
      const product = res.data.data;
      if (product) {
        addToCart(product);
      }
    } catch (err) {
      alert(`Product with Barcode '${cleanCode}' not found. Please verify the barcode.`);
    } finally {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput || !barcodeInput.trim()) return;
    await handleBarcodeScan(barcodeInput);
    setBarcodeInput('');
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert(`'${product.name}' is currently Out of Stock!`);
      return;
    }

    const existing = cart.find((item) => item.product._id === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert(`Cannot add more than available stock (${product.stock} units) for '${product.name}'.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Only ${item.product.stock} units available in stock.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product._id !== productId));
  };

  // Billing Totals Calculations
  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.sellingPrice * item.quantity,
    0
  );
  const totalGst = cart.reduce(
    (acc, item) =>
      acc +
      ((item.product.sellingPrice * (item.product.gst || 18)) / 100) *
        item.quantity,
    0
  );
  const discountAmount = (subtotal * discountPercentage) / 100;
  const grandTotal = Math.round(subtotal + totalGst - discountAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    setLoading(true);

    try {
      const invoicePayload = {
        items: cart.map((item) => ({
          product: item.product._id,
          name: item.product.name,
          barcode: item.product.barcode,
          unitPrice: item.product.sellingPrice,
          quantity: item.quantity,
          gstPercentage: item.product.gst || 18,
          gstAmount: ((item.product.sellingPrice * (item.product.gst || 18)) / 100) * item.quantity,
          total: item.product.sellingPrice * item.quantity,
        })),
        subtotal,
        totalGst,
        discountPercentage,
        discountAmount,
        grandTotal,
        paymentMethod,
        customerName,
      };

      const res = await API.post('/billing', invoicePayload);
      setCreatedInvoice(res.data.data);
      setCart([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Billing Checkout Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Barcode POS Billing & Inventory Checkout
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scan via Camera/USB Scanner &rarr; Retrieve Item &rarr; Instant Bill & Automated Inventory Update
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageScanning}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all"
            title="Upload Barcode Photo or Image"
          >
            <FiUploadCloud className="w-4 h-4 text-blue-500" />
            <span>{imageScanning ? 'Scanning Image...' : 'Upload Barcode Image'}</span>
          </button>

          <button
            onClick={() => setShowScanner(!showScanner)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all w-fit"
          >
            <FiMaximize className="w-4 h-4" />
            <span>{showScanner ? 'Close Camera Scanner' : 'Launch Camera Scanner'}</span>
          </button>
        </div>
      </div>

      {/* Camera Scanner Container */}
      {showScanner && (
        <div className="glass-card p-6 rounded-3xl max-w-lg mx-auto shadow-2xl border border-blue-200 dark:border-blue-900 relative">
          <button
            onClick={() => setShowScanner(false)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Close Scanner"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="text-center mb-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              Align Barcode inside Camera Box
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Hold the barcode horizontally ~15–20 cm away until it comes into sharp focus
            </p>
          </div>

          <div id="reader" className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-black/30"></div>

          <div className="mt-3 p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-blue-700 dark:text-blue-400">
              <FiInfo className="w-3.5 h-3.5" />
              <span>Scanning Tips for 1D Barcodes:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-slate-500 dark:text-slate-400 pl-1">
              <li>Keep barcode <strong>horizontal</strong> and centered inside the wide box.</li>
              <li>Keep distance at <strong>15–25 cm (6–10 inches)</strong> so your webcam can focus (holding too close causes blur).</li>
              <li>Ensure good lighting without glare or reflections on plastic packaging.</li>
              <li>You can also click <strong>"Upload Barcode Image"</strong>, <strong>type the barcode</strong>, or use <strong>Quick Add</strong>.</li>
            </ul>
          </div>
        </div>
      )}
      <div id="reader-hidden" style={{ display: 'none' }}></div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Barcode Search & Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Manual Barcode / Search Input */}
          <div className="glass-card p-4 rounded-2xl">
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  list="quick-products"
                  placeholder="Scan with barcode gun, camera, or enter barcode / product name..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
                <datalist id="quick-products">
                  {availableProducts.map((p) => (
                    <option key={p._id} value={p.barcode}>
                      {p.name} (₹{p.sellingPrice} | Stock: {p.stock})
                    </option>
                  ))}
                </datalist>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Add Item
              </button>
            </form>
          </div>

          {/* Quick Add Product Chips */}
          {availableProducts.length > 0 && (
            <div className="glass-card p-3 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Quick Add Products ({availableProducts.length})
                </span>
                <span className="text-[10px] text-slate-400">Click to instantly add to bill</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                {availableProducts.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-blue-950/60 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl text-xs transition-all text-left"
                    title={`Barcode: ${p.barcode} | Shelf: ${p.shelfNumber}`}
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">({p.barcode})</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{p.sellingPrice}</span>
                    <FiPlus className="w-3 h-3 text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cart Table */}
          <div className="glass-card rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Current Bill Cart Items ({cart.length})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-[11px] font-extrabold uppercase border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">GST %</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        Cart is empty. Scan product barcode to add items to bill.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.product._id}>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {item.product.name}
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {item.product.barcode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">₹{item.product.sellingPrice}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.product._id, -1)}
                              className="p-1 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300"
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <span className="font-bold w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product._id, 1)}
                              className="p-1 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300"
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold">{item.product.gst || 18}%</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">
                          ₹{(item.product.sellingPrice * item.quantity).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Payment & Summary Panel */}
        <div className="glass-card p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
            Payment & Invoice Summary
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-bold"
            >
              <option value="UPI / QR">UPI / QR Code</option>
              <option value="Cash">Cash Payment</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between font-semibold">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Estimated GST:</span>
              <span>₹{totalGst.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between font-semibold text-emerald-600">
                <span>Discount ({discountPercentage}%):</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-lg pt-3 border-t border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-extrabold text-xs shadow-xl shadow-emerald-500/20 transition-all duration-200"
          >
            {loading ? 'Processing Billing...' : 'Generate Bill & Update Inventory'}
          </button>
        </div>
      </div>

      {/* Invoice Created Modal */}
      {createdInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <FiCheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Invoice Generated!
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Invoice #{createdInvoice.invoiceNumber}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{createdInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold">{createdInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-emerald-600 pt-2 border-t">
                <span>Amount Paid:</span>
                <span>₹{createdInvoice.grandTotal}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
              >
                <FiPrinter className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setCreatedInvoice(null)}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
