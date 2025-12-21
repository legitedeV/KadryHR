import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get('/employees/summary');
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
        <p className="text-xs text-slate-500">
          Podsumowanie kadrowo-płacowe oraz statystyki czasu pracy.
        </p>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Ładowanie...</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Nie udało się załadować danych dashboardu
        </p>
      )}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Pracownicy ogółem"
            value={data.totalEmployees}
            hint="Łączna liczba pracowników"
          />
          <StatCard
            label="Aktywni pracownicy"
            value={data.activeEmployees}
            hint="Obecnie zatrudnieni"
          />
          <StatCard
            label="Miesięczne wynagrodzenia (PLN)"
            value={data.totalPayrollAmount.toLocaleString('pl-PL')}
            hint="Szacowana suma brutto"
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
