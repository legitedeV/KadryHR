/**
 * Kalkulator kosztów pracy
 * Oblicza koszty grafiku z uwzględnieniem stawek, nadgodzin, dodatków
 */

const { calculateShiftDuration, isNightShift } = require('./laborLawValidator');

/**
 * Obliczanie kosztu pojedynczej zmiany
 */
const calculateShiftCost = (shift, employee, options = {}) => {
  const {
    overtimeMultiplier = 1.5,      // 150% za nadgodziny
    nightShiftMultiplier = 1.2,    // 120% za pracę nocną
    weekendMultiplier = 1.5,       // 150% za weekendy
    holidayMultiplier = 2.0,       // 200% za święta
  } = options;
  
  const duration = calculateShiftDuration(shift.startTime, shift.endTime);
  const hourlyRate = employee.hourlyRate || 0;
  
  let baseCost = duration * hourlyRate;
  let breakdown = {
    baseHours: duration,
    baseRate: hourlyRate,
    baseCost,
    overtimeHours: 0,
    overtimeCost: 0,
    nightShiftBonus: 0,
    weekendBonus: 0,
    holidayBonus: 0,
    totalCost: baseCost,
  };
  
  // Nadgodziny (powyżej 8h dziennie)
  if (duration > 8) {
    const overtimeHours = duration - 8;
    const overtimeCost = overtimeHours * hourlyRate * (overtimeMultiplier - 1);
    breakdown.overtimeHours = overtimeHours;
    breakdown.overtimeCost = overtimeCost;
    breakdown.totalCost += overtimeCost;
  }
  
  // Dodatek nocny
  if (isNightShift(shift.startTime, shift.endTime)) {
    const nightBonus = baseCost * (nightShiftMultiplier - 1);
    breakdown.nightShiftBonus = nightBonus;
    breakdown.totalCost += nightBonus;
  }
  
  // Dodatek weekendowy
  const shiftDate = new Date(shift.date);
  const dayOfWeek = shiftDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const weekendBonus = baseCost * (weekendMultiplier - 1);
    breakdown.weekendBonus = weekendBonus;
    breakdown.totalCost += weekendBonus;
  }
  
  // Dodatek świąteczny (jeśli shift.isHoliday)
  if (shift.isHoliday) {
    const holidayBonus = baseCost * (holidayMultiplier - 1);
    breakdown.holidayBonus = holidayBonus;
    breakdown.totalCost += holidayBonus;
  }
  
  return breakdown;
};

/**
 * Obliczanie całkowitego kosztu grafiku
 */
const calculateScheduleCost = (shifts, employees, options = {}) => {
  // Walidacja wejścia
  if (!Array.isArray(shifts) || shifts.length === 0) {
    return {
      totalCost: 0,
      totalHours: 0,
      totalOvertimeHours: 0,
      averageCostPerHour: 0,
      employeeCosts: [],
      shiftCosts: [],
    };
  }
  
  if (!Array.isArray(employees) || employees.length === 0) {
    return {
      totalCost: 0,
      totalHours: 0,
      totalOvertimeHours: 0,
      averageCostPerHour: 0,
      employeeCosts: [],
      shiftCosts: [],
    };
  }
  
  const employeeMap = {};
  employees.forEach(emp => {
    if (emp && emp._id) {
      employeeMap[emp._id.toString()] = emp;
    }
  });
  
  let totalCost = 0;
  let totalHours = 0;
  let totalOvertimeHours = 0;
  const employeeCosts = {};
  const shiftCosts = [];
  
  shifts.forEach(shift => {
    if (!shift || !shift.employee) return;
    
    const employeeId = shift.employee._id ? shift.employee._id.toString() : shift.employee.toString();
    const employee = employeeMap[employeeId];
    
    if (!employee) {
      console.warn(`Employee not found for shift: ${employeeId}`);
      return;
    }
    
    const cost = calculateShiftCost(shift, employee, options);
    totalCost += cost.totalCost;
    totalHours += cost.baseHours;
    totalOvertimeHours += cost.overtimeHours;
    
    // Agregacja kosztów per pracownik
    const empId = employee._id.toString();
    if (!employeeCosts[empId]) {
      employeeCosts[empId] = {
        employeeId: empId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        totalCost: 0,
        totalHours: 0,
        overtimeHours: 0,
        shifts: 0,
      };
    }
    
    employeeCosts[empId].totalCost += cost.totalCost;
    employeeCosts[empId].totalHours += cost.baseHours;
    employeeCosts[empId].overtimeHours += cost.overtimeHours;
    employeeCosts[empId].shifts += 1;
    
    shiftCosts.push({
      shiftId: shift._id,
      date: shift.date,
      employee: `${employee.firstName} ${employee.lastName}`,
      ...cost,
    });
  });
  
  return {
    totalCost: Math.round(totalCost * 100) / 100,
    totalHours: Math.round(totalHours * 100) / 100,
    totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    averageCostPerHour: totalHours > 0 ? Math.round((totalCost / totalHours) * 100) / 100 : 0,
    employeeCosts: Object.values(employeeCosts),
    shiftCosts,
  };
};

/**
 * Optymalizacja kosztów - sugeruje zmiany dla redukcji kosztów
 */
const optimizeCosts = (shifts, employees, budget, options = {}) => {
  const currentCost = calculateScheduleCost(shifts, employees, options);
  
  if (currentCost.totalCost <= budget) {
    return {
      needsOptimization: false,
      currentCost: currentCost.totalCost,
      budget,
      savings: budget - currentCost.totalCost,
      suggestions: [],
    };
  }
  
  const suggestions = [];
  const overBudget = currentCost.totalCost - budget;
  
  // Sugestia 1: Redukcja nadgodzin
  if (currentCost.totalOvertimeHours > 0) {
    suggestions.push({
      type: 'reduce_overtime',
      priority: 'high',
      message: `Zredukuj nadgodziny o ${Math.ceil(currentCost.totalOvertimeHours)} godzin`,
      potentialSavings: currentCost.totalOvertimeHours * (employees[0]?.hourlyRate || 30) * 0.5,
    });
  }
  
  // Sugestia 2: Optymalizacja zmian nocnych
  const nightShifts = shifts.filter(s => isNightShift(s.startTime, s.endTime));
  if (nightShifts.length > 0) {
    suggestions.push({
      type: 'optimize_night_shifts',
      priority: 'medium',
      message: `Rozważ reorganizację ${nightShifts.length} zmian nocnych`,
      potentialSavings: nightShifts.length * 8 * (employees[0]?.hourlyRate || 30) * 0.2,
    });
  }
  
  // Sugestia 3: Wykorzystanie tańszych pracowników
  const sortedByRate = [...employees].sort((a, b) => a.hourlyRate - b.hourlyRate);
  if (sortedByRate.length > 1) {
    const cheapest = sortedByRate[0];
    const mostExpensive = sortedByRate[sortedByRate.length - 1];
    const rateDiff = mostExpensive.hourlyRate - cheapest.hourlyRate;
    
    if (rateDiff > 5) {
      suggestions.push({
        type: 'balance_staff',
        priority: 'medium',
        message: `Rozważ większe wykorzystanie pracowników z niższymi stawkami`,
        potentialSavings: rateDiff * 40, // przykładowe 40h
      });
    }
  }
  
  return {
    needsOptimization: true,
    currentCost: currentCost.totalCost,
    budget,
    overBudget,
    suggestions: suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
  };
};

/**
 * Prognoza kosztów na podstawie wzorców
 */
const forecastCosts = (historicalShifts, employees, forecastPeriodDays = 30) => {
  if (historicalShifts.length === 0) {
    return {
      forecastedCost: 0,
      confidence: 'low',
      message: 'Brak danych historycznych do prognozy',
    };
  }
  
  const historicalCost = calculateScheduleCost(historicalShifts, employees);
  const historicalDays = getDateRange(historicalShifts);
  
  if (historicalDays === 0) {
    return {
      forecastedCost: 0,
      confidence: 'low',
      message: 'Niewystarczające dane historyczne',
    };
  }
  
  const dailyAverage = historicalCost.totalCost / historicalDays;
  const forecastedCost = dailyAverage * forecastPeriodDays;
  
  // Określenie pewności prognozy
  let confidence = 'low';
  if (historicalDays >= 30) confidence = 'high';
  else if (historicalDays >= 14) confidence = 'medium';
  
  return {
    forecastedCost: Math.round(forecastedCost * 100) / 100,
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    confidence,
    basedOnDays: historicalDays,
    forecastPeriodDays,
  };
};

// Helper: Zakres dat w dniach
const getDateRange = (shifts) => {
  if (shifts.length === 0) return 0;
  
  const dates = shifts.map(s => new Date(s.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  
  return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
};

module.exports = {
  calculateShiftCost,
  calculateScheduleCost,
  optimizeCosts,
  forecastCosts,
};
