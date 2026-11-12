import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import BrandLogo from '../common/BrandLogo';
import {
  FiGrid,
  FiBox,
  FiMaximize,
  FiCpu,
  FiClock,
  FiBell,
  FiUsers,
  FiTrendingUp,
  FiShoppingCart,
  FiFileText,
  FiSettings,
} from 'react-icons/fi';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
    { name: 'Products', path: '/products', icon: FiBox },
    { name: 'Barcode Billing', path: '/billing', icon: FiMaximize },
    { name: 'Smart Shelf Monitor', path: '/shelf-monitor', icon: FiCpu },
    { name: 'Inventory History', path: '/inventory-history', icon: FiClock },
    { name: 'Notifications', path: '/notifications', icon: FiBell },
    { name: 'Suppliers', path: '/suppliers', icon: FiUsers },
    { name: 'AI Forecast', path: '/forecast', icon: FiTrendingUp },
    { name: 'Procurement', path: '/procurement', icon: FiShoppingCart },
    { name: 'Reports', path: '/reports', icon: FiFileText },
    { name: 'Settings', path: '/settings', icon: FiSettings, roles: ['Admin'] },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 glass-card border-r border-slate-200/80 dark:border-slate-800/80 min-h-screen p-4 sticky top-0 transition-colors duration-200 z-20">
      {/* Professional Brand Logo */}
      <div className="px-2 py-3 mb-6 border-b border-slate-200/60 dark:border-slate-800/60 pb-5">
        <BrandLogo subtitle="Enterprise Shelf OS" />
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          if (item.roles && !item.roles.includes(user?.role)) {
            return null;
          }
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Telemetry Hardware Footer */}
      <div className="mt-auto pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="bg-slate-50/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
              <span>HX711 Dual Shelves</span>
            </span>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              ±10g
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Active Load Cells: Shelf A & B
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
