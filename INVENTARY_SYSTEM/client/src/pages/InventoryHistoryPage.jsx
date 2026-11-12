import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  FiClock,
  FiSearch,
  FiDownload,
  FiFilter,
  FiRefreshCw,
} from 'react-icons/fi';

const InventoryHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [shelfFilter, setShelfFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/inventory-history', {
        params: { action: actionFilter, shelf: shelfFilter, search, page, limit: 10 },
      });
      setHistory(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [actionFilter, shelfFilter, search, page]);

  const handleExportExcel = async () => {
    try {
      const res = await API.get('/inventory-history/export', {
        params: { action: actionFilter, shelf: shelfFilter },
      });
      const downloadUrl = res.data.downloadUrl;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      alert('Export failed');
    }
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'Billing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'Restock':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Calibration':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
      case 'Inventory Verification':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Inventory Audit Trail & History Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete Traceability: Billing, Restock, Calibration, Manual Adjustments, Discrepancies & ESP32 Telemetry
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all w-fit"
        >
          <FiDownload className="w-4 h-4" />
          <span>Export History to Excel</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="Billing">Billing (POS Sale)</option>
            <option value="Restock">Restock</option>
            <option value="Calibration">Calibration</option>
            <option value="Manual Adjustment">Manual Adjustment</option>
            <option value="Inventory Verification">Inventory Verification Alert</option>
            <option value="ESP32 Update">ESP32 Telemetry Update</option>
          </select>

          <select
            value={shelfFilter}
            onChange={(e) => setShelfFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="">All Shelves</option>
            <option value="Shelf A">Shelf A</option>
            <option value="Shelf B">Shelf B</option>
          </select>
        </div>

        <button
          onClick={fetchHistory}
          className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Refresh Audit Trail"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* History Audit Log Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs font-extrabold uppercase border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Shelf</th>
                <th className="py-3.5 px-4">Weight Transition</th>
                <th className="py-3.5 px-4">Stock Transition</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Reason / Remarks</th>
                <th className="py-3.5 px-4">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No history log records match the current filter.
                  </td>
                </tr>
              ) : (
                history.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {log.product?.name || 'Unknown Product'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{log.shelf}</td>
                    <td className="py-3 px-4 font-mono">
                      {log.previousWeight}g → <strong className="text-slate-900 dark:text-white">{log.currentWeight}g</strong>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {log.previousStock} → <strong className="text-blue-600">{log.currentStock} units</strong>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.reason} {log.remarks ? `(${log.remarks})` : ''}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-500">
                      {log.user?.name || 'System ESP32'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistoryPage;
