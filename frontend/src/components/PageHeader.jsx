import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const PageHeader = ({
  icon: Icon,
  badge,
  title,
  description,
  breadcrumbs,
  actions,
  meta = [],
}) => {
  return (
    <div className="app-card p-5 sm:p-6 md:p-7 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/50 dark:ring-slate-900/60" style={{
              background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))'
            }}>
              {Icon && <Icon className="w-5 h-5 text-white" />}
              {!Icon && <span className="text-white font-semibold">KH</span>}
            </div>
            <div className="space-y-1">
              {breadcrumbs?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.label}>
                      <span className="truncate" title={crumb.label}>{crumb.label}</span>
                      {index !== breadcrumbs.length - 1 && <ChevronRightIcon className="w-3.5 h-3.5 opacity-60" />}
                    </React.Fragment>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h1>
                {badge && (
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{
                    backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, rgba(255,255,255,0.94))',
                    color: 'var(--theme-primary)',
                    border: '1px solid color-mix(in srgb, var(--theme-primary) 15%, var(--border-primary))'
                  }}>
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
              {actions}
            </div>
          )}
        </div>

        {meta.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {meta.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border px-3 py-2 sm:px-4 sm:py-3 bg-white/60 dark:bg-slate-900/60"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  {item.label}
                </p>
                <p className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
