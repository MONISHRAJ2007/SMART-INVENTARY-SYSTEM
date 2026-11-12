import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { SocketContext } from '../contexts/SocketContext';
import {
  FiDollarSign,
  FiShoppingBag,
  FiBox,
  FiAlertTriangle,
  FiCheckCircle,
  FiCpu,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [esp32Online, setEsp32Online] = useState(true);
  const socket = useContext(SocketContext);

  const fetchDashboard = async () => {
    try {
      const res = await API.get('/dashboard');
      setData(res.data);
      if (res.data?.esp32Online !== undefined) {
        setEsp32Online(res.data.esp32Online);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleEsp32Status = (status) => {
      if (status?.online !== undefined) {
        setEsp32Online(status.online);
      }
    };

    socket.on('dashboard:update', fetchDashboard);
    socket.on('shelf:update', fetchDashboard);
    socket.on('esp32:status', handleEsp32Status);

    return () => {
      socket.off('dashboard:update');
      socket.off('shelf:update');
      socket.off('esp32:status', handleEsp32Status);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const { metrics, charts, recentBilling, recentAlerts, shelfStatus } = data || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            SaaS Overview Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime Analytics, ESP32 Load Cell Telemetry & AI Sales Predictions
          </p>
        </div>

        {/* Live ESP32 Badge */}
        <div
          className={`flex items-center space-x-2 border px-3 py-1.5 rounded-2xl text-xs font-bold w-fit transition-colors duration-200 ${
            esp32Online
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
          }`}
        >
          <FiCpu className={`w-4 h-4 ${esp32Online ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
          <span>{esp32Online ? 'ESP32 Online' : 'ESP32 Offline'}</span>
        </div>
      </div>

      {/* 6 Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Today Sales */}
        <div className="glass-card p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Today Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <FiShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {metrics?.todaySales || 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            ↑ Bills Generated Today
          </span>
        </div>

        {/* Today Revenue */}
        <div className="glass-card p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            ₹{metrics?.todayRevenue?.toLocaleString() || 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            Total POS Income
          </span>
        </div>

        {/* Inventory Value */}
        <div className="glass-card p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Stock Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
              <FiBox className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            ₹{metrics?.currentInventoryValue?.toLocaleString() || 0}
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">
            Asset Inventory
          </span>
        </div>

        {/* Total Products */}
        <div className="glass-card p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total SKU
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
              <FiBox className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {metrics?.totalProducts || 0}
          </p>
          <span className="text-[10px] text-purple-600 font-semibold mt-1 block">
            Catalog Products
          </span>
        </div>

        {/* Low Stock */}
        <div className="glass-card p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Low Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
              <FiAlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
            {metrics?.lowStockCount || 0}
          </p>
          <span className="text-[10px] text-amber-600 font-semibold mt-1 block">
            Needs Reorder
          </span>
        </div>

        {/* Out of Stock */}
        <div className="glass-card p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Out of Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center">
              <FiAlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-red-600 dark:text-red-400">
            {metrics?.outOfStockCount || 0}
          </p>
          <span className="text-[10px] text-red-600 font-semibold mt-1 block">
            Critical Empty
          </span>
        </div>
      </div>

      {/* Real-time ESP32 Shelf Cards Row */}
      <div className="glass-card p-5 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FiCpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Real-Time Smart Shelf Telemetry (ESP32 + Dual HX711)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Updates dynamically via WebSockets</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shelfStatus && shelfStatus.length > 0 ? (
            shelfStatus.map((shelf) => (
              <div
                key={shelf._id}
                className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 relative"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {shelf.shelf}
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Assigned: {shelf.product ? shelf.product.name : 'Unassigned'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      shelf.status === 'OK'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : shelf.status === 'Low Stock'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {shelf.status}
                  </span>
                </div>

                {/* Progress Bar & Weight details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Weight: {shelf.actualShelfWeight} g</span>
                    <span>
                      Stock Count: <strong className="text-blue-600">{shelf.actualStock} Units</strong> (Math.floor)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        shelf.filledPercentage > 50
                          ? 'bg-emerald-500'
                          : shelf.filledPercentage > 20
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${shelf.filledPercentage || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Filled Capacity: {shelf.filledPercentage || 0}%</span>
                    <span>Verification: {shelf.discrepancyStatus || 'Verified'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400">No shelf telemetry data yet.</p>
          )}
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Revenue 7-Day Area Chart */}
        <div className="lg:col-span-2 glass-card p-5 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Revenue & Sales Trend (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-400">Daily revenue growth pattern</p>
            </div>
            <FiTrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.salesTrend || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution Category Pie Chart */}
        <div className="glass-card p-5 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
            Category Stock Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">Percentage allocation by category</p>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.stockDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts?.stockDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
