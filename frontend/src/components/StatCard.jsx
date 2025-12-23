import React from 'react';

const StatCard = ({ label, value, hint }) => (
  <div 
    className="bg-white rounded-2xl border border-theme-light shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6"
    style={{
      '--hover-shadow': '0 10px 15px -3px color-mix(in srgb, var(--theme-primary) 10%, transparent)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 10px 15px -3px color-mix(in srgb, var(--theme-primary) 10%, transparent), 0 4px 6px -4px color-mix(in srgb, var(--theme-primary) 10%, transparent)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '';
    }}
  >
    <div className="text-xs font-semibold text-theme-primary uppercase tracking-wide mb-2">{label}</div>
    <div className="text-3xl font-bold text-theme-gradient">{value}</div>
    {hint && <div className="text-xs text-slate-500 mt-2">{hint}</div>}
  </div>
);

export default StatCard;
