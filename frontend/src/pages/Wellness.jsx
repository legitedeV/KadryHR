import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeartIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';

const Wellness = () => {
  const { data: programsData, isLoading } = useQuery({
    queryKey: ['wellness'],
    queryFn: async () => {
      const { data } = await api.get('/wellness');
      return data.programs || [];
    },
  });

  const programs = programsData || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={HeartIcon}
        title="Programy Wellness"
        description="Dbaj o zdrowie i dobre samopoczucie pracowników"
        breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Wellness' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.map((program) => (
          <div key={program._id} className="app-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{program.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{program.description}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                {program.category}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Uczestnicy: {program.participants?.length || 0}</span>
              {program.isActive && (
                <span className="text-green-600 font-medium">Aktywny</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wellness;
