import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const AllLeaves = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves', 'all', selectedStatus],
    queryFn: async () => {
      const params = selectedStatus !== 'all' ? { status: selectedStatus } : {};
      const { data } = await api.get('/leaves', { params });
      return data;
    },
  });

  const { data: sickLeavesData, isLoading: sickLoading } = useQuery({
    queryKey: ['sick-leaves', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/sick-leaves');
      return data;
    },
    enabled: isAdmin,
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Zatwierdzony';
      case 'pending':
        return 'Oczekuje';
      case 'rejected':
        return 'Odrzucony';
      default:
        return status || 'Brak statusu';
    }
  };

  const leaveTypeLabel = (type) => {
    switch (type) {
      case 'annual':
        return 'Urlop wypoczynkowy';
      case 'on_demand':
        return 'Urlop na żądanie';
      case 'unpaid':
        return 'Urlop bezpłatny';
      case 'occasional':
        return 'Urlop okolicznościowy';
      default:
        return 'Urlop';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="app-card p-6">
        <div className="flex items-center gap-3">
          <div 
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Urlopy i L4
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isAdmin ? 'Wszystkie wnioski urlopowe i zwolnienia lekarskie' : 'Moje wnioski urlopowe'}
            </p>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="app-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtruj:</span>
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {status === 'all' ? 'Wszystkie' : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Leaves List */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Wnioski urlopowe
        </h2>
        {leavesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                 style={{ borderColor: 'var(--theme-primary)' }}></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie...</p>
          </div>
        ) : leavesData && leavesData.length > 0 ? (
          <div className="space-y-3">
            {leavesData.map((leave) => (
              <div 
                key={leave._id}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-slate-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(leave.status)}`}>
                        {getStatusLabel(leave.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {leaveTypeLabel(leave.type)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </p>
                    {leave.reason && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Powód: {leave.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p>Brak wniosków urlopowych</p>
          </div>
        )}
      </div>

      {/* Sick Leaves List (Admin only) */}
      {isAdmin && (
        <div className="app-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Zwolnienia lekarskie (L4)
          </h2>
          {sickLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                   style={{ borderColor: 'var(--theme-primary)' }}></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie...</p>
            </div>
          ) : sickLeavesData && sickLeavesData.length > 0 ? (
            <div className="space-y-3">
              {sickLeavesData.map((sick) => (
                <div 
                  key={sick._id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-slate-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {sick.employee?.firstName} {sick.employee?.lastName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Zwolnienie lekarskie
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(sick.startDate)} - {formatDate(sick.endDate)}
                      </p>
                      {sick.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                          Notatki: {sick.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>Brak zwolnień lekarskich</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllLeaves;
