import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';

const Onboarding = () => {
  const { data: onboardingsData, isLoading } = useQuery({
    queryKey: ['onboardings'],
    queryFn: async () => {
      const { data } = await api.get('/onboarding');
      return data.onboardings || [];
    },
  });

  const onboardings = onboardingsData || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={AcademicCapIcon}
        title="Onboarding"
        description="Zarządzaj procesem wdrażania nowych pracowników"
        breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Onboarding' }]}
      />

      <div className="app-card p-6">
        <h3 className="text-lg font-semibold mb-4">Procesy wdrożenia</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Moduł onboardingu pozwala na zarządzanie procesem wdrażania nowych pracowników.
        </p>
        <div className="mt-4">
          <p className="text-sm text-slate-500">Liczba aktywnych procesów: {onboardings.length}</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
