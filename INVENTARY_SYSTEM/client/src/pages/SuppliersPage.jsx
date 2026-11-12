import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { FiUsers, FiPlus, FiStar, FiMail, FiPhone, FiTrash2 } from 'react-icons/fi';

const SuppliersPage = () => {
  const { user } = useContext(AuthContext);
  const [suppliers, setSuppliers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    rating: 5,
  });

  const fetchSuppliers = async () => {
    try {
      const res = await API.get('/suppliers');
      setSuppliers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await API.post('/suppliers', formData);
      setShowAddModal(false);
      fetchSuppliers();
    } catch (err) {
      alert('Error adding supplier');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete supplier?')) return;
    try {
      await API.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Supplier & Vendor Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage Wholesalers, Ratings, Lead Time & Purchase Order History
          </p>
        </div>

        {['Admin', 'Store Manager'].includes(user?.role) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all w-fit"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Grid of Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((s) => (
          <div
            key={s._id}
            className="glass-card p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 space-y-3 relative"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {s.company}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">{s.name}</p>
              </div>
              <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded-lg text-amber-600 font-bold text-xs">
                <FiStar className="w-3.5 h-3.5 fill-current" />
                <span>{s.rating || 5.0}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <FiMail className="w-4 h-4 text-slate-400" />
                <span>{s.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiPhone className="w-4 h-4 text-slate-400" />
                <span>{s.phone}</span>
              </div>
            </div>

            {['Admin'].includes(user?.role) && (
              <button
                onClick={() => handleDelete(s._id)}
                className="absolute bottom-4 right-4 text-slate-400 hover:text-red-500"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
              Add New Supplier Company
            </h3>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Contact Person Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
