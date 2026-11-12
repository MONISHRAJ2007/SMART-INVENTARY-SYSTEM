import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { SocketContext } from '../contexts/SocketContext';
import {
  FiCpu,
  FiBox,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiBatteryCharging,
  FiClock,
  FiEye,
  FiArrowRight,
  FiCheck,
  FiZap,
  FiCamera,
  FiUploadCloud,
  FiX,
  FiExternalLink,
} from 'react-icons/fi';

const ShelfMonitorPage = () => {
  const [shelves, setShelves] = useState([]);
  const [esp32Status, setEsp32Status] = useState({ online: true, battery: 100 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState('Shelf A');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const socket = useContext(SocketContext);


  const fetchShelfData = async () => {
    try {
      const res = await API.get('/shelf');
      setShelves(res.data.data);
      setEsp32Status({
        online: res.data.esp32Online,
        battery: 100,
        lastPing: res.data.lastPing,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveMismatch = async (shelfName) => {
    try {
      setActionLoading(true);
      await API.post('/shelf/mismatch/resolve', { shelf: shelfName });
      await fetchShelfData();
      if (scanResult && scanResult.shelf === shelfName) {
        setScanResult(null);
      }
    } catch (err) {
      console.error('Error resolving mismatch:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const openScannerModal = (shelfName) => {
    setSelectedShelf(shelfName);
    setScanResult(null);
    setPreviewImage(null);
    setScannerModalOpen(true);
  };

  const handleScanFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setScanning(true);
      const formData = new FormData();
      formData.append('shelf', selectedShelf);
      formData.append('image', file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);

      const res = await API.post('/shelf/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setScanResult(res.data.data);
      await fetchShelfData();
    } catch (err) {
      console.error('Scan error:', err);
      alert('Error during image scan: ' + (err.response?.data?.message || err.message));
    } finally {
      setScanning(false);
    }
  };

  const handlePresetScan = async (presetType) => {
    try {
      setScanning(true);
      const isShelfA = selectedShelf === 'Shelf A';
      let samplePreset = '';

      if (presetType === 'mismatch') {
        samplePreset = isShelfA ? 'shelf_a_with_misplaced_book' : 'shelf_b_with_misplaced_tea';
      } else if (presetType === 'foreign') {
        samplePreset = 'shelf_a_with_foreign_item';
      } else {
        samplePreset = isShelfA ? 'shelf_a_clean' : 'shelf_b_clean';
      }

      const res = await API.post('/shelf/scan', {
        shelf: selectedShelf,
        samplePreset,
      });

      setScanResult(res.data.data);
      await fetchShelfData();
    } catch (err) {
      console.error('Preset scan error:', err);
      alert('Error during preset scan: ' + (err.response?.data?.message || err.message));
    } finally {
      setScanning(false);
    }
  };

  const handleSimulateMismatch = async (shelfName) => {
    try {
      setActionLoading(true);
      const isShelfA = shelfName === 'Shelf A';
      await API.post('/shelf/mismatch', {
        shelf: shelfName,
        slot: isShelfA ? 'Slot 2 (Center)' : 'Slot 1 (Left)',
        positionId: isShelfA ? 'SLOT-02' : 'SLOT-01',
        detectedItem: isShelfA ? 'books' : 'tea powder',
        expectedItem: isShelfA ? 'tea powder' : 'books',
        rightfulShelf: isShelfA ? 'Shelf B' : 'Shelf A',
        confidence: 0.96,
        action: isShelfA
          ? 'Misplaced item: Customer left books on Shelf A. Please re-shelve to Shelf B.'
          : 'Misplaced item: Customer left tea powder on Shelf B. Please re-shelve to Shelf A.',
      });
      await fetchShelfData();
    } catch (err) {
      console.error('Error simulating mismatch:', err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchShelfData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('shelf:update', (updatedShelves) => {
      setShelves(updatedShelves);
    });

    socket.on('shelf:mismatch', (data) => {
      if (data.shelves) setShelves(data.shelves);
    });

    socket.on('shelf:mismatch_resolved', (data) => {
      if (data.shelves) setShelves(data.shelves);
    });

    socket.on('esp32:status', (status) => {
      setEsp32Status(status);
    });

    return () => {
      socket.off('shelf:update');
      socket.off('shelf:mismatch');
      socket.off('shelf:mismatch_resolved');
      socket.off('esp32:status');
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Smart Shelf Telemetry & Monitoring
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime Load Cell Weight, Math.floor Stock Counting & Weight Discrepancy Verification
          </p>
        </div>

        {/* ESP32 Hardware Status Card */}
        <div className="glass-card px-4 py-2 rounded-2xl flex items-center space-x-4 text-xs font-bold w-fit">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                esp32Status.online ? 'bg-emerald-500 animate-ping' : 'bg-red-500'
              }`}
            ></span>
            <span>
              ESP32 Device: {esp32Status.online ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
            <FiBatteryCharging className="w-4 h-4" />
            <span>{esp32Status.battery || 100}% Battery</span>
          </div>
        </div>
      </div>

      {/* 2 Shelf Cards (Shelf A & Shelf B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shelves.map((shelf) => {
          const product = shelf.product;
          const unitWeight = product?.unitWeight || 250;
          const capacity = shelf.shelfCapacityGrams || 10000;
          const currentWeight = shelf.actualShelfWeight || 0;
          const stockCount = shelf.actualStock || 0;
          const filledPercentage = shelf.filledPercentage || 0;
          const expectedWeight = shelf.expectedShelfWeight || 0;
          const weightDiff = shelf.weightDifference || 0;
          const isDiscrepant = shelf.discrepancyStatus === 'Discrepancy';
          const hasMismatch =
            shelf.hasMismatch ||
            shelf.status === 'Mismatch' ||
            (shelf.mismatches && shelf.mismatches.length > 0);

          return (
            <div
              key={shelf._id}
              className={`glass-card rounded-3xl p-6 shadow-xl border relative transition-all duration-300 ${
                hasMismatch
                  ? 'border-amber-500 shadow-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent'
                  : isDiscrepant
                  ? 'border-red-500 shadow-red-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">
                    {shelf.shelf === 'Shelf A' ? 'A' : 'B'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {shelf.shelf}
                    </h3>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Product: {product ? product.name : 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openScannerModal(shelf.shelf)}
                    title="Upload or scan image of this shelf to detect misplaced products"
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition text-[11px] font-extrabold flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
                  >
                    <FiCamera className="w-3.5 h-3.5" />
                    <span>AI Image Audit</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleSimulateMismatch(shelf.shelf)}
                    title="Simulate Vision AI Mismatch detection on this shelf"
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition text-[11px] flex items-center space-x-1"
                  >
                    <FiEye className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden sm:inline">Test Alert</span>
                  </button>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                      hasMismatch
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                        : isDiscrepant
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {hasMismatch ? (
                      <>
                        <FiAlertTriangle className="w-3.5 h-3.5" />
                        <span>Product Mismatch</span>
                      </>
                    ) : isDiscrepant ? (
                      <>
                        <FiAlertTriangle className="w-3.5 h-3.5" />
                        <span>Weight Discrepancy</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        <span>Verified Stock</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Product Mismatch Alert Banner */}
              {hasMismatch && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-red-500/10 to-transparent border border-amber-400 dark:border-amber-600/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm shadow-amber-500/30">
                          Vision AI Discrepancy
                        </span>
                        <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                          Misplaced Item On Shelf
                        </span>
                      </div>
                      {shelf.mismatches && shelf.mismatches.length > 0 ? (
                        shelf.mismatches.map((m, idx) => (
                          <div key={idx} className="text-xs space-y-1 mt-1.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              Found: <span className="text-red-600 dark:text-red-400 font-black">{m.detectedItem}</span> (Slot: {m.slot})
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                              <span>Expected: <strong>{m.expectedItem}</strong></span>
                              <FiArrowRight className="w-3 h-3 text-amber-500 inline" />
                              <span className="text-blue-600 dark:text-blue-400 font-bold">Rightful Location: {m.rightfulShelf}</span>
                            </p>
                            <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                              👉 {m.action || `Move misplaced product to ${m.rightfulShelf}`}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                          Misplaced item detected in designated shelf slot. Verify front facing items.
                        </p>
                      )}
                    </div>

                    <button
                      disabled={actionLoading}
                      onClick={() => handleResolveMismatch(shelf.shelf)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-1.5 shrink-0 transition"
                    >
                      <FiCheck className="w-4 h-4" />
                      <span>Resolve & Re-shelve</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Main Weight & Stock Display */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Measured Shelf Weight
                  </span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {currentWeight.toLocaleString()} <span className="text-sm font-normal">g</span>
                  </p>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Capacity: {(capacity / 1000).toFixed(1)} kg
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Calculated Stock (Math.floor)
                  </span>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {stockCount} <span className="text-sm font-normal text-slate-700 dark:text-slate-300">Units</span>
                  </p>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Unit Weight: {unitWeight}g
                  </span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-bold">
                  <span>Shelf Capacity Filled</span>
                  <span className="text-blue-600 dark:text-blue-400">{filledPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      filledPercentage > 50
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                        : filledPercentage > 20
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-red-500 to-rose-600'
                    }`}
                    style={{ width: `${filledPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Weight Verification Breakdown */}
              <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-2 text-xs">
                <h4 className="font-extrabold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span>Inventory Verification</span>
                  <span className="text-[10px] font-normal">Tolerance: ±{shelf.toleranceGrams || 50}g</span>
                </h4>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Expected Weight (DB Stock × Unit Wt):</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {expectedWeight} g
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Measured Weight (ESP32 Load Cell):</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {currentWeight} g
                  </span>
                </div>

                <div className="flex justify-between font-bold pt-1 border-t border-blue-200 dark:border-blue-900">
                  <span>Weight Variance Difference:</span>
                  <span className={isDiscrepant ? 'text-red-600' : 'text-emerald-600'}>
                    {weightDiff} g {isDiscrepant ? '(ALERT TRIGGERED)' : '(VERIFIED OK)'}
                  </span>
                </div>
              </div>

              {/* Footer Timestamp */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center space-x-1">
                  <FiClock className="w-3.5 h-3.5" />
                  <span>
                    Last Telemetry: {new Date(shelf.lastUpdated || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <span>Device ID: {shelf.deviceId || 'ESP32_01'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Shelf Image Audit Modal */}
      {scannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-100 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <FiCamera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    AI Shelf Image Scanner & Mismatch Detector
                  </h3>
                  <p className="text-xs text-blue-400 font-bold">
                    Target: {selectedShelf} ({selectedShelf === 'Shelf A' ? 'tea powder' : 'books'})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href="http://localhost:5050"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                >
                  <FiExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vision Studio</span>
                </a>
                <button
                  onClick={() => setScannerModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Target Shelf Switcher */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-medium">Switch Shelf:</span>
              <button
                onClick={() => setSelectedShelf('Shelf A')}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  selectedShelf === 'Shelf A'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Shelf A (tea powder)
              </button>
              <button
                onClick={() => setSelectedShelf('Shelf B')}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  selectedShelf === 'Shelf B'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Shelf B (books)
              </button>
            </div>

            {/* Upload Zone & 1-Click Presets */}
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-950/40 space-y-2">
                <FiUploadCloud className="w-8 h-8 text-blue-400 mx-auto" />
                <p className="font-bold text-xs text-slate-200">
                  Select a photo of {selectedShelf} to detect misplaced products
                </p>
                <div className="flex justify-center pt-1">
                  <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow">
                    Choose Image File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScanFile}
                    />
                  </label>
                </div>
              </div>

              {/* 1-Click Demo Buttons */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 text-[11px] self-center">Or test with ready image:</span>
                <button
                  disabled={scanning}
                  onClick={() => handlePresetScan('mismatch')}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold transition flex items-center space-x-1"
                >
                  <span>🚨</span>
                  <span>Test Misplaced Item Image</span>
                </button>
                <button
                  disabled={scanning}
                  onClick={() => handlePresetScan('clean')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition flex items-center space-x-1"
                >
                  <span>✅</span>
                  <span>Test Clean Shelf Image</span>
                </button>
                <button
                  disabled={scanning}
                  onClick={() => handlePresetScan('foreign')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition flex items-center space-x-1"
                >
                  <span>🥤</span>
                  <span>Test Foreign Item (Cola)</span>
                </button>
              </div>
            </div>

            {/* Scanning Spinner */}
            {scanning && (
              <div className="p-6 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-blue-300">
                  Scanning image with Vision AI & checking shelf planogram...
                </p>
              </div>
            )}

            {/* Results Display */}
            {scanResult && !scanning && (
              <div className="space-y-4 pt-2">
                {/* Alert Banner */}
                {scanResult.hasMismatch ? (
                  <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/60 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🚨</span>
                        <h4 className="font-extrabold text-sm text-red-300">
                          {scanResult.mismatchCount || scanResult.mismatches?.length || 1} Mismatched Product{(scanResult.mismatchCount || scanResult.mismatches?.length || 1) === 1 ? '' : 's'} Found on {scanResult.shelf}!
                        </h4>
                      </div>
                      <button
                        onClick={() => handleResolveMismatch(scanResult.shelf)}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                      >
                        Resolve & Re-shelve
                      </button>
                    </div>

                    <p className="text-xs text-slate-300">
                      Main Product on Shelf: <strong className="text-amber-300">{scanResult.dominantColor || scanResult.expectedProduct}</strong> ({scanResult.mainProductCount || scanResult.correctCount || 0} units)
                    </p>

                    {scanResult.mismatches && scanResult.mismatches.length > 0 && (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {scanResult.mismatches.map((m, mIdx) => (
                          <div key={mIdx} className="text-xs space-y-0.5 bg-black/50 p-2 rounded-xl border border-red-500/30">
                            <p className="font-bold text-red-200">
                              Misplaced: '{m.detectedItem || m.colorName || m.color}' in {m.slot}
                            </p>
                            <p className="text-[11px] text-blue-300 font-bold">
                              👉 Rightful Location: {m.rightfulShelf || 'Returns / Designated Shelf'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-emerald-400 font-medium pt-1">
                      ✓ Dispatched to Inventory Notification Center & Telemetry!
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-white flex items-center space-x-3">
                    <span className="text-xl">✅</span>
                    <div>
                      <h4 className="font-bold text-sm text-emerald-300">
                        Shelf Planogram Verified: 100% Correct Products
                      </h4>
                      <p className="text-xs text-slate-300">
                        All items match the designated product ({scanResult.expectedProduct}). No misplaced items found.
                      </p>
                    </div>
                  </div>
                )}

                {/* Annotated Image */}
                {scanResult.annotatedImage && (
                  <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black flex justify-center">
                    <img
                      src={scanResult.annotatedImage}
                      alt="Annotated Shelf"
                      className="max-h-64 object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-500">
                AI Vision + Planogram Verification Engine
              </span>
              <button
                onClick={() => setScannerModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
              >
                Close Scanner
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ShelfMonitorPage;

