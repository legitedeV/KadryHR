import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { GiftIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';

const Benefits = () => {
  const { data: benefitsData, isLoading } = useQuery({
    queryKey: ['benefits'],
    queryFn: async () => {
      const { data } = await api.get('/benefits');
      return data.benefits || [];
    },
  });

  const benefits = benefitsData || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GiftIcon}
        title="Benefity pracownicze"
        description="Zarządzaj benefitami i świadczeniami dla pracowników"
        breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Benefity' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map((benefit) => (
          <div key={benefit._id} className="app-card p-6">
            <h3 className="font-semibold text-lg mb-2">{benefit.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{benefit.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {benefit.category}
              </span>
              <span className="text-sm font-medium">{benefit.cost?.employeeMonthly || 0} PLN/mies</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Benefits;
