/**
 * Walidator zgodności z Kodeksem Pracy RP
 * Sprawdza zgodność grafików z przepisami prawa pracy
 */

// Konwersja "HH:MM" na minuty od północy
const toMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Obliczanie długości zmiany w godzinach
const calculateShiftDuration = (startTime, endTime) => {
  let start = toMinutes(startTime);
  let end = toMinutes(endTime);
  
  // Jeśli zmiana przechodzi przez północ
  if (end < start) {
    end += 24 * 60;
  }
  
  return (end - start) / 60;
};

// Sprawdzenie czy zmiana jest nocna (22:00 - 06:00)
const isNightShift = (startTime, endTime) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const nightStart = toMinutes('22:00');
  const nightEnd = toMinutes('06:00');
  
  // Praca nocna to praca w godzinach 22:00-06:00
  // Sprawdzamy czy zmiana zawiera co najmniej 3 godziny w tym przedziale
  if (start >= nightStart || end <= nightEnd) {
    return true;
  }
  
  return false;
};

/**
 * Walidacja minimalnego odpoczynku dobowego (11 godzin)
 * Art. 132 Kodeksu Pracy
 */
const validateDailyRest = (previousShift, currentShift) => {
  if (!previousShift) return { valid: true };
  
  const prevEnd = new Date(previousShift.date);
  prevEnd.setHours(0, 0, 0, 0);
  const prevEndMinutes = toMinutes(previousShift.endTime);
  prevEnd.setMinutes(prevEndMinutes);
  
  const currStart = new Date(currentShift.date);
  currStart.setHours(0, 0, 0, 0);
  const currStartMinutes = toMinutes(currentShift.startTime);
  currStart.setMinutes(currStartMinutes);
  
  const restHours = (currStart - prevEnd) / (1000 * 60 * 60);
  
  if (restHours < 11) {
    return {
      valid: false,
      severity: 'error',
      message: `Naruszenie minimalnego odpoczynku dobowego. Wymagane: 11h, faktyczne: ${restHours.toFixed(1)}h`,
      article: 'Art. 132 KP',
    };
  }
  
  return { valid: true };
};

/**
 * Walidacja maksymalnego czasu pracy (8h/dzień, 40h/tydzień)
 * Art. 129 Kodeksu Pracy
 */
const validateMaxWorkingHours = (shifts, period = 'day') => {
  const violations = [];
  
  if (period === 'day') {
    shifts.forEach(shift => {
      const duration = calculateShiftDuration(shift.startTime, shift.endTime);
      if (duration > 8) {
        violations.push({
          valid: false,
          severity: 'warning',
          message: `Przekroczenie dobowego czasu pracy: ${duration.toFixed(1)}h (norma: 8h)`,
          article: 'Art. 129 KP',
          shift,
        });
      }
    });
  } else if (period === 'week') {
    // Grupowanie zmian po tygodniach
    const weeklyHours = {};
    
    shifts.forEach(shift => {
      const date = new Date(shift.date);
      const weekKey = getWeekKey(date);
      
      if (!weeklyHours[weekKey]) {
        weeklyHours[weekKey] = 0;
      }
      
      weeklyHours[weekKey] += calculateShiftDuration(shift.startTime, shift.endTime);
    });
    
    Object.entries(weeklyHours).forEach(([week, hours]) => {
      if (hours > 40) {
        violations.push({
          valid: false,
          severity: 'warning',
          message: `Przekroczenie tygodniowego czasu pracy w tygodniu ${week}: ${hours.toFixed(1)}h (norma: 40h)`,
          article: 'Art. 129 KP',
        });
      }
    });
  }
  
  return violations.length > 0 ? violations : [{ valid: true }];
};

/**
 * Walidacja nadgodzin (maksymalnie 150h/rok, 48h/miesiąc)
 * Art. 151 Kodeksu Pracy
 */
const validateOvertime = (shifts, period = 'month') => {
  let totalOvertime = 0;
  const violations = [];
  
  shifts.forEach(shift => {
    const duration = calculateShiftDuration(shift.startTime, shift.endTime);
    const overtime = Math.max(0, duration - 8);
    totalOvertime += overtime;
  });
  
  const limit = period === 'month' ? 48 : 150;
  
  if (totalOvertime > limit) {
    violations.push({
      valid: false,
      severity: 'error',
      message: `Przekroczenie limitu nadgodzin (${period}): ${totalOvertime.toFixed(1)}h (limit: ${limit}h)`,
      article: 'Art. 151 KP',
    });
  }
  
  return violations.length > 0 ? violations : [{ valid: true }];
};

/**
 * Walidacja pracy nocnej
 * Art. 151^7 Kodeksu Pracy
 */
const validateNightWork = (shifts) => {
  const violations = [];
  let consecutiveNights = 0;
  let totalNightHours = 0;
  
  shifts.forEach((shift, index) => {
    if (isNightShift(shift.startTime, shift.endTime)) {
      consecutiveNights++;
      totalNightHours += calculateShiftDuration(shift.startTime, shift.endTime);
      
      // Maksymalnie 8 godzin na dobę dla pracy nocnej
      const duration = calculateShiftDuration(shift.startTime, shift.endTime);
      if (duration > 8) {
        violations.push({
          valid: false,
          severity: 'error',
          message: `Przekroczenie dobowego czasu pracy nocnej: ${duration.toFixed(1)}h (limit: 8h)`,
          article: 'Art. 151^7 KP',
          shift,
        });
      }
    } else {
      consecutiveNights = 0;
    }
    
    // Ostrzeżenie przy długich seriach pracy nocnej
    if (consecutiveNights > 5) {
      violations.push({
        valid: false,
        severity: 'warning',
        message: `Długa seria pracy nocnej: ${consecutiveNights} kolejnych nocy`,
        article: 'Art. 151^7 KP',
      });
    }
  });
  
  return violations.length > 0 ? violations : [{ valid: true }];
};

/**
 * Walidacja odpoczynku tygodniowego (35 godzin nieprzerwanie)
 * Art. 133 Kodeksu Pracy
 */
const validateWeeklyRest = (shifts) => {
  const violations = [];
  const sortedShifts = [...shifts].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let consecutiveDays = 0;
  let lastDate = null;
  
  sortedShifts.forEach(shift => {
    const currentDate = new Date(shift.date);
    
    if (lastDate) {
      const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        consecutiveDays++;
      } else {
        consecutiveDays = 1;
      }
      
      // Ostrzeżenie przy więcej niż 6 kolejnych dni pracy
      if (consecutiveDays > 6) {
        violations.push({
          valid: false,
          severity: 'error',
          message: `Brak odpoczynku tygodniowego: ${consecutiveDays} kolejnych dni pracy`,
          article: 'Art. 133 KP',
        });
      }
    } else {
      consecutiveDays = 1;
    }
    
    lastDate = currentDate;
  });
  
  return violations.length > 0 ? violations : [{ valid: true }];
};

/**
 * Kompleksowa walidacja grafiku
 */
const validateSchedule = (shifts, options = {}) => {
  const {
    checkDailyRest = true,
    checkMaxHours = true,
    checkOvertime = true,
    checkNightWork = true,
    checkWeeklyRest = true,
  } = options;
  
  const violations = [];
  const sortedShifts = [...shifts].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Walidacja minimalnego odpoczynku między zmianami
  if (checkDailyRest) {
    for (let i = 1; i < sortedShifts.length; i++) {
      const result = validateDailyRest(sortedShifts[i - 1], sortedShifts[i]);
      if (!result.valid) {
        violations.push(result);
      }
    }
  }
  
  // Walidacja maksymalnego czasu pracy
  if (checkMaxHours) {
    const dailyViolations = validateMaxWorkingHours(sortedShifts, 'day');
    const weeklyViolations = validateMaxWorkingHours(sortedShifts, 'week');
    violations.push(...dailyViolations.filter(v => !v.valid));
    violations.push(...weeklyViolations.filter(v => !v.valid));
  }
  
  // Walidacja nadgodzin
  if (checkOvertime) {
    const overtimeViolations = validateOvertime(sortedShifts, 'month');
    violations.push(...overtimeViolations.filter(v => !v.valid));
  }
  
  // Walidacja pracy nocnej
  if (checkNightWork) {
    const nightViolations = validateNightWork(sortedShifts);
    violations.push(...nightViolations.filter(v => !v.valid));
  }
  
  // Walidacja odpoczynku tygodniowego
  if (checkWeeklyRest) {
    const weeklyRestViolations = validateWeeklyRest(sortedShifts);
    violations.push(...weeklyRestViolations.filter(v => !v.valid));
  }
  
  return {
    isValid: violations.length === 0,
    violations,
    summary: {
      total: violations.length,
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
    },
  };
};

// Helper: Klucz tygodnia (rok-tydzień)
const getWeekKey = (date) => {
  const d = new Date(date);
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNum}`;
};

module.exports = {
  validateSchedule,
  validateDailyRest,
  validateMaxWorkingHours,
  validateOvertime,
  validateNightWork,
  validateWeeklyRest,
  calculateShiftDuration,
  isNightShift,
  toMinutes,
};
