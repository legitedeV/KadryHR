import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Alert from '../components/Alert';

const ScheduleBuilderV2 = () => {
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef(null);
  const gridWrapperRef = useRef(null);
  const gridContentRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [draggedAssignment, setDraggedAssignment] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [copiedAssignment, setCopiedAssignment] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showManageTemplatesModal, setShowManageTemplatesModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [applyMode, setApplyMode] = useState('overwrite');
  const [scheduleScale, setScheduleScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(null);
  const [availableHeight, setAvailableHeight] = useState(null);

  // Parse selected month
  const [year, month] = selectedMonth.split('-').map(Number);

  // Fetch schedules for selected month
  const { data: schedulesData } = useQuery({
    queryKey: ['schedules-v2', year, month],
    queryFn: async () => {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const { data } = await api.get('/schedules/v2', {
        params: { month: monthStr, year }
      });
      return data.schedules || [];
    }
  });

  // Fetch schedule details with assignments
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule-v2-detail', selectedSchedule?._id],
    queryFn: async () => {
      if (!selectedSchedule) return null;
      const { data } = await api.get(`/schedules/v2/${selectedSchedule._id}`);
      return data;
    },
    enabled: !!selectedSchedule
  });

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'compact'],
    queryFn: async () => {
      const { data } = await api.get('/employees/compact');
      return data.employees || [];
    }
  });

  // Fetch tasks for the month
  const { data: tasksData } = useQuery({
    queryKey: ['tasks-schedule', year, month],
    queryFn: async () => {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const { data } = await api.get('/tasks', {
        params: { startDate, endDate }
      });
      return data.tasks || [];
    },
    enabled: !!selectedSchedule,
  });

  // Fetch schedule templates
  const { data: scheduleTemplatesData } = useQuery({
    queryKey: ['schedule-templates'],
    queryFn: async () => {
      const { data } = await api.get('/schedule-templates');
      return data.templates || [];
    }
  });

  // Fetch shift templates
  const { data: templatesData } = useQuery({
    queryKey: ['shift-templates'],
    queryFn: async () => {
      const { data } = await api.get('/shift-templates');
      return data.templates || [];
    }
  });

  // Fetch schedule validation
  const { data: validationData } = useQuery({
    queryKey: ['schedule-validation', selectedSchedule?._id],
    queryFn: async () => {
      if (!selectedSchedule) return null;
      const { data } = await api.get(`/schedules/v2/${selectedSchedule._id}/validation`);
      return data;
    },
    enabled: !!selectedSchedule,
    refetchInterval: false
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/schedules/v2', payload);
      return data.schedule;
    },
    onSuccess: (schedule) => {
      queryClient.invalidateQueries(['schedules-v2']);
      setSelectedSchedule(schedule);
      setSuccess('Grafik utworzony pomyślnie');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się utworzyć grafiku');
    }
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async ({ scheduleId, ...payload }) => {
      const { data } = await api.post(`/schedules/v2/${scheduleId}/assignments`, payload);
      return data.assignment;
    },
    onMutate: async (variables) => {
      const { scheduleId, employeeId, shiftTemplateId } = variables;
      if (!scheduleId) return;

      await queryClient.cancelQueries(['schedule-v2-detail', scheduleId]);
      const previous = queryClient.getQueryData(['schedule-v2-detail', scheduleId]);
      const employee = employeesData?.find((e) => e._id === employeeId);
      const shiftTemplate = templatesData?.find((t) => t._id === shiftTemplateId);
      const optimisticAssignment = {
        _id: `temp-${Date.now()}`,
        ...variables,
        employee: employee ? { ...employee } : { _id: employeeId },
        shiftTemplate: shiftTemplate
          ? { _id: shiftTemplate._id, name: shiftTemplate.name, color: shiftTemplate.color }
          : undefined
      };

      queryClient.setQueryData(['schedule-v2-detail', scheduleId], (old) => {
        if (!old) return old;
        return {
          ...old,
          assignments: [...(old.assignments || []), optimisticAssignment]
        };
      });

      return { previous, scheduleId, tempId: optimisticAssignment._id };
    },
    onError: (err, variables, context) => {
      if (context?.previous && context.scheduleId) {
        queryClient.setQueryData(['schedule-v2-detail', context.scheduleId], context.previous);
      }
      setError(err.response?.data?.message || 'Nie udało się utworzyć przypisania');
    },
    onSuccess: (assignment, variables, context) => {
      if (context?.scheduleId) {
        queryClient.setQueryData(['schedule-v2-detail', context.scheduleId], (old) => {
          if (!old) return old;
          const assignments = (old.assignments || []).filter((a) => a._id !== context.tempId);
          return {
            ...old,
            assignments: [...assignments, assignment]
          };
        });
      }
      setShowModal(false);
      setSuccess('Przypisanie utworzone pomyślnie');
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.scheduleId) {
        queryClient.invalidateQueries(['schedule-v2-detail', variables.scheduleId]);
      }
    }
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/schedules/v2/assignments/${id}`, payload);
      return data.assignment;
    },
    onMutate: async ({ id, scheduleId, employeeId, date, ...payload }) => {
      if (!scheduleId) return;
      await queryClient.cancelQueries(['schedule-v2-detail', scheduleId]);
      const previous = queryClient.getQueryData(['schedule-v2-detail', scheduleId]);

      const employee = employeeId ? employeesData?.find((e) => e._id === employeeId) : null;
      const shiftTemplate = payload.shiftTemplateId
        ? templatesData?.find((t) => t._id === payload.shiftTemplateId)
        : null;

      queryClient.setQueryData(['schedule-v2-detail', scheduleId], (old) => {
        if (!old) return old;
        return {
          ...old,
          assignments: (old.assignments || []).map((assignment) => {
            if (assignment._id !== id) return assignment;
            return {
              ...assignment,
              ...payload,
              ...(employeeId && { employee: employee ? { ...employee } : { _id: employeeId } }),
              ...(date && { date }),
              ...(shiftTemplate && {
                shiftTemplate: {
                  _id: shiftTemplate._id,
                  name: shiftTemplate.name,
                  color: shiftTemplate.color
                }
              })
            };
          })
        };
      });

      return { previous, scheduleId };
    },
    onError: (err, variables, context) => {
      if (context?.previous && context.scheduleId) {
        queryClient.setQueryData(['schedule-v2-detail', context.scheduleId], context.previous);
      }
      setError(err.response?.data?.message || 'Nie udało się zaktualizować przypisania');
    },
    onSuccess: (assignment, variables, context) => {
      if (context?.scheduleId) {
        queryClient.setQueryData(['schedule-v2-detail', context.scheduleId], (old) => {
          if (!old) return old;
          return {
            ...old,
            assignments: (old.assignments || []).map((item) =>
              item._id === assignment._id ? assignment : item
            )
          };
        });
      }
      setShowModal(false);
      setSuccess('Przypisanie zaktualizowane pomyślnie');
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.scheduleId) {
        queryClient.invalidateQueries(['schedule-v2-detail', variables.scheduleId]);
      }
    }
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async ({ id }) => {
      await api.delete(`/schedules/v2/assignments/${id}`);
    },
    onMutate: async ({ id, scheduleId }) => {
      if (!scheduleId) return;
      await queryClient.cancelQueries(['schedule-v2-detail', scheduleId]);
      const previous = queryClient.getQueryData(['schedule-v2-detail', scheduleId]);
      queryClient.setQueryData(['schedule-v2-detail', scheduleId], (old) => {
        if (!old) return old;
        return {
          ...old,
          assignments: (old.assignments || []).filter((assignment) => assignment._id !== id)
        };
      });
      return { previous, scheduleId };
    },
    onError: (err, variables, context) => {
      if (context?.previous && context.scheduleId) {
        queryClient.setQueryData(['schedule-v2-detail', context.scheduleId], context.previous);
      }
      setError(err.response?.data?.message || 'Nie udało się usunąć przypisania');
    },
    onSuccess: (_data, variables) => {
      if (variables?.scheduleId) {
        queryClient.invalidateQueries(['schedule-v2-detail', variables.scheduleId]);
      }
      setShowModal(false);
      setSuccess('Przypisanie usunięte pomyślnie');
    }
  });

  const updateScheduleStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.put(`/schedules/v2/${id}`, { status });
      return data.schedule;
    },
    onSuccess: (schedule) => {
      queryClient.invalidateQueries(['schedules-v2']);
      setSelectedSchedule(schedule);
      setSuccess('Status grafiku zaktualizowany');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zaktualizować statusu');
    }
  });

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/schedule-templates', payload);
      return data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-templates']);
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setSuccess('Szablon zapisany');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zapisać szablonu');
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      const { data } = await api.put(`/schedule-templates/${id}`, { name });
      return data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-templates']);
      setSuccess('Szablon zaktualizowany');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zaktualizować szablonu');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/schedule-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-templates']);
      setSuccess('Szablon usunięty');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się usunąć szablonu');
    }
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async ({ templateId, scheduleId, targetMonth, mode }) => {
      const { data } = await api.post(`/schedule-templates/${templateId}/apply`, {
        scheduleId,
        targetMonth,
        mode
      });
      return { ...data, scheduleId };
    },
    onSuccess: (data) => {
      if (data.scheduleId) {
        queryClient.setQueryData(['schedule-v2-detail', data.scheduleId], (old) => ({
          ...(old || {}),
          schedule: data.schedule || old?.schedule,
          assignments: data.assignments || old?.assignments || []
        }));
      }
      setSuccess('Szablon zastosowany');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się zastosować szablonu');
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.scheduleId) {
        queryClient.invalidateQueries(['schedule-v2-detail', variables.scheduleId]);
      }
    }
  });

  // Get days in month
  const daysInMonth = useMemo(() => {
    const days = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [year, month]);

  // Get assignments by employee and date
  const assignmentsByEmployeeAndDate = useMemo(() => {
    if (!scheduleData?.assignments) return {};
    
    const map = {};
    scheduleData.assignments.forEach(assignment => {
      const employeeId = assignment.employee._id;
      const dateStr = new Date(assignment.date).toISOString().split('T')[0];
      const key = `${employeeId}-${dateStr}`;
      map[key] = assignment;
    });
    return map;
  }, [scheduleData]);

  // Get tasks by employee and date
  const tasksByEmployeeAndDate = useMemo(() => {
    if (!tasksData) return {};
    
    const map = {};
    tasksData.forEach(task => {
      const employeeId = task.employee?._id;
      if (!employeeId) return;
      
      // Use scheduledDate if available, otherwise dueDate
      const taskDate = task.scheduledDate || task.dueDate;
      const dateStr = new Date(taskDate).toISOString().split('T')[0];
      const key = `${employeeId}-${dateStr}`;
      
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(task);
    });
    return map;
  }, [tasksData]);

  const recalcScale = useCallback(() => {
    if (!gridWrapperRef.current || !gridContentRef.current) return;

    const contentHeight = gridContentRef.current.offsetHeight;
    if (!contentHeight) return;

    const { top } = gridWrapperRef.current.getBoundingClientRect();
    const nextAvailableHeight = window.innerHeight - top - 24; // leave small breathing room
    const rawScale = nextAvailableHeight / contentHeight;

    // Prefer keeping the grid at least 75% size for readability, but if the viewport is tighter
    // allow a graceful degradation (down to 0.65) to fully fit without vertical scrollbars.
    const preferredScale = Math.min(1, Math.max(0.75, rawScale));
    const fallbackScale = Math.max(rawScale, 0.65);
    const nextScale = rawScale < 0.75 ? fallbackScale : preferredScale;

    setScheduleScale(nextScale);
    setScaledHeight(contentHeight * nextScale);
    setAvailableHeight(nextAvailableHeight);
  }, []);

  useEffect(() => {
    recalcScale();
    const observerTarget = gridContentRef.current;
    if (!observerTarget) return () => {};

    const resizeObserver = new ResizeObserver(() => recalcScale());
    resizeObserver.observe(observerTarget);
    window.addEventListener('resize', recalcScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', recalcScale);
    };
  }, [recalcScale, scheduleData, employeesData, daysInMonth.length]);

  const handleCreateSchedule = () => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const name = `Grafik ${monthStr}`;
    createScheduleMutation.mutate({ name, month: monthStr, year });
  };

  useEffect(() => {
    if (!selectedTemplateId && scheduleTemplatesData?.length) {
      setSelectedTemplateId(scheduleTemplatesData[0]._id);
    }
  }, [selectedTemplateId, scheduleTemplatesData]);

  const buildTemplatePayload = useCallback(() => {
    if (!scheduleData?.assignments?.length) {
      setError('Brak danych grafiku do zapisania');
      return null;
    }

    if (!templateName.trim()) {
      setError('Podaj nazwę szablonu');
      return null;
    }

    const assignments = scheduleData.assignments.map((assignment) => ({
      employeeId: assignment.employee._id,
      date: new Date(assignment.date).toISOString().split('T')[0],
      type: assignment.type,
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      shiftTemplateId: assignment.shiftTemplate?._id,
      notes: assignment.notes,
      color: assignment.color
    }));

    return {
      name: templateName.trim(),
      assignments,
      month: selectedMonth,
      year
    };
  }, [scheduleData, selectedMonth, templateName, year]);

  const handleSaveTemplate = () => {
    const payload = buildTemplatePayload();
    if (!payload) return;
    createTemplateMutation.mutate(payload);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplateId || !selectedSchedule) {
      setError('Wybierz szablon oraz grafik docelowy');
      return;
    }

    applyTemplateMutation.mutate({
      templateId: selectedTemplateId,
      scheduleId: selectedSchedule._id,
      targetMonth: selectedMonth,
      mode: applyMode
    });
  };

  const handleRenameTemplate = (id, name) => {
    updateTemplateMutation.mutate({ id, name });
  };

  const handleDeleteTemplate = (id) => {
    deleteTemplateMutation.mutate(id);
    if (selectedTemplateId === id) {
      setSelectedTemplateId('');
    }
  };

  const handleCellClick = (employee, date) => {
    if (!selectedSchedule) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const key = `${employee._id}-${dateStr}`;
    const existing = assignmentsByEmployeeAndDate[key];

    setSelectedCell({ employeeId: employee._id, date: dateStr });

    setModalData({
      employee,
      date: dateStr,
      existing
    });
    setShowModal(true);
  };

  // Drag & Drop handlers for assignments
  const handleDragStart = (e, assignment) => {
    setDraggedAssignment(assignment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedAssignment(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetEmployee, targetDate) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedAssignment || !selectedSchedule) return;
    
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const sourceDateStr = new Date(draggedAssignment.date).toISOString().split('T')[0];
    const sourceEmployeeId = draggedAssignment.employee._id;
    const targetEmployeeId = targetEmployee._id;
    
    // Check if dropping on the same cell
    if (sourceEmployeeId === targetEmployeeId && sourceDateStr === targetDateStr) {
      setDraggedAssignment(null);
      return;
    }
    
    // Check if target cell already has an assignment
    const targetKey = `${targetEmployeeId}-${targetDateStr}`;
    const existingTarget = assignmentsByEmployeeAndDate[targetKey];
    
    if (existingTarget) {
      setError('Komórka docelowa już ma przypisanie. Usuń je najpierw.');
      setDraggedAssignment(null);
      return;
    }
    
    try {
      // Update the assignment with new employee and date
      await updateAssignmentMutation.mutateAsync({
        id: draggedAssignment._id,
        scheduleId: selectedSchedule._id,
        employeeId: targetEmployeeId,
        date: targetDateStr,
        type: draggedAssignment.type,
        startTime: draggedAssignment.startTime,
        endTime: draggedAssignment.endTime,
        notes: draggedAssignment.notes,
        color: draggedAssignment.color
      });
      
      setSuccess('Zmiana przeniesiona pomyślnie');
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się przenieść zmiany');
    }

    setDraggedAssignment(null);
  };

  const handleCopyShortcut = () => {
    if (!selectedCell) return;
    const key = `${selectedCell.employeeId}-${selectedCell.date}`;
    const existing = assignmentsByEmployeeAndDate[key];
    if (!existing) {
      setError('Brak zmiany do skopiowania w wybranej komórce');
      return;
    }
    setCopiedAssignment(existing);
    setSuccess('Zmiana skopiowana (Ctrl+V aby wkleić)');
  };

  const handlePasteShortcut = async () => {
    if (!selectedSchedule || !selectedCell || !copiedAssignment) return;

    const targetKey = `${selectedCell.employeeId}-${selectedCell.date}`;
    if (assignmentsByEmployeeAndDate[targetKey]) {
      setError('Docelowa komórka ma już zmianę. Usuń ją najpierw.');
      return;
    }

    try {
      await createAssignmentMutation.mutateAsync({
        scheduleId: selectedSchedule._id,
        employeeId: selectedCell.employeeId,
        date: selectedCell.date,
        type: copiedAssignment.type,
        startTime: copiedAssignment.startTime,
        endTime: copiedAssignment.endTime,
        notes: copiedAssignment.notes,
        color: copiedAssignment.color,
        shiftTemplateId: copiedAssignment.shiftTemplate?._id
      });
      setSuccess('Zmiana wklejona');
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się wkleić zmiany');
    }
  };

  const handleSaveAssignment = (formData) => {
    if (modalData.existing) {
      updateAssignmentMutation.mutate({
        id: modalData.existing._id,
        scheduleId: selectedSchedule._id,
        ...formData
      });
    } else {
      createAssignmentMutation.mutate({
        scheduleId: selectedSchedule._id,
        employeeId: modalData.employee._id,
        date: modalData.date,
        ...formData
      });
    }
  };

  const handleDeleteAssignment = () => {
    if (modalData.existing) {
      deleteAssignmentMutation.mutate({ id: modalData.existing._id, scheduleId: selectedSchedule._id });
    }
  };

  const handlePrevMonth = () => {
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    setSelectedSchedule(null);
  };

  const handleNextMonth = () => {
    const date = new Date(year, month, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    setSelectedSchedule(null);
  };

  const getAssignmentDisplay = (assignment) => {
    if (!assignment) return null;
    
    if (assignment.type === 'shift') {
      return `${assignment.startTime}-${assignment.endTime}`;
    } else if (assignment.type === 'leave') {
      return 'Urlop';
    } else if (assignment.type === 'off') {
      return 'Wolne';
    } else if (assignment.type === 'sick') {
      return 'L4';
    }
    return assignment.type;
  };

  const getAssignmentColor = (assignment) => {
    if (!assignment) return 'transparent';
    return assignment.color || '#3b82f6';
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === 'c') {
        e.preventDefault();
        handleCopyShortcut();
      }
      if (e.ctrlKey && key === 'v') {
        e.preventDefault();
        handlePasteShortcut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, copiedAssignment, assignmentsByEmployeeAndDate, selectedSchedule]);

  // Auto-select first schedule if available
  React.useEffect(() => {
    if (schedulesData && schedulesData.length > 0 && !selectedSchedule) {
      setSelectedSchedule(schedulesData[0]);
    }
  }, [schedulesData, selectedSchedule]);

  return (
    <div className="w-full space-y-4 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="app-card p-4 sm:p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
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
                Grafik pracy (Nowy)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Widok miesięczny - siatka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handlePrevMonth} className="btn-secondary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 min-w-[150px] text-center">
              {new Date(year, month - 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="btn-secondary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Validation Summary */}
      {selectedSchedule && validationData && (
        <div className="app-card p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {validationData.summary.totalEmployees}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Pracowników</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {validationData.summary.totalAssignments}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Zmian</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {validationData.summary.totalHours}h
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Łącznie godzin</div>
              </div>
            </div>
            {validationData.summary.totalViolations > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {validationData.summary.totalViolations} naruszeń
                  </div>
                  {validationData.summary.highSeverityViolations > 0 && (
                    <div className="text-xs text-red-500 dark:text-red-400">
                      {validationData.summary.highSeverityViolations} wysokiej wagi
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Selection / Creation */}
      {!selectedSchedule && schedulesData && schedulesData.length === 0 && (
        <div className="app-card p-4 sm:p-5 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Brak grafiku dla wybranego miesiąca
          </p>
          <button onClick={handleCreateSchedule} className="btn-primary">
            Utwórz nowy grafik
          </button>
        </div>
      )}

      {/* Schedule Grid */}
      {selectedSchedule && (
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="app-card p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {selectedSchedule.name}
              </h2>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedSchedule.status === 'published'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {selectedSchedule.status === 'published' ? 'Opublikowany' : 'Wersja robocza'}
                  </span>
                  {selectedSchedule.status === 'draft' ? (
                    <button
                      className="btn-primary px-3 py-2 text-sm"
                      onClick={() =>
                        updateScheduleStatusMutation.mutate({
                          id: selectedSchedule._id,
                          status: 'published'
                        })
                      }
                    >
                      Opublikuj grafik
                    </button>
                  ) : (
                    <button
                      className="btn-secondary px-3 py-2 text-sm"
                      onClick={() =>
                        updateScheduleStatusMutation.mutate({
                          id: selectedSchedule._id,
                          status: 'draft'
                        })
                      }
                    >
                      Cofnij publikację
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="input-primary min-w-[180px]"
                  >
                    <option value="">Wybierz szablon</option>
                    {scheduleTemplatesData?.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={applyMode}
                    onChange={(e) => setApplyMode(e.target.value)}
                    className="input-primary"
                  >
                    <option value="overwrite">Nadpisz</option>
                    <option value="merge">Scal</option>
                  </select>
                  <button className="btn-secondary" onClick={() => setShowSaveTemplateModal(true)}>
                    Zapisz jako szablon
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleApplyTemplate}
                    disabled={applyTemplateMutation.isLoading}
                  >
                    {applyTemplateMutation.isLoading ? 'Trwa stosowanie...' : 'Zastosuj szablon'}
                  </button>
                  <button className="btn-secondary" onClick={() => setShowManageTemplatesModal(true)}>
                    Zarządzaj
                  </button>
                </div>
              </div>
            </div>

            {scheduleLoading ? (
              <div className="text-center py-8">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                  style={{ borderColor: 'var(--theme-primary)' }}
                ></div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie...</p>
              </div>
            ) : (
              <div
                className="relative overflow-hidden"
                ref={gridWrapperRef}
                style={{
                  height: scaledHeight ? `${scaledHeight}px` : undefined,
                  maxHeight: availableHeight ? `${availableHeight}px` : undefined
                }}
              >
                <div
                  ref={gridContentRef}
                  className="w-full"
                  style={{
                    transform: `scale(${scheduleScale})`,
                    transformOrigin: 'top left',
                    width: `${(1 / scheduleScale) * 100}%`,
                    minWidth: '100%'
                  }}
                >
                  <div ref={scrollContainerRef} className="w-full overflow-x-auto">
                    <table className="w-full border-collapse table-fixed" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th
                            className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-700 p-2 text-left text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600"
                            style={{
                              width: '200px',
                              minWidth: '200px',
                              boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            Pracownik
                          </th>
                          {daysInMonth.map((date, index) => (
                            <th
                              key={index}
                              className="p-1 sm:p-1.5 text-center text-[10px] sm:text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                              style={{ width: '42px', minWidth: '42px' }}
                            >
                              <div className="hidden sm:block whitespace-nowrap">{date.toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
                              <div className="font-bold">{date.getDate()}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {employeesData?.map((employee) => (
                          <tr key={employee._id}>
                            <td
                              className="sticky left-0 z-20 bg-white dark:bg-slate-800 p-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600"
                              style={{
                                width: '200px',
                                minWidth: '200px',
                                boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)'
                              }}
                            >
                              <div className="truncate">
                                {employee.firstName} {employee.lastName}
                              </div>
                            </td>
                            {daysInMonth.map((date, index) => {
                              const dateStr = date.toISOString().split('T')[0];
                              const key = `${employee._id}-${dateStr}`;
                              const assignment = assignmentsByEmployeeAndDate[key];
                              const tasks = tasksByEmployeeAndDate[key] || [];

                              return (
                                <td
                                  key={index}
                                  onClick={(e) => {
                                    if (e.target.closest('[draggable="true"]')) return;
                                    handleCellClick(employee, date);
                                  }}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, employee, date)}
                                  className="p-1 sm:p-2 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative"
                                  style={{ minWidth: '42px' }}
                                >
                                  {assignment && (
                                    <div
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, assignment)}
                                      onDragEnd={handleDragEnd}
                                      className="px-2 py-1 rounded text-[10px] sm:text-xs text-white text-center font-medium truncate cursor-move"
                                      style={{ backgroundColor: getAssignmentColor(assignment) }}
                                      title={`${getAssignmentDisplay(assignment)} (przeciągnij aby przenieść)`}
                                    >
                                      {getAssignmentDisplay(assignment)}
                                    </div>
                                  )}
                                  {tasks.length > 0 && (
                                    <div
                                      className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                                      style={{ backgroundColor: 'var(--theme-primary)' }}
                                      title={`${tasks.length} zadań`}
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && modalData && (
        <AssignmentModal
          data={modalData}
          templates={templatesData}
          onSave={handleSaveAssignment}
          onDelete={handleDeleteAssignment}
          onClose={() => setShowModal(false)}
        />
      )}

      {showSaveTemplateModal && (
        <TemplateSaveModal
          value={templateName}
          onChange={setTemplateName}
          onClose={() => setShowSaveTemplateModal(false)}
          onSave={handleSaveTemplate}
          isSaving={createTemplateMutation.isLoading}
        />
      )}

      {showManageTemplatesModal && (
        <TemplateManagerModal
          templates={scheduleTemplatesData || []}
          onRename={handleRenameTemplate}
          onDelete={handleDeleteTemplate}
          onClose={() => setShowManageTemplatesModal(false)}
        />
      )}
    </div>
  );
};

// Assignment Modal Component
const AssignmentModal = ({ data, templates, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    type: data.existing?.type || 'shift',
    startTime: data.existing?.startTime || '08:00',
    endTime: data.existing?.endTime || '16:00',
    notes: data.existing?.notes || '',
    color: data.existing?.color || '#3b82f6'
  });

  const handleTemplateSelect = (template) => {
    setFormData({
      ...formData,
      startTime: template.startTime,
      endTime: template.endTime,
      color: template.color
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {data.existing ? 'Edytuj przypisanie' : 'Dodaj przypisanie'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pracownik
            </label>
            <p className="text-sm text-slate-900 dark:text-slate-100">
              {data.employee.firstName} {data.employee.lastName}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Data
            </label>
            <p className="text-sm text-slate-900 dark:text-slate-100">
              {new Date(data.date).toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Typ
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-primary"
            >
              <option value="shift">Zmiana</option>
              <option value="leave">Urlop</option>
              <option value="off">Wolne</option>
              <option value="sick">L4</option>
            </select>
          </div>

          {formData.type === 'shift' && (
            <>
              {templates && templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Szablony zmian
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {templates.map((template) => (
                      <button
                        key={template._id}
                        type="button"
                        onClick={() => handleTemplateSelect(template)}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-all hover:scale-105"
                        style={{ backgroundColor: template.color }}
                        title={template.description}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Od
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Do
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kolor
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-600"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notatka
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="textarea-primary"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            {data.existing && (
              <button
                type="button"
                onClick={onDelete}
                className="btn-secondary flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Usuń
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Anuluj
            </button>
            <button type="submit" className="btn-primary flex-1">
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TemplateSaveModal = ({ value, onChange, onClose, onSave, isSaving }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Zapisz jako szablon</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nazwa szablonu</label>
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="input-primary w-full"
              placeholder="Np. Grafik miesięczny"
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Zapisujemy bieżący układ zmian dla wszystkich pracowników w tym miesiącu.
          </p>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={onSave} disabled={isSaving || !value.trim()}>
              {isSaving ? 'Zapisywanie...' : 'Zapisz szablon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateManagerModal = ({ templates, onRename, onDelete, onClose }) => {
  const [localNames, setLocalNames] = useState(() =>
    Object.fromEntries((templates || []).map((template) => [template._id, template.name]))
  );

  useEffect(() => {
    setLocalNames(Object.fromEntries((templates || []).map((template) => [template._id, template.name])));
  }, [templates]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Zarządzaj szablonami</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {(templates || []).length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Brak zapisanych szablonów.</p>
          )}
          {templates?.map((template) => (
            <div
              key={template._id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3"
            >
              <input
                className="input-primary flex-1"
                value={localNames[template._id] || ''}
                onChange={(e) =>
                  setLocalNames({
                    ...localNames,
                    [template._id]: e.target.value
                  })
                }
              />
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => onRename(template._id, localNames[template._id] || '')}
                >
                  Zmień nazwę
                </button>
                <button className="btn-danger" onClick={() => onDelete(template._id)}>
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleBuilderV2;
