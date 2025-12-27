import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';

const Analytics = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-latest'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/latest');
      return data.analytics;
    },
  });

  const metrics = analyticsData?.metrics || {};

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ChartPieIcon}
        title="Analityka HR"
        description="Zaawansowane analizy i prognozy dotyczące zasobów ludzkich"
        breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Analityka' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Zatrudnienie</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {metrics.headcount?.total || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Aktywni: {metrics.headcount?.active || 0}
          </div>
        </div>

        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Rotacja</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {metrics.turnover?.rate?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Średni staż: {metrics.turnover?.avgTenure || 0} mies
          </div>
        </div>

        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Ocena wydajności</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {metrics.performance?.avgRating?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Ocen: {metrics.performance?.reviewsCompleted || 0}
          </div>
        </div>

        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Szkolenia</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {metrics.training?.completionRate || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Godzin: {metrics.training?.totalHours || 0}
          </div>
        </div>
      </div>

      <div className="app-card p-6">
        <h3 className="text-lg font-semibold mb-4">Koszty</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Całkowita płaca</div>
            <div className="text-2xl font-bold mt-1">{metrics.costs?.totalPayroll?.toLocaleString('pl-PL') || 0} PLN</div>
          </div>
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Średnia płaca</div>
            <div className="text-2xl font-bold mt-1">{metrics.costs?.avgSalary?.toLocaleString('pl-PL') || 0} PLN</div>
          </div>
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Koszt benefitów</div>
            <div className="text-2xl font-bold mt-1">{metrics.costs?.benefitsCost?.toLocaleString('pl-PL') || 0} PLN</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
