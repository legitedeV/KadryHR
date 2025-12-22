import React from 'react';

const StatCard = ({ label, value, hint }) => (
  <div className="bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 hover:-translate-y-1 p-6">
    <div className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-2">{label}</div>
    <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{value}</div>
    {hint && <div className="text-xs text-slate-500 mt-2">{hint}</div>}
  </div>
);

export default StatCard;
