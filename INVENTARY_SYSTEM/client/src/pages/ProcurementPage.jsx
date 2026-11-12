import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { FiShoppingCart, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

const ProcurementPage = () => {
  const { user } = useContext(AuthContext);
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProcurements = async () => {
    try {
      const res = await API.get('/procurement');
      setProcurements(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurements();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await API.put(`/procurement/${id}`, { status });
      fetchProcurements();
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Intelligent Procurement & Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated Reorder Quantity, Supplier Recommendation, Cost Estimation & Stock Duration
          </p>
        </div>
      </div>

      {/* Procurements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {procurements.map((p) => (
          <div
            key={p._id}
            className="glass-card p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400">
                  Recommended Order
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                  {p.product?.name}
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                  p.priority === 'High'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {p.priority} Priority
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Supplier:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {p.supplier?.company || 'Apex Wholesalers'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Recommended Quantity:</span>
                <span className="font-bold text-blue-600">{p.recommendedQuantity} units</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Cost:</span>
                <span className="font-bold text-emerald-600">₹{p.estimatedCost}</span>
              </div>
              <div className="flex justify-between">
                <span>Stock Duration:</span>
                <span className="font-bold">{p.expectedStockDurationDays} Days</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-slate-500">Status: {p.status}</span>

              {['Admin', 'Store Manager'].includes(user?.role) && p.status === 'Pending' && (
                <button
                  onClick={() => handleUpdateStatus(p._id, 'Completed')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Approve & Restock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcurementPage;
