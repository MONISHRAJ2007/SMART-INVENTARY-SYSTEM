import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  FiBell,
  FiSearch,
  FiCheckCircle,
  FiTrash2,
  FiAlertTriangle,
  FiInfo,
} from 'react-icons/fi';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [priority, setPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications', {
        params: { priority, search },
      });
      setNotifications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [priority, search]);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {}
  };

  const deleteNotif = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gmail-Style Notification Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prioritized Realtime Alerts: Critical Discrepancies, Low Stock, Shelf Status & Reports
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all w-fit"
        >
          <FiCheckCircle className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Priority Filters & Search */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto text-xs">
          {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded-xl capitalize font-bold transition-all ${
                priority === p
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {p} Alerts
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search notification title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-3xl text-slate-400 text-xs">
            No notifications match your current filter criteria.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`glass-card p-4 rounded-2xl border transition-all flex items-start justify-between ${
                n.priority === 'critical'
                  ? 'border-l-4 border-l-red-600 bg-red-50/20 dark:bg-red-950/20'
                  : n.priority === 'high'
                  ? 'border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
                  : n.priority === 'medium'
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                  : 'border-l-4 border-l-slate-400'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                    {n.priority}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {n.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {n.status === 'unread' && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Read</span>
                  </button>
                )}
                <button
                  onClick={() => deleteNotif(n._id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
