import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { SocketContext } from '../../contexts/SocketContext';
import BrandLogo from '../common/BrandLogo';
import API from '../../services/api';
import {
  FiBell,
  FiMoon,
  FiSun,
  FiUser,
  FiLogOut,
  FiSearch,
  FiCheckCircle,
  FiTrash2,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const socket = useContext(SocketContext);

  const [notifications, setNotifications] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const [showDrawer, setShowDrawer] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [esp32Online, setEsp32Online] = useState(true);
  const [toastAlert, setToastAlert] = useState(null);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.26);
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications', {
        params: { priority: priorityFilter, search: searchQuery },
      });
      setNotifications(res.data.data);
      setUnreadCounts(res.data.unreadCounts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    API.get('/shelf').then(res => {
      if (res.data?.esp32Online !== undefined) setEsp32Online(res.data.esp32Online);
    }).catch(() => {});
  }, [priorityFilter, searchQuery]);

  useEffect(() => {
    if (!socket) return;

    const handleEsp32Status = (status) => {
      if (status?.online !== undefined) setEsp32Online(status.online);
    };

    socket.on('notification:new', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCounts((prev) => ({
        ...prev,
        total: prev.total + 1,
        [newNotif.priority]: (prev[newNotif.priority] || 0) + 1,
      }));
      setToastAlert(newNotif);
      playNotificationSound();
      setTimeout(() => {
        setToastAlert((curr) => (curr?._id === newNotif._id ? null : curr));
      }, 7000);
    });

    socket.on('esp32:status', handleEsp32Status);

    return () => {
      socket.off('notification:new');
      socket.off('esp32:status', handleEsp32Status);
    };
  }, [socket]);

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

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 border-l-4 border-l-red-600';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 border-l-4 border-l-amber-500';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 border-l-4 border-l-blue-500';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 border-l-4 border-l-slate-400';
    }
  };

  return (
    <header className="sticky top-0 z-30 glass-nav transition-colors duration-200">
      <div className="px-4 py-2.5 flex items-center justify-between">
        {/* Left Title & Status */}
        <div className="flex items-center space-x-3">
          <div className="md:hidden">
            <BrandLogo showSubtitle={false} badge="" />
          </div>

          <div
            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              esp32Online
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 shadow-sm shadow-emerald-500/5'
                : 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {esp32Online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  esp32Online ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span className="tracking-wider text-[11px] font-bold uppercase">
              {esp32Online ? 'ESP32 Online' : 'ESP32 Offline'}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Quick link to SHELF_ERROR standalone vision studio */}
          <a
            href="http://localhost:5050"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-black transition"
            title="Open AI Shelf Error & Misplaced Product Detector"
          >
            <span>📸</span>
            <span>Shelf Vision AI</span>
          </a>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Light/Dark Mode"
          >
            {darkMode ? <FiSun className="w-5 h-5 text-amber-400" /> : <FiMoon className="w-5 h-5" />}
          </button>

          {/* Gmail-Style Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowDrawer(!showDrawer)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Notifications Center"
            >
              <FiBell className="w-5 h-5" />
              {unreadCounts.total > 0 && (
                <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded-full text-white ${
                  unreadCounts.critical > 0 ? 'bg-red-600 animate-bounce' : 'bg-blue-600'
                }`}>
                  {unreadCounts.total}
                </span>
              )}
            </button>

            {/* Notification Drawer Dropdown */}
            {showDrawer && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl glass-card shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                      Notifications Center
                    </h3>
                    {unreadCounts.total > 0 && (
                      <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                        {unreadCounts.total} New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Mark All Read
                    </button>
                    <button
                      onClick={() => setShowDrawer(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Priority Filters */}
                <div className="flex items-center space-x-1 my-3 overflow-x-auto pb-1 text-xs">
                  {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                        priorityFilter === p
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      No notifications found
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-3 rounded-xl transition-all ${getPriorityBadgeClass(
                          notif.priority
                        )} ${notif.status === 'unread' ? 'font-semibold' : 'opacity-80'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs uppercase tracking-wider font-extrabold">
                                [{notif.priority}]
                              </span>
                              <h4 className="text-xs font-bold">{notif.title}</h4>
                            </div>
                            <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 font-normal">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {notif.status === 'unread' && (
                              <button
                                onClick={() => markAsRead(notif._id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded"
                                title="Mark Read"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotif(notif._id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded"
                              title="Delete"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  {user?.name || 'User'}
                </span>
                <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  {user?.role || 'Role'}
                </span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold">{user?.name}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center space-x-2 mt-1"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Realtime Floating Toast Alert for Product Mismatches & Critical Notifications */}
      {toastAlert && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl border text-white flex items-start justify-between space-x-3 backdrop-blur-xl ${
              toastAlert.priority === 'critical'
                ? 'bg-red-950/90 border-red-500 shadow-red-500/30'
                : 'bg-blue-950/90 border-blue-500 shadow-blue-500/30'
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl mt-0.5">
                {toastAlert.type === 'product_mismatch' ? '🚨' : '🔔'}
              </span>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                    {toastAlert.type === 'product_mismatch' ? 'Product Mismatch Alert' : toastAlert.priority}
                  </span>
                  <span className="text-[10px] text-slate-300">Just now</span>
                </div>
                <h4 className="font-extrabold text-sm text-white">{toastAlert.title}</h4>
                <p className="text-xs text-slate-200 line-clamp-2">{toastAlert.message}</p>
                <div className="pt-1 flex items-center space-x-3">
                  <a
                    href="/notifications"
                    className="text-xs font-bold text-amber-300 hover:underline"
                  >
                    View Alert Details →
                  </a>
                  {toastAlert.shelf && (
                    <a
                      href="/shelf-monitor"
                      className="text-xs font-bold text-blue-300 hover:underline"
                    >
                      Audit {toastAlert.shelf} →
                    </a>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setToastAlert(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
