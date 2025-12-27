import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from './Alert';

const ShiftTemplateManager = () => {
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState({ type: null, message: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    startTime: '',
    endTime: '',
    color: '#3b82f6',
    type: 'custom',
    description: '',
    isDefault: false,
    breaks: [],
    minDuration: '',
    maxDuration: '',
    allowFlexibleHours: false,
    minStaffing: 1,
    maxStaffing: '',
    requiredSkills: [],
    requiredCertifications: [],
    locationId: '',
    departmentId: '',
    costCenter: '',
    tags: [],
    allowOvertime: true,
    overtimeThreshold: 8,
    isActive: true
  });

  const [breakForm, setBreakForm] = useState({
    startTime: '',
    duration: 30,
    isPaid: false,
    type: 'rest',
    description: ''
  });

  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['shift-templates'],
    queryFn: async () => {
      const { data } = await api.get('/shift-templates');
      return Array.isArray(data) ? data : data.templates || [];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/shift-templates', payload);
      return data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shift-templates']);
      setAlert({ type: 'success', message: 'Szablon utworzony pomyślnie.' });
      resetForm();
      setModalOpen(false);
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się utworzyć szablonu.' }),
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/shift-templates/${id}`, payload);
      return data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shift-templates']);
      setAlert({ type: 'success', message: 'Szablon zaktualizowany pomyślnie.' });
      resetForm();
      setModalOpen(false);
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się zaktualizować szablonu.' }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/shift-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shift-templates']);
      setAlert({ type: 'success', message: 'Szablon usunięty pomyślnie.' });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się usunąć szablonu.' }),
  });

  const createDefaultTemplates = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/shift-templates/default');
      return data.templates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shift-templates']);
      setAlert({ type: 'success', message: 'Domyślne szablony utworzone pomyślnie.' });
    },
    onError: (err) => setAlert({ type: 'error', message: err.response?.data?.message || 'Nie udało się utworzyć domyślnych szablonów.' }),
  });

  const resetForm = () => {
    setFormState({
      name: '',
      startTime: '',
      endTime: '',
      color: '#3b82f6',
      type: 'custom',
      description: '',
      isDefault: false,
      breaks: [],
      minDuration: '',
      maxDuration: '',
      allowFlexibleHours: false,
      minStaffing: 1,
      maxStaffing: '',
      requiredSkills: [],
      requiredCertifications: [],
      locationId: '',
      departmentId: '',
      costCenter: '',
      tags: [],
      allowOvertime: true,
      overtimeThreshold: 8,
      isActive: true
    });
    setEditingTemplate(null);
    setBreakForm({
      startTime: '',
      duration: 30,
      isPaid: false,
      type: 'rest',
      description: ''
    });
    setSkillInput('');
    setCertInput('');
    setTagInput('');
  };

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormState({
        name: template.name || '',
        startTime: template.startTime || '',
        endTime: template.endTime || '',
        color: template.color || '#3b82f6',
        type: template.type || 'custom',
        description: template.description || '',
        isDefault: template.isDefault || false,
        breaks: template.breaks || [],
        minDuration: template.minDuration || '',
        maxDuration: template.maxDuration || '',
        allowFlexibleHours: template.allowFlexibleHours || false,
        minStaffing: template.minStaffing || 1,
        maxStaffing: template.maxStaffing || '',
        requiredSkills: template.requiredSkills || [],
        requiredCertifications: template.requiredCertifications || [],
        locationId: template.locationId || '',
        departmentId: template.departmentId || '',
        costCenter: template.costCenter || '',
        tags: template.tags || [],
        allowOvertime: template.allowOvertime !== undefined ? template.allowOvertime : true,
        overtimeThreshold: template.overtimeThreshold || 8,
        isActive: template.isActive !== undefined ? template.isActive : true
      });
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formState.name || !formState.startTime || !formState.endTime) {
      setAlert({ type: 'error', message: 'Nazwa, godzina rozpoczęcia i zakończenia są wymagane.' });
      return;
    }

    const payload = {
      ...formState,
      minDuration: formState.minDuration ? Number(formState.minDuration) : undefined,
      maxDuration: formState.maxDuration ? Number(formState.maxDuration) : undefined,
      maxStaffing: formState.maxStaffing ? Number(formState.maxStaffing) : undefined,
    };

    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate._id, ...payload });
    } else {
      createTemplate.mutate(payload);
    }
  };

  const handleAddBreak = () => {
    if (!breakForm.startTime || !breakForm.duration) {
      setAlert({ type: 'error', message: 'Godzina rozpoczęcia i czas trwania przerwy są wymagane.' });
      return;
    }

    setFormState(prev => ({
      ...prev,
      breaks: [...prev.breaks, { ...breakForm }]
    }));

    setBreakForm({
      startTime: '',
      duration: 30,
      isPaid: false,
      type: 'rest',
      description: ''
    });
  };

  const handleRemoveBreak = (index) => {
    setFormState(prev => ({
      ...prev,
      breaks: prev.breaks.filter((_, i) => i !== index)
    }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formState.requiredSkills.includes(skillInput.trim())) {
      setFormState(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormState(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }));
  };

  const handleAddCert = () => {
    if (certInput.trim() && !formState.requiredCertifications.includes(certInput.trim())) {
      setFormState(prev => ({
        ...prev,
        requiredCertifications: [...prev.requiredCertifications, certInput.trim()]
      }));
      setCertInput('');
    }
  };

  const handleRemoveCert = (cert) => {
    setFormState(prev => ({
      ...prev,
      requiredCertifications: prev.requiredCertifications.filter(c => c !== cert)
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formState.tags.includes(tagInput.trim())) {
      setFormState(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormState(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    let duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (duration < 0) duration += 24 * 60;
    return (duration / 60).toFixed(2);
  };

  const templates = templatesData || [];

  return (
    <div className="space-y-4">
      <div className="app-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Szablony zmian</h1>
            <p className="text-sm text-slate-600">Zarządzaj szablonami zmian z pełną konfiguracją</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createDefaultTemplates.mutate()}
              disabled={createDefaultTemplates.isLoading}
              className="btn-secondary"
            >
              Utwórz domyślne
            </button>
            <button
              onClick={() => openModal()}
              className="rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md"
            >
              + Nowy szablon
            </button>
          </div>
        </div>

        {alert.message && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: null, message: null })} />
        )}

        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Ładowanie szablonów...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Brak szablonów. Utwórz pierwszy szablon lub użyj domyślnych.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template._id}
                className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
                      {template.isDefault && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                          Domyślny
                        </span>
                      )}
                      {!template.isActive && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                          Nieaktywny
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      {template.startTime} - {template.endTime} ({calculateDuration(template.startTime, template.endTime)}h)
                    </p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: template.color }}
                  />
                </div>

                {template.description && (
                  <p className="text-xs text-slate-600 mb-3">{template.description}</p>
                )}

                <div className="space-y-2 mb-3">
                  {template.breaks && template.breaks.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">Przerwy:</span>
                      <div className="mt-1 space-y-1">
                        {template.breaks.map((brk, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {brk.startTime} - {brk.duration}min
                            {brk.isPaid && <span className="text-green-600">(płatna)</span>}
                            {brk.type && <span className="text-slate-500">({brk.type})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {template.minStaffing && (
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">Obsada:</span>
                      <span className="text-slate-600 ml-1">
                        {template.minStaffing}{template.maxStaffing ? `-${template.maxStaffing}` : '+'} osób
                      </span>
                    </div>
                  )}

                  {template.requiredSkills && template.requiredSkills.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">Umiejętności:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.requiredSkills.map((skill, idx) => (
                          <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.map((tag, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => openModal(template)}
                    className="flex-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Czy na pewno chcesz usunąć ten szablon?')) {
                        deleteTemplate.mutate(template._id);
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
                {editingTemplate ? 'Edytuj szablon' : 'Nowy szablon'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Podstawowe informacje</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Nazwa szablonu *</label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      placeholder="np. Poranna zmiana"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Typ zmiany</label>
                    <select
                      value={formState.type}
                      onChange={(e) => setFormState(prev => ({ ...prev, type: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                    >
                      <option value="custom">Niestandardowa</option>
                      <option value="morning">Poranna</option>
                      <option value="afternoon">Popołudniowa</option>
                      <option value="evening">Wieczorna</option>
                      <option value="night">Nocna</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Godzina rozpoczęcia *</label>
                    <input
                      type="time"
                      value={formState.startTime}
                      onChange={(e) => setFormState(prev => ({ ...prev, startTime: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Godzina zakończenia *</label>
                    <input
                      type="time"
                      value={formState.endTime}
                      onChange={(e) => setFormState(prev => ({ ...prev, endTime: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Kolor</label>
                    <input
                      type="color"
                      value={formState.color}
                      onChange={(e) => setFormState(prev => ({ ...prev, color: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-2 py-1 focus:border-theme-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Czas trwania</label>
                    <input
                      type="text"
                      value={calculateDuration(formState.startTime, formState.endTime) + ' godzin'}
                      disabled
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Opis</label>
                  <textarea
                    value={formState.description}
                    onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                    rows="2"
                    placeholder="Opcjonalny opis szablonu"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.isDefault}
                      onChange={(e) => setFormState(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="rounded"
                    />
                    Szablon domyślny
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.isActive}
                      onChange={(e) => setFormState(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    Aktywny
                  </label>
                </div>
              </div>

              {/* Break Management */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Zarządzanie przerwami</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Godzina</label>
                    <input
                      type="time"
                      value={breakForm.startTime}
                      onChange={(e) => setBreakForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-theme-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Czas (min)</label>
                    <input
                      type="number"
                      value={breakForm.duration}
                      onChange={(e) => setBreakForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-theme-primary focus:outline-none"
                      min="5"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Typ</label>
                    <select
                      value={breakForm.type}
                      onChange={(e) => setBreakForm(prev => ({ ...prev, type: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-theme-primary focus:outline-none"
                    >
                      <option value="rest">Odpoczynek</option>
                      <option value="meal">Posiłek</option>
                      <option value="other">Inna</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs text-slate-700 pb-2">
                      <input
                        type="checkbox"
                        checked={breakForm.isPaid}
                        onChange={(e) => setBreakForm(prev => ({ ...prev, isPaid: e.target.checked }))}
                        className="rounded"
                      />
                      Płatna
                    </label>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddBreak}
                      className="w-full rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      + Dodaj
                    </button>
                  </div>
                </div>
                {formState.breaks.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {formState.breaks.map((brk, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <div className="text-xs text-slate-700">
                          <span className="font-semibold">{brk.startTime}</span> - {brk.duration}min
                          {brk.isPaid && <span className="text-green-600 ml-2">(płatna)</span>}
                          <span className="text-slate-500 ml-2">({brk.type})</span>
                        </div>
                        <button
                          onClick={() => handleRemoveBreak(idx)}
                          className="text-red-600 hover:text-red-700 text-xs font-semibold"
                        >
                          Usuń
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Hours Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Ustawienia godzin pracy</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Min. czas trwania (h)</label>
                    <input
                      type="number"
                      value={formState.minDuration}
                      onChange={(e) => setFormState(prev => ({ ...prev, minDuration: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="0.5"
                      max="24"
                      step="0.5"
                      placeholder="np. 4"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Max. czas trwania (h)</label>
                    <input
                      type="number"
                      value={formState.maxDuration}
                      onChange={(e) => setFormState(prev => ({ ...prev, maxDuration: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="0.5"
                      max="24"
                      step="0.5"
                      placeholder="np. 12"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
                      <input
                        type="checkbox"
                        checked={formState.allowFlexibleHours}
                        onChange={(e) => setFormState(prev => ({ ...prev, allowFlexibleHours: e.target.checked }))}
                        className="rounded"
                      />
                      Elastyczne godziny
                    </label>
                  </div>
                </div>
              </div>

              {/* Staffing Requirements */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Wymagania obsadowe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Min. liczba pracowników</label>
                    <input
                      type="number"
                      value={formState.minStaffing}
                      onChange={(e) => setFormState(prev => ({ ...prev, minStaffing: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Max. liczba pracowników</label>
                    <input
                      type="number"
                      value={formState.maxStaffing}
                      onChange={(e) => setFormState(prev => ({ ...prev, maxStaffing: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="1"
                      placeholder="Opcjonalne"
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Certifications */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Umiejętności i certyfikaty</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Wymagane umiejętności</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                        placeholder="np. Obsługa kasy"
                      />
                      <button
                        onClick={handleAddSkill}
                        className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                      >
                        Dodaj
                      </button>
                    </div>
                    {formState.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formState.requiredSkills.map((skill, idx) => (
                          <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            {skill}
                            <button onClick={() => handleRemoveSkill(skill)} className="hover:text-purple-900">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Wymagane certyfikaty</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={certInput}
                        onChange={(e) => setCertInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCert())}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                        placeholder="np. Certyfikat BHP"
                      />
                      <button
                        onClick={handleAddCert}
                        className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                      >
                        Dodaj
                      </button>
                    </div>
                    {formState.requiredCertifications.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formState.requiredCertifications.map((cert, idx) => (
                          <span key={idx} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            {cert}
                            <button onClick={() => handleRemoveCert(cert)} className="hover:text-orange-900">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Overtime Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Ustawienia nadgodzin</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={formState.allowOvertime}
                        onChange={(e) => setFormState(prev => ({ ...prev, allowOvertime: e.target.checked }))}
                        className="rounded"
                      />
                      Zezwalaj na nadgodziny
                    </label>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Próg nadgodzin (h)</label>
                    <input
                      type="number"
                      value={formState.overtimeThreshold}
                      onChange={(e) => setFormState(prev => ({ ...prev, overtimeThreshold: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                      min="0"
                      disabled={!formState.allowOvertime}
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 border-b pb-2">Tagi</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
                    placeholder="np. weekend, święta"
                  />
                  <button
                    onClick={handleAddTag}
                    className="rounded-lg bg-slate-600 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Dodaj tag
                  </button>
                </div>
                {formState.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formState.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        #{tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-slate-900">✕</button>
                      </span>
                    ))}
                  </div>
                )}
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
                disabled={createTemplate.isLoading || updateTemplate.isLoading}
                className="rounded-lg bg-theme-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-60"
              >
                {editingTemplate ? 'Zapisz zmiany' : 'Utwórz szablon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftTemplateManager;
