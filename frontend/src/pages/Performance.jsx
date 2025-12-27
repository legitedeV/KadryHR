import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChartBarIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';

const Performance = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const canManage = hasPermission('performance.manage') || user?.role === 'admin';

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: async () => {
      const { data } = await api.get('/performance');
      return data.reviews || [];
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await api.get('/employees');
      return data.employees || [];
    },
    enabled: canManage,
  });

  const reviews = reviewsData || [];
  const employees = employeesData || [];

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100';
    if (rating >= 3.5) return 'text-blue-600 bg-blue-100';
    if (rating >= 2.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
      acknowledged: 'bg-green-100 text-green-700',
    };
    return badges[status] || badges.draft;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ChartBarIcon}
        title="Oceny pracownicze"
        description="Zarządzaj ocenami wydajności i rozwojem pracowników"
        breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Oceny pracownicze' }]}
        actions={
          canManage && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Nowa ocena
            </button>
          )
        }
      />

      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Wszystkie oceny</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {reviews.length}
          </div>
        </div>
        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Średnia ocena</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {reviews.length > 0
              ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
              : '0.0'}
          </div>
        </div>
        <div className="app-card p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Oczekujące</div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--theme-primary)' }}>
            {reviews.filter((r) => r.status === 'pending').length}
          </div>
        </div>
      </div>

      <div className="app-card">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Lista ocen</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pracownik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Okres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ocena
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {reviews.map((review) => (
                <tr key={review._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{review.employee?.firstName} {review.employee?.lastName}</div>
                    <div className="text-sm text-slate-500">{review.employee?.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(review.reviewPeriod.startDate).toLocaleDateString('pl-PL')} -{' '}
                    {new Date(review.reviewPeriod.endDate).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    {review.reviewType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(review.overallRating)}`}>
                      {review.overallRating.toFixed(1)} / 5.0
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(review.status)}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Szczegóły
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Performance;
