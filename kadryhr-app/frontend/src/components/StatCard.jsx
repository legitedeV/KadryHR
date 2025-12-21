import React from 'react';

const StatCard = ({ label, value, hint }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
    <div className="text-xs text-slate-500 mb-1">{label}</div>
    <div className="text-xl font-semibold text-slate-800">{value}</div>
    {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
  </div>
);

export default StatCard;
