import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiBox,
  FiMaximize,
  FiCpu,
  FiClock,
} from 'react-icons/fi';

const BottomNav = () => {
  const navItems = [
    { name: 'Home', path: '/dashboard', icon: FiGrid },
    { name: 'Products', path: '/products', icon: FiBox },
    { name: 'Scan Bill', path: '/billing', icon: FiMaximize },
    { name: 'Shelves', path: '/shelf-monitor', icon: FiCpu },
    { name: 'History', path: '/inventory-history', icon: FiClock },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-slate-200 dark:border-slate-800 py-2 px-4 z-40 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
