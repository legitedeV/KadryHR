import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';

const OvertimePolicyManager = () => {
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState({ type: null, message: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    dailyLimit: 2,
    weeklyLimit: 10,
    monthlyLimit: 40,
    rates: {
      standard: 1.5,
      weekend: 2.0,
      holiday: 2.5,
      nightShift: 1.75
    },
    approvalRequired: true,
    autoApproveThreshold: 2,
    approvers: [],
    budgetLimit: '',
    budgetPeriod: 'monthly',
    alertThreshold: 80,
    notifyOnRequest: true,
    notifyOnApproval: true,
    notifyOnBudgetAlert: true,
    isActive: true
  });

  const [approverInput, setApproverInput] = useState('');

  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['overtime-policies'],
    queryFn: async () => {
      const { data } = await api.get('/overtime-policies');
      return data.policies || [];
    },
  });

  const createPolicy = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/overtime-policies', payload);
      return data.policy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['overtime-policies']);
      setAlert({ type: 'success', message: 'Polityka nadgodzin utworzona pomyślnie.' });
      resetForm();
      setModalOpen(false);
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się utworzyć polityki.' }),
  });

  const updatePolicy = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/overtime-policies/${id}`, payload);
      return data.policy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['overtime-policies']);
      setAlert({ type: 'success', message: 'Polityka nadgodzin zaktualizowana pomyślnie.' });
      resetForm();
      setModalOpen(false);
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się zaktualizować polityki.' }),
  });

  const deletePolicy = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/overtime-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['overtime-policies']);
      setAlert({ type: 'success', message: 'Polityka nadgodzin usunięta pomyślnie.' });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się usunąć polityki.' }),
  });

  const resetForm = () => {
    setFormState({
      name: '',
      description: '',
      dailyLimit: 2,
      weeklyLimit: 10,
      monthlyLimit: 40,
      rates: {
        standard: 1.5,
        weekend: 2.0,
        holiday: 2.5,
        nightShift: 1.75
      },
      approvalRequired: true,
      autoApproveThreshold: 2,
      approvers: [],
      budgetLimit: '',
      budgetPeriod: 'monthly',
      alertThreshold: 80,
      notifyOnRequest: true,
      notifyOnApproval: true,
      notifyOnBudgetAlert: true,
      isActive: true
    });
    setEditingPolicy(null);
    setApproverInput('');
  };

  const openModal = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormState({
        name: policy.name || '',
        description: policy.description || '',
        dailyLimit: policy.dailyLimit || 2,
        weeklyLimit: policy.weeklyLimit || 10,
        monthlyLimit: policy.monthlyLimit || 40,
        rates: policy.rates || {
          standard: 1.5,
          weekend: 2.0,
          holiday: 2.5,
          nightShift: 1.75
        },
        approvalRequired: policy.approvalRequired !== undefined ? policy.approvalRequired : true,
        autoApproveThreshold: policy.autoApproveThreshold || 2,
        approvers: policy.approvers || [],
        budgetLimit: policy.budgetLimit || '',
        budgetPeriod: policy.budgetPeriod || 'monthly',
        alertThreshold: policy.alertThreshold || 80,
        notifyOnRequest: policy.notifyOnRequest !== undefined ? policy.notifyOnRequest : true,
        notifyOnApproval: policy.notifyOnApproval !== undefined ? policy.notifyOnApproval : true,
        notifyOnBudgetAlert: policy.notifyOnBudgetAlert !== undefined ? policy.notifyOnBudgetAlert : true,
        isActive: policy.isActive !== undefined ? policy.isActive : true
      });
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formState.name) {
      setAlert({ type: 'error', message: 'Nazwa polityki jest wymagana.' });
      return;
    }

    const payload = {
      ...formState,
      budgetLimit: formState.budgetLimit ? Number(formState.budgetLimit) : undefined,
    };

    if (editingPolicy) {
      updatePolicy.mutate({ id: editingPolicy._id, ...payload });
    } else {
      createPolicy.mutate(payload);
    }
  };

  const handleAddApprover = () => {
    if (approverInput.trim() && !formState.approvers.includes(approverInput.trim())) {
      setFormState(prev => ({
        ...prev,
        approvers: [...prev.approvers, approverInput.trim()]
      }));
      setApproverInput('');
    }
  };

  const handleRemoveApprover = (approver) => {
    setFormState(prev => ({
      ...prev,
      approvers: prev.approvers.filter(a => a !== approver)
    }));
  };

  const policies = policiesData || [];

  return (
    <div className="space-y-4">
      <div className="app-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Polityki nadgodzin</h1>
            <p className="text-sm text-slate-600">Zarządzaj politykami nadgodzin, stawkami i zatwierdzeniami</p>
          </div>
          <button
            onClick={() => openModal()}
            className="rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md"
          >
            + Nowa polityka
          </button>
        </div>

        {alert.message && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: null, message: null })} />
        )}

        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Ładowanie polityk...</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Brak polityk nadgodzin. Utwórz pierwszą politykę.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {policies.map((policy) => (
              <div
                key={policy._id}
                className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-slate-900">{policy.name}</h3>
                      {!policy.isActive && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                          Nieaktywna
                        </span>
                      )}
                    </div>
                    {policy.description && (
                      <p className="text-xs text-slate-600">{policy.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Limits */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-900 mb-2">Limity nadgodzin</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-blue-700 font-semibold">Dziennie:</span>
                        <span className="text-blue-900 ml-1">{policy.dailyLimit}h</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-semibold">Tydzień:</span>
                        <span className="text-blue-900 ml-1">{policy.weeklyLimit}h</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-semibold">Miesiąc:</span>
                        <span className="text-blue-900 ml-1">{policy.monthlyLimit}h</span>
                      </div>
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-green-900 mb-2">Stawki nadgodzin</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-green-700">Standard:</span>
                        <span className="text-green-900 ml-1 font-semibold">{policy.rates?.standard || 1.5}x</span>
                      </div>
                      <div>
                        <span className="text-green-700">Weekend:</span>
                        <span className="text-green-900 ml-1 font-semibold">{policy.rates?.weekend || 2.0}x</span>
                      </div>
                      <div>
                        <span className="text-green-700">Święta:</span>
                        <span className="text-green-900 ml-1 font-semibold">{policy.rates?.holiday || 2.5}x</span>
                      </div>
                      <div>
                        <span className="text-green-700">Nocna:</span>
                        <span className="text-green-900 ml-1 font-semibold">{policy.rates?.nightShift || 1.75}x</span>
                      </div>
                    </div>
                  </div>

                  {/* Approval */}
                  <div className="bg-amber-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-amber-900 mb-2">Zatwierdzenia</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${policy.approvalRequired ? 'bg-amber-600' : 'bg-slate-400'}`} />
                        <span className="text-amber-900">
                          {policy.approvalRequired ? 'Wymagane zatwierdzenie' : 'Brak wymagania zatwierdzenia'}
                        </span>
                      </div>
                      {policy.approvalRequired && policy.autoApproveThreshold && (
                        <div className="text-amber-700">
                          Auto-zatwierdzanie do {policy.autoApproveThreshold}h
                        </div>
                      )}
                      {policy.approvers && policy.approvers.length > 0 && (
                        <div className="text-amber-700">
                          Zatwierdzający: {policy.approvers.length}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Budget */}
                  {policy.budgetLimit && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-purple-900 mb-2">Budżet</h4>
                      <div className="text-xs text-purple-900">
                        <span className="font-semibold">{policy.budgetLimit} PLN</span>
                        <span className="text-purple-700 ml-1">/ {policy.budgetPeriod === 'monthly' ? 'miesiąc' : policy.budgetPeriod === 'weekly' ? 'tydzień' : 'rok'}</span>
                      </div>
                      <div className="text-xs text-purple-700 mt-1">
                        Alert przy {policy.alertThreshold}% budżetu
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 mt-3 border-t border-slate-200">
                  <button
                    onClick={() => openModal(policy)}
                    className="flex-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Czy na pewno chcesz usunąć tę politykę?')) {
                        deletePolicy.mutate(policy._id);
                      }
                    }}
                    className="flex-1 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingPolicy ? 'Edytuj politykę nadgodzin' : 'Nowa polityka nadgodzin'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Podstawowe informacje</h4>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Nazwa polityki *</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                    placeholder="np. Polityka standardowa"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Opis</label>
                  <textarea
                    value={formState.description}
                    onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                    rows="2"
                    placeholder="Opcjonalny opis polityki"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.isActive}
                      onChange={(e) => setFormState(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    Polityka aktywna
                  </label>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Limity nadgodzin</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Limit dzienny (h)</label>
                    <input
                      type="number"
                      value={formState.dailyLimit}
                      onChange={(e) => setFormState(prev => ({ ...prev, dailyLimit: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Limit tygodniowy (h)</label>
                    <input
                      type="number"
                      value={formState.weeklyLimit}
                      onChange={(e) => setFormState(prev => ({ ...prev, weeklyLimit: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Limit miesięczny (h)</label>
                    <input
                      type="number"
                      value={formState.monthlyLimit}
                      onChange={(e) => setFormState(prev => ({ ...prev, monthlyLimit: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Rates */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Stawki nadgodzin (mnożnik)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Stawka standardowa</label>
                    <input
                      type="number"
                      value={formState.rates.standard}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        rates: { ...prev.rates, standard: Number(e.target.value) }
                      }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Stawka weekendowa</label>
                    <input
                      type="number"
                      value={formState.rates.weekend}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        rates: { ...prev.rates, weekend: Number(e.target.value) }
                      }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Stawka świąteczna</label>
                    <input
                      type="number"
                      value={formState.rates.holiday}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        rates: { ...prev.rates, holiday: Number(e.target.value) }
                      }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Stawka nocna</label>
                    <input
                      type="number"
                      value={formState.rates.nightShift}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        rates: { ...prev.rates, nightShift: Number(e.target.value) }
                      }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="1"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Approval Workflow */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Przepływ zatwierdzeń</h4>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.approvalRequired}
                      onChange={(e) => setFormState(prev => ({ ...prev, approvalRequired: e.target.checked }))}
                      className="rounded"
                    />
                    Wymagaj zatwierdzenia nadgodzin
                  </label>
                </div>
                {formState.approvalRequired && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Próg auto-zatwierdzania (h)</label>
                      <input
                        type="number"
                        value={formState.autoApproveThreshold}
                        onChange={(e) => setFormState(prev => ({ ...prev, autoApproveThreshold: Number(e.target.value) }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                        min="0"
                        step="0.5"
                      />
                      <p className="text-xs text-slate-500 mt-1">Nadgodziny poniżej tego progu będą automatycznie zatwierdzane</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Zatwierdzający (ID użytkowników)</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          value={approverInput}
                          onChange={(e) => setApproverInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddApprover())}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                          placeholder="ID użytkownika"
                        />
                        <button
                          onClick={handleAddApprover}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Dodaj
                        </button>
                      </div>
                      {formState.approvers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formState.approvers.map((approver, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                              {approver}
                              <button onClick={() => handleRemoveApprover(approver)} className="hover:text-blue-900">✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Budget Management */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Zarządzanie budżetem</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Limit budżetu (PLN)</label>
                    <input
                      type="number"
                      value={formState.budgetLimit}
                      onChange={(e) => setFormState(prev => ({ ...prev, budgetLimit: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="0"
                      placeholder="Opcjonalne"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Okres budżetu</label>
                    <select
                      value={formState.budgetPeriod}
                      onChange={(e) => setFormState(prev => ({ ...prev, budgetPeriod: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                    >
                      <option value="weekly">Tygodniowy</option>
                      <option value="monthly">Miesięczny</option>
                      <option value="yearly">Roczny</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Próg alertu (%)</label>
                    <input
                      type="number"
                      value={formState.alertThreshold}
                      onChange={(e) => setFormState(prev => ({ ...prev, alertThreshold: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Powiadomienia</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.notifyOnRequest}
                      onChange={(e) => setFormState(prev => ({ ...prev, notifyOnRequest: e.target.checked }))}
                      className="rounded"
                    />
                    Powiadamiaj przy nowym wniosku o nadgodziny
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.notifyOnApproval}
                      onChange={(e) => setFormState(prev => ({ ...prev, notifyOnApproval: e.target.checked }))}
                      className="rounded"
                    />
                    Powiadamiaj przy zatwierdzeniu/odrzuceniu
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.notifyOnBudgetAlert}
                      onChange={(e) => setFormState(prev => ({ ...prev, notifyOnBudgetAlert: e.target.checked }))}
                      className="rounded"
                    />
                    Powiadamiaj przy przekroczeniu progu budżetu
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                Anuluj
              </button>
              <button
                onClick={handleSave}
                disabled={createPolicy.isLoading || updatePolicy.isLoading}
                className="rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-60"
              >
                {editingPolicy ? 'Zapisz zmiany' : 'Utwórz politykę'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OvertimePolicyManager;
