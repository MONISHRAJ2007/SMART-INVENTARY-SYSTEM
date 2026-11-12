import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiSliders,
  FiCheckCircle,
  FiAlertCircle,
  FiBox,
} from 'react-icons/fi';

const ProductsPage = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [shelfFilter, setShelfFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    supplier: '',
    unitWeight: 250,
    shelfNumber: 'Shelf A',
    costPrice: 100,
    sellingPrice: 150,
    gst: 18,
    stock: 10,
    minStock: 5,
  });

  const [calibrateWeight, setCalibrateWeight] = useState(250);
  const [calibrateTolerance, setCalibrateTolerance] = useState(10);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products', {
        params: { search, category: categoryFilter, shelf: shelfFilter },
      });
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const catRes = await API.get('/categories');
      const supRes = await API.get('/suppliers');
      setCategories(catRes.data.data);
      setSuppliers(supRes.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, shelfFilter]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await API.post('/products', formData);
      setShowAddModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleCalibrate = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await API.post(`/products/${selectedProduct._id}/calibrate`, {
        measuredWeight: calibrateWeight,
        tolerance: calibrateTolerance,
      });
      alert(`Successfully calibrated '${selectedProduct.name}' unit weight to ${calibrateWeight}g!`);
      setShowCalibrateModal(false);
      fetchProducts();
    } catch (err) {
      alert('Calibration failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Product Inventory Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            CRUD Products, Barcode Scanning, Expiry & ESP32 Unit Weight Calibration
          </p>
        </div>

        {['Admin', 'Store Manager'].includes(user?.role) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all w-fit"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search product by name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={shelfFilter}
            onChange={(e) => setShelfFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Shelves</option>
            <option value="Shelf A">Shelf A</option>
            <option value="Shelf B">Shelf B</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Barcode</th>
                <th className="py-3.5 px-4">Shelf</th>
                <th className="py-3.5 px-4">Unit Weight</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Selling Price</th>
                <th className="py-3.5 px-4">Calibration Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No products found. Add your first product to get started.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                        <FiBox className="w-4 h-4" />
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {p.barcode}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-semibold text-[11px]">
                        {p.shelfNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">{p.unitWeight} g</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          p.stock <= p.minStock ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">₹{p.sellingPrice}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.calibration?.status === 'Success'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {p.calibration?.status || 'Pending'} (±{p.calibration?.tolerance || 10}g)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setCalibrateWeight(p.unitWeight);
                          setShowCalibrateModal(true);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[11px] font-bold transition-all"
                        title="Calibrate Load Cell Weight"
                      >
                        Calibrate
                      </button>

                      {['Admin'].includes(user?.role) && (
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calibration Modal */}
      {showCalibrateModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
              Automatic Unit Weight Calibration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Place <strong>1 unit</strong> of '{selectedProduct.name}' on ESP32 Load Cell and enter measured weight.
            </p>

            <form onSubmit={handleCalibrate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  ESP32 Measured Unit Weight (grams)
                </label>
                <input
                  type="number"
                  required
                  value={calibrateWeight}
                  onChange={(e) => setCalibrateWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Allowed Variance Tolerance (grams)
                </label>
                <input
                  type="number"
                  required
                  value={calibrateTolerance}
                  onChange={(e) => setCalibrateTolerance(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalibrateModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Save Calibration Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 shadow-2xl my-8">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
              Add New Product to Inventory
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                  placeholder="Bluetooth Mouse"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Barcode</label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                    placeholder="8901234567890"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Shelf Number</label>
                  <select
                    value={formData.shelfNumber}
                    onChange={(e) => setFormData({ ...formData, shelfNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                  >
                    <option value="Shelf A">Shelf A</option>
                    <option value="Shelf B">Shelf B</option>
                    <option value="Unassigned">Unassigned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Supplier</label>
                  <select
                    required
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Unit Weight (g)</label>
                  <input
                    type="number"
                    required
                    value={formData.unitWeight}
                    onChange={(e) => setFormData({ ...formData, unitWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Stock (Units)</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
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
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
