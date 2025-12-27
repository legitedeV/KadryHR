/**
 * Inteligentny optymalizator grafików
 * Generuje optymalne grafiki z uwzględnieniem wielu czynników
 */

const { validateSchedule, calculateShiftDuration } = require('./laborLawValidator');
const { calculateScheduleCost } = require('./costCalculator');

/**
 * Generowanie inteligentnego grafiku
 */
const generateIntelligentSchedule = async (params) => {
  const {
    employees,
    startDate,
    endDate,
    shiftTemplates,
    constraints = {},
    availabilities = [],
    leaves = [],
    forecastData = null,
    budget = null,
  } = params;
  
  // Walidacja parametrów wejściowych
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    throw new Error('Brak dostępnych pracowników do wygenerowania grafiku');
  }
  
  if (!startDate || !endDate) {
    throw new Error('Wymagane są daty rozpoczęcia i zakończenia');
  }
  
  if (!shiftTemplates || !Array.isArray(shiftTemplates) || shiftTemplates.length === 0) {
    throw new Error('Brak szablonów zmian do wygenerowania grafiku');
  }
  
  const {
    maxStaffPerShift = 10,
    preferredStaffPerShift = 2,
    allowOvertime = true,
    allowNightShifts = true,
    allowWeekendWork = true,
    prioritizeAvailability = true,
    prioritizeCostOptimization = false,
  } = constraints;
  
  // Przygotowanie struktury danych
  const schedule = [];
  const employeeWorkload = {};
  const dailyStaffing = {};
  
  employees.forEach(emp => {
    employeeWorkload[emp._id.toString()] = {
      totalHours: 0,
      shifts: 0,
      consecutiveDays: 0,
      lastShiftDate: null,
    };
  });
  
  // Iteracja przez dni
  const currentDate = new Date(startDate);
  const endDateTime = new Date(endDate);
  
  while (currentDate <= endDateTime) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Pomiń weekendy jeśli nie są dozwolone
    if (isWeekend && !allowWeekendWork) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // Określenie zapotrzebowania na personel
    const staffingNeed = calculateStaffingNeed(
      currentDate,
      forecastData,
      preferredStaffPerShift
    );
    
    dailyStaffing[dateKey] = {
      required: staffingNeed,
      assigned: 0,
      shifts: [],
    };
    
    // Dla każdego szablonu zmiany
    for (const template of shiftTemplates) {
      // Pomiń zmiany nocne jeśli nie są dozwolone
      if (!allowNightShifts && template.shiftType === 'night') {
        continue;
      }
      
      // Wybór pracowników na tę zmianę
      const selectedEmployees = selectEmployeesForShift(
        employees,
        template,
        currentDate,
        employeeWorkload,
        availabilities,
        leaves,
        {
          prioritizeAvailability,
          prioritizeCostOptimization,
          maxStaffPerShift: Math.min(staffingNeed, maxStaffPerShift),
        }
      );
      
      // Tworzenie zmian dla wybranych pracowników
      selectedEmployees.forEach(emp => {
        const shift = {
          employee: emp._id,
          date: new Date(currentDate),
          startTime: template.startTime,
          endTime: template.endTime,
          type: template.shiftType || 'regular',
          notes: `Auto-generowane (${template.name})`,
        };
        
        // Walidacja przed dodaniem
        const validation = validateShiftForEmployee(
          shift,
          emp,
          employeeWorkload[emp._id.toString()],
          { allowOvertime }
        );
        
        if (validation.valid) {
          schedule.push(shift);
          
          // Aktualizacja obciążenia pracownika
          const duration = calculateShiftDuration(shift.startTime, shift.endTime);
          const empId = emp._id.toString();
          employeeWorkload[empId].totalHours += duration;
          employeeWorkload[empId].shifts += 1;
          employeeWorkload[empId].lastShiftDate = new Date(currentDate);
          
          // Aktualizacja obsady dziennej
          dailyStaffing[dateKey].assigned += 1;
          dailyStaffing[dateKey].shifts.push(shift);
        }
      });
      
      // Jeśli osiągnięto wymagane obsadzenie, przerwij
      if (dailyStaffing[dateKey].assigned >= staffingNeed) {
        break;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Walidacja całego grafiku
  const validation = schedule.length > 0 ? validateSchedule(schedule) : {
    isValid: true,
    violations: [],
    summary: { total: 0, errors: 0, warnings: 0 }
  };
  
  // Obliczenie kosztów
  const costs = calculateScheduleCost(schedule, employees);
  
  // Sprawdzenie budżetu
  const budgetStatus = budget ? {
    budget,
    actualCost: costs.totalCost,
    withinBudget: costs.totalCost <= budget,
    difference: budget - costs.totalCost,
  } : null;
  
  // Ostrzeżenie jeśli grafik jest pusty
  if (schedule.length === 0) {
    console.warn('Wygenerowano pusty grafik - sprawdź ograniczenia i dostępność pracowników');
  }
  
  return {
    schedule,
    validation,
    costs,
    budgetStatus,
    staffingAnalysis: dailyStaffing,
    employeeWorkload,
    metadata: {
      totalShifts: schedule.length,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      generatedAt: new Date(),
    },
  };
};

/**
 * Obliczanie zapotrzebowania na personel na podstawie prognoz
 */
const calculateStaffingNeed = (date, forecastData, defaultStaff = 2) => {
  if (!forecastData) return defaultStaff;
  
  const dateKey = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();
  
  // Jeśli mamy konkretne dane dla tego dnia
  if (forecastData.daily && forecastData.daily[dateKey]) {
    return forecastData.daily[dateKey].requiredStaff || defaultStaff;
  }
  
  // Jeśli mamy dane per dzień tygodnia
  if (forecastData.byDayOfWeek && forecastData.byDayOfWeek[dayOfWeek]) {
    return forecastData.byDayOfWeek[dayOfWeek].requiredStaff || defaultStaff;
  }
  
  // Domyślnie
  return defaultStaff;
};

/**
 * Wybór pracowników na zmianę
 */
const selectEmployeesForShift = (
  employees,
  template,
  date,
  workload,
  availabilities,
  leaves,
  options
) => {
  const {
    prioritizeAvailability,
    prioritizeCostOptimization,
    maxStaffPerShift,
  } = options;
  
  // Filtrowanie dostępnych pracowników
  const available = employees.filter(emp => {
    const _empId = emp._id.toString();
    
    // Sprawdź czy pracownik jest aktywny
    if (!emp.isActive) return false;
    
    // Sprawdź czy pracownik jest na urlopie
    if (isOnLeave(emp, date, leaves)) return false;
    
    // Sprawdź czy pracownik może pracować w nocy
    if (template.shiftType === 'night' && !emp.canWorkNights) return false;
    
    // Sprawdź czy pracownik może pracować w weekendy
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend && !emp.canWorkWeekends) return false;
    
    // Sprawdź umiejętności
    if (template.requiredSkills && template.requiredSkills.length > 0) {
      const hasRequiredSkills = template.requiredSkills.some(skill =>
        emp.skills && emp.skills.includes(skill)
      );
      if (!hasRequiredSkills) return false;
    }
    
    return true;
  });
  
  if (available.length === 0) return [];
  
  // Scoring pracowników
  const scored = available.map(emp => {
    let score = 0;
    const empId = emp._id.toString();
    const empWorkload = workload[empId];
    
    // Priorytet planowania (z modelu pracownika)
    score += (emp.schedulingPriority || 5) * 10;
    
    // Preferuj pracowników z mniejszym obciążeniem (równomierne rozłożenie)
    const avgHours = Object.values(workload).reduce((sum, w) => sum + w.totalHours, 0) / Object.keys(workload).length;
    if (empWorkload.totalHours < avgHours) {
      score += 20;
    }
    
    // Dostępność
    if (prioritizeAvailability) {
      const availability = getEmployeeAvailability(emp, date, availabilities);
      if (availability) {
        if (availability.type === 'preferred') score += 30;
        else if (availability.type === 'available') score += 15;
      }
    }
    
    // Optymalizacja kosztów
    if (prioritizeCostOptimization) {
      const maxRate = Math.max(...available.map(e => e.hourlyRate || 0));
      const costScore = maxRate > 0 ? ((maxRate - emp.hourlyRate) / maxRate) * 25 : 0;
      score += costScore;
    }
    
    // Preferowane zmiany
    if (emp.preferredShifts && emp.preferredShifts.includes(template.shiftType)) {
      score += 10;
    }
    
    // Unikaj zbyt wielu kolejnych dni
    if (empWorkload.consecutiveDays > 5) {
      score -= 30;
    }
    
    return { emp, score };
  });
  
  // Sortowanie i wybór najlepszych
  scored.sort((a, b) => b.score - a.score);
  
  const selected = scored.slice(0, Math.min(maxStaffPerShift, template.requiredStaff || 1));
  return selected.map(s => s.emp);
};

/**
 * Walidacja zmiany dla pracownika
 */
const validateShiftForEmployee = (shift, employee, workload, options) => {
  const { allowOvertime } = options;
  
  const duration = calculateShiftDuration(shift.startTime, shift.endTime);
  
  // Sprawdź maksymalne godziny dziennie
  if (duration > (employee.maxHoursPerDay || 12)) {
    return {
      valid: false,
      reason: `Przekroczenie maksymalnych godzin dziennych (${employee.maxHoursPerDay || 12}h)`,
    };
  }
  
  // Sprawdź maksymalne godziny tygodniowo
  const weeklyHours = workload.totalHours + duration;
  if (weeklyHours > (employee.maxHoursPerWeek || 60)) {
    return {
      valid: false,
      reason: `Przekroczenie maksymalnych godzin tygodniowych (${employee.maxHoursPerWeek || 60}h)`,
    };
  }
  
  // Sprawdź nadgodziny
  if (!allowOvertime && duration > 8) {
    return {
      valid: false,
      reason: 'Nadgodziny nie są dozwolone',
    };
  }
  
  return { valid: true };
};

/**
 * Sprawdzenie czy pracownik jest na urlopie
 */
const isOnLeave = (employee, date, leaves) => {
  const empId = employee._id.toString();
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return leaves.some(leave => {
    if (leave.employee.toString() !== empId) return false;
    if (leave.status !== 'approved') return false;
    
    const start = new Date(leave.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(leave.endDate);
    end.setHours(23, 59, 59, 999);
    
    return checkDate >= start && checkDate <= end;
  });
};

/**
 * Pobranie dostępności pracownika
 */
const getEmployeeAvailability = (employee, date, availabilities) => {
  const empId = employee._id.toString();
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  const dayOfWeek = checkDate.getDay();
  
  return availabilities.find(avail => {
    if (avail.employee.toString() !== empId) return false;
    if (avail.status !== 'approved') return false;
    
    const start = new Date(avail.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(avail.endDate);
    end.setHours(23, 59, 59, 999);
    
    if (checkDate < start || checkDate > end) return false;
    
    // Sprawdź dzień tygodnia
    if (avail.daysOfWeek && !avail.daysOfWeek.includes(dayOfWeek)) return false;
    
    return true;
  });
};

/**
 * Optymalizacja istniejącego grafiku
 */
const optimizeExistingSchedule = async (schedule, employees, constraints = {}) => {
  // Analiza obecnego grafiku
  const validation = validateSchedule(schedule);
  const costs = calculateScheduleCost(schedule, employees);
  
  const suggestions = [];
  
  // Sugestie na podstawie naruszeń
  if (!validation.isValid) {
    validation.violations.forEach(violation => {
      if (violation.severity === 'error') {
        suggestions.push({
          type: 'compliance',
          priority: 'high',
          message: violation.message,
          article: violation.article,
        });
      }
    });
  }
  
  // Sugestie optymalizacji kosztów
  if (constraints.budget && costs.totalCost > constraints.budget) {
    suggestions.push({
      type: 'cost',
      priority: 'high',
      message: `Przekroczenie budżetu o ${(costs.totalCost - constraints.budget).toFixed(2)} PLN`,
    });
  }
  
  // Sugestie równomiernego rozłożenia pracy
  const workloadVariance = calculateWorkloadVariance(schedule, employees);
  if (workloadVariance > 0.3) {
    suggestions.push({
      type: 'workload',
      priority: 'medium',
      message: 'Nierównomierne rozłożenie pracy między pracowników',
    });
  }
  
  return {
    currentSchedule: schedule,
    validation,
    costs,
    suggestions,
    optimizationScore: calculateOptimizationScore(validation, costs, workloadVariance),
  };
};

/**
 * Obliczanie wariancji obciążenia pracowników
 */
const calculateWorkloadVariance = (schedule, employees) => {
  const workload = {};
  
  employees.forEach(emp => {
    workload[emp._id.toString()] = 0;
  });
  
  schedule.forEach(shift => {
    const empId = shift.employee.toString();
    if (workload[empId] !== undefined) {
      workload[empId] += calculateShiftDuration(shift.startTime, shift.endTime);
    }
  });
  
  const hours = Object.values(workload);
  const avg = hours.reduce((sum, h) => sum + h, 0) / hours.length;
  const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
  
  return Math.sqrt(variance) / (avg || 1);
};

/**
 * Obliczanie wyniku optymalizacji (0-100)
 */
const calculateOptimizationScore = (validation, costs, workloadVariance) => {
  let score = 100;
  
  // Kary za naruszenia
  score -= validation.summary.errors * 15;
  score -= validation.summary.warnings * 5;
  
  // Kara za nierównomierne obciążenie
  score -= workloadVariance * 20;
  
  return Math.max(0, Math.min(100, score));
};

module.exports = {
  generateIntelligentSchedule,
  optimizeExistingSchedule,
  selectEmployeesForShift,
  calculateStaffingNeed,
};
