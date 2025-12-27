import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicCapIcon, PlayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';

const Training = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const canManage = hasPermission('training.manage') || user?.role === 'admin';

  const { data: trainingsData, isLoading } = useQuery({
    queryKey: ['trainings'],
    queryFn: async () => {
      const { data } = await api.get('/training');
      return data.trainings || [];
    },
  });

  const { data: myTrainingsData } = useQuery({
    queryKey: ['my-trainings'],
    queryFn: async () => {
      const { data } = await api.get('/training/my');
      return data.enrollments || [];
    },
  });

  const trainings = trainingsData || [];
  const myTrainings = myTrainingsData || [];

  const getStatusBadge = (status) => {
    const badges = {
      not_started: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      expired: 'bg-yellow-100 text-yellow-700',
    };
    return badges[status] || badges.not_started;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={AcademicCapIcon}
        title="Szkolenia i rozwój"
        description="Zarządzaj szkoleniami i rozwojem kompetencji pracowników"
        breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Szkolenia' }]}
      />

      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Wszystkie szkolenia</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {trainings.length}
          </div>
        </div>
        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Moje szkolenia</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {myTrainings.length}
          </div>
        </div>
        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Ukończone</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {myTrainings.filter((t) => t.status === 'completed').length}
          </div>
        </div>
      </div>

      <div className="app-card">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Dostępne szkolenia</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainings.map((training) => (
            <div key={training._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{training.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{training.description}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {training.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {training.duration} {training.durationUnit}
                </span>
                {training.isRequired && (
                  <span className="text-red-600 font-medium">Wymagane</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {myTrainings.length > 0 && (
        <div className="app-card">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold">Moje szkolenia</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Szkolenie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Postęp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Wynik
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {myTrainings.map((enrollment) => (
                  <tr key={enrollment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4">
                      <div className="font-medium">{enrollment.training?.title}</div>
                      <div className="text-sm text-slate-500">{enrollment.training?.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${enrollment.progress}%`,
                            background: 'linear-gradient(90deg, var(--theme-primary), var(--theme-secondary))',
                          }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{enrollment.progress}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {enrollment.bestScore > 0 ? `${enrollment.bestScore}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
