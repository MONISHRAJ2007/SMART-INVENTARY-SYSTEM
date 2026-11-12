import React from 'react';

export const BrandIcon = ({ size = 'w-10 h-10', iconSize = 'w-5 h-5' }) => (
  <div
    className={`${size} rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950 p-0.5 shadow-md shadow-blue-900/10 border border-slate-700/60 dark:border-slate-700/70 flex items-center justify-center relative overflow-hidden flex-shrink-0 group`}
  >
    {/* Ambient subtle glow */}
    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/25 via-indigo-500/10 to-transparent" />
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${iconSize} relative z-10 text-blue-400`}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 3D Isometric smart inventory cube */}
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
      {/* Shelf layer divider */}
      <path d="M7.5 9.5l4.5 2.5 4.5-2.5" strokeOpacity="0.4" strokeWidth="1.2" />
      {/* Smart IoT Sensor Node */}
      <circle cx="12" cy="12" r="1.6" fill="#38bdf8" stroke="none" />
    </svg>
  </div>
);

const BrandLogo = ({
  subtitle = 'Enterprise Shelf OS',
  badge = '',
  showSubtitle = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <BrandIcon size="w-10 h-10" iconSize="w-5 h-5" />
      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5">
          <span className="font-extrabold text-[15px] text-slate-900 dark:text-white tracking-tight leading-none">
            Smart<span className="text-blue-600 dark:text-blue-500">Inventory</span>
          </span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70 rounded-md leading-none">
              {badge}
            </span>
          )}
        </div>
        {showSubtitle && subtitle && (
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1 leading-none">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
