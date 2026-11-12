import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { FiTrendingUp, FiCpu, FiCheckCircle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ForecastPage = () => {
  const [forecasts, setForecasts] = useState([]);
  const [period, setPeriod] = useState('Weekly');
  const [loading, setLoading] = useState(true);

  const fetchForecast = async () => {
    try {
      const res = await API.get('/forecast', { params: { period } });
      setForecasts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [period]);

  const chartData = forecasts.map((f) => ({
    name: f.product?.name || 'Product',
    CurrentStock: f.product?.stock || 0,
    PredictedDemand: f.predictedDemandUnits || 0,
    Confidence: f.confidenceScore || 90,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            AI Demand Forecasting & Predictive Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Machine Learning Demand Predictions using Prophet, Scikit-Learn & Seasonal Pattern Detection
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-950 px-3 py-1.5 rounded-2xl border border-purple-200 text-purple-700 dark:text-purple-300 font-bold text-xs">
          <FiCpu className="w-4 h-4 text-purple-600 animate-pulse" />
          <span>Python AI Microservice Active</span>
        </div>
      </div>

      {/* Period Selection */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          {['Daily', 'Weekly', 'Monthly', 'Seasonal'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                period === p
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {p} Forecast
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Comparison Chart */}
      <div className="glass-card p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">
          Current Stock vs AI Predicted Demand Units
        </h3>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="CurrentStock" fill="#2563EB" radius={[6, 6, 0, 0]} />
              <Bar dataKey="PredictedDemand" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs font-extrabold uppercase border-b">
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">AI Predicted Demand</th>
                <th className="py-3.5 px-4">Confidence Score</th>
                <th className="py-3.5 px-4">Seasonal Pattern</th>
                <th className="py-3.5 px-4">Reorder Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {forecasts.map((f, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {f.product?.name}
                  </td>
                  <td className="py-3 px-4 font-bold">{f.product?.stock} units</td>
                  <td className="py-3 px-4 font-bold text-purple-600 dark:text-purple-400">
                    {f.predictedDemandUnits} units
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                      {f.confidenceScore}% Confidence
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                    {f.seasonalFactor}
                  </td>
                  <td className="py-3 px-4 font-bold text-blue-600">
                    +{f.reorderRecommendation} units
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
