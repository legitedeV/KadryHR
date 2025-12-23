/**
 * Walidator zgodności z Kodeksem Pracy
 * Sprawdza grafiki pod kątem zgodności z polskim prawem pracy
 */

class LaborLawValidator {
  constructor() {
    this.rules = {
      MAX_DAILY_HOURS: 8,
      MAX_DAILY_HOURS_EXTENDED: 12, // system równoważny
      MAX_WEEKLY_HOURS: 40,
      MAX_WEEKLY_HOURS_AVERAGE: 48, // średnio w okresie rozliczeniowym
      MIN_DAILY_REST: 11, // godziny
      MIN_WEEKLY_REST: 35, // godziny
      MAX_OVERTIME_YEARLY: 150, // godziny
      NIGHT_SHIFT_START: 21, // 21:00
      NIGHT_SHIFT_END: 7, // 7:00
      MAX_NIGHT_SHIFTS_CONSECUTIVE: 3,
      MIN_SUNDAYS_OFF_PER_4_WEEKS: 2
    };

    // Polskie święta 2025
    this.holidays = [
      '2025-01-01', '2025-01-06', '2025-04-20', '2025-04-21',
      '2025-05-01', '2025-05-03', '2025-06-08', '2025-06-19',
      '2025-08-15', '2025-11-01', '2025-11-11', '2025-12-25', '2025-12-26'
    ];
  }

  /**
   * Główna metoda walidacji grafiku
   */
  validateSchedule(assignments, employees) {
    const violations = [];
    const warnings = [];
    
    employees.forEach(employee => {
      const employeeAssignments = assignments.filter(
        a => a.employee?.toString() === employee._id.toString() ||
             a.employeeId?.toString() === employee._id.toString()
      );
      
      if (employeeAssignments.length === 0) return;

      // Group by date
      const byDate = this.groupByDate(employeeAssignments);
      const dates = Object.keys(byDate).sort();
      
      // Check each day
      dates.forEach((date, index) => {
        const dayAssignments = byDate[date];
        
        // 1. Daily hours check
        const dailyHours = this.calculateTotalHours(dayAssignments);
        if (dailyHours > this.rules.MAX_DAILY_HOURS) {
          if (dailyHours > this.rules.MAX_DAILY_HOURS_EXTENDED) {
            violations.push({
              type: 'DAILY_HOURS_EXCEEDED',
              severity: 'critical',
              employee: `${employee.firstName} ${employee.lastName}`,
              employeeId: employee._id,
              date,
              hours: dailyHours,
              limit: this.rules.MAX_DAILY_HOURS_EXTENDED,
              message: `Przekroczono maksymalny czas pracy (${dailyHours.toFixed(1)}h > ${this.rules.MAX_DAILY_HOURS_EXTENDED}h)`,
              suggestion: 'Zmniejsz liczbę godzin lub podziel zmianę między pracowników'
            });
          } else {
            warnings.push({
              type: 'DAILY_HOURS_WARNING',
              severity: 'medium',
              employee: `${employee.firstName} ${employee.lastName}`,
              employeeId: employee._id,
              date,
              hours: dailyHours,
              message: `Praca powyżej 8h wymaga systemu równoważnego (${dailyHours.toFixed(1)}h)`,
              suggestion: 'Upewnij się, że pracownik jest w systemie równoważnym czasu pracy'
            });
          }
        }
        
        // 2. Rest period check (between days)
        if (index < dates.length - 1) {
          const nextDate = dates[index + 1];
          const nextDayAssignments = byDate[nextDate];
          
          if (nextDayAssignments && nextDayAssignments.length > 0) {
            const lastEndTime = this.getLatestEndTime(dayAssignments);
            const nextStartTime = this.getEarliestStartTime(nextDayAssignments);
            const restHours = this.calculateRestPeriod(date, lastEndTime, nextDate, nextStartTime);
            
            if (restHours < this.rules.MIN_DAILY_REST) {
              violations.push({
                type: 'INSUFFICIENT_REST',
                severity: 'critical',
                employee: `${employee.firstName} ${employee.lastName}`,
                employeeId: employee._id,
                date,
                nextDate,
                restHours: restHours.toFixed(1),
                limit: this.rules.MIN_DAILY_REST,
                message: `Niewystarczający odpoczynek dobowy (${restHours.toFixed(1)}h < ${this.rules.MIN_DAILY_REST}h)`,
                suggestion: 'Przesuń zmianę następnego dnia lub zakończ wcześniej zmianę bieżącą'
              });
            }
          }
        }
      });
      
      // 3. Weekly hours check
      const weeks = this.groupByWeek(employeeAssignments);
      Object.keys(weeks).forEach(weekKey => {
        const weekAssignments = weeks[weekKey];
        const weeklyHours = this.calculateTotalHours(weekAssignments);
        
        if (weeklyHours > this.rules.MAX_WEEKLY_HOURS) {
          if (weeklyHours > this.rules.MAX_WEEKLY_HOURS_AVERAGE) {
            violations.push({
              type: 'WEEKLY_HOURS_EXCEEDED',
              severity: 'high',
              employee: `${employee.firstName} ${employee.lastName}`,
              employeeId: employee._id,
              week: weekKey,
              hours: weeklyHours.toFixed(1),
              limit: this.rules.MAX_WEEKLY_HOURS_AVERAGE,
              message: `Przekroczono maksymalny czas pracy tygodniowo (${weeklyHours.toFixed(1)}h > ${this.rules.MAX_WEEKLY_HOURS_AVERAGE}h)`,
              suggestion: 'Zmniejsz liczbę zmian lub skróć godziny pracy'
            });
          } else {
            warnings.push({
              type: 'WEEKLY_HOURS_WARNING',
              severity: 'medium',
              employee: `${employee.firstName} ${employee.lastName}`,
              employeeId: employee._id,
              week: weekKey,
              hours: weeklyHours.toFixed(1),
              message: `Praca powyżej 40h/tydzień (${weeklyHours.toFixed(1)}h) - sprawdź średnią w okresie rozliczeniowym`,
              suggestion: 'Upewnij się, że średnia w okresie rozliczeniowym nie przekracza 48h/tydzień'
            });
          }
        }
        
        // Weekly rest check
        const weeklyRest = this.calculateWeeklyRest(weekAssignments);
        if (weeklyRest < this.rules.MIN_WEEKLY_REST) {
          violations.push({
            type: 'INSUFFICIENT_WEEKLY_REST',
            severity: 'critical',
            employee: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee._id,
            week: weekKey,
            restHours: weeklyRest.toFixed(1),
            limit: this.rules.MIN_WEEKLY_REST,
            message: `Niewystarczający odpoczynek tygodniowy (${weeklyRest.toFixed(1)}h < ${this.rules.MIN_WEEKLY_REST}h)`,
            suggestion: 'Dodaj dzień wolny lub zmniejsz godziny pracy'
          });
        }
      });
      
      // 4. Sunday work check
      const sundays = this.getSundayAssignments(employeeAssignments);
      const fourWeekPeriods = this.groupByFourWeeks(sundays);
      
      fourWeekPeriods.forEach(period => {
        const sundaysWorked = period.sundays.length;
        const sundaysOff = 4 - sundaysWorked;
        
        if (sundaysOff < this.rules.MIN_SUNDAYS_OFF_PER_4_WEEKS) {
          violations.push({
            type: 'SUNDAY_WORK_EXCEEDED',
            severity: 'high',
            employee: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee._id,
            period: period.range,
            sundaysWorked,
            sundaysOff,
            limit: this.rules.MIN_SUNDAYS_OFF_PER_4_WEEKS,
            message: `Za mało niedziel wolnych (${sundaysOff} < ${this.rules.MIN_SUNDAYS_OFF_PER_4_WEEKS} w okresie 4 tygodni)`,
            suggestion: 'Dodaj wolne niedziele lub zmniejsz liczbę zmian niedzielnych'
          });
        }
      });
      
      // 5. Night shifts check
      const nightShifts = this.getNightShifts(employeeAssignments);
      const consecutiveNights = this.getMaxConsecutiveNightShifts(nightShifts);
      
      if (consecutiveNights > this.rules.MAX_NIGHT_SHIFTS_CONSECUTIVE) {
        warnings.push({
          type: 'CONSECUTIVE_NIGHT_SHIFTS',
          severity: 'medium',
          employee: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee._id,
          consecutive: consecutiveNights,
          limit: this.rules.MAX_NIGHT_SHIFTS_CONSECUTIVE,
          message: `Zbyt wiele kolejnych zmian nocnych (${consecutiveNights} > ${this.rules.MAX_NIGHT_SHIFTS_CONSECUTIVE})`,
          suggestion: 'Dodaj dzień przerwy między zmianami nocnymi'
        });
      }
    });
    
    return {
      isValid: violations.length === 0,
      violations,
      warnings,
      complianceScore: this.calculateComplianceScore(violations, warnings),
      summary: {
        totalViolations: violations.length,
        criticalViolations: violations.filter(v => v.severity === 'critical').length,
        highViolations: violations.filter(v => v.severity === 'high').length,
        totalWarnings: warnings.length
      }
    };
  }

  /**
   * Helper methods
   */

  groupByDate(assignments) {
    const grouped = {};
    assignments.forEach(a => {
      const date = new Date(a.date).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(a);
    });
    return grouped;
  }

  groupByWeek(assignments) {
    const grouped = {};
    assignments.forEach(a => {
      const date = new Date(a.date);
      const weekKey = this.getWeekKey(date);
      if (!grouped[weekKey]) grouped[weekKey] = [];
      grouped[weekKey].push(a);
    });
    return grouped;
  }

  getWeekKey(date) {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  calculateTotalHours(assignments) {
    return assignments.reduce((total, a) => {
      return total + this.calculateHours(a.startTime, a.endTime);
    }, 0);
  }

  calculateHours(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let hours = endH - startH;
    let minutes = endM - startM;
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    // Handle overnight shifts
    if (hours < 0) {
      hours += 24;
    }
    
    return hours + (minutes / 60);
  }

  calculateRestPeriod(date1, endTime, date2, startTime) {
    const end = new Date(date1);
    const [endH, endM] = endTime.split(':').map(Number);
    end.setHours(endH, endM, 0, 0);
    
    const start = new Date(date2);
    const [startH, startM] = startTime.split(':').map(Number);
    start.setHours(startH, startM, 0, 0);
    
    const diffMs = start - end;
    return diffMs / (1000 * 60 * 60); // hours
  }

  getLatestEndTime(assignments) {
    return assignments.reduce((latest, a) => {
      const [h, m] = a.endTime.split(':').map(Number);
      const [latestH, latestM] = latest.split(':').map(Number);
      
      if (h > latestH || (h === latestH && m > latestM)) {
        return a.endTime;
      }
      return latest;
    }, '00:00');
  }

  getEarliestStartTime(assignments) {
    return assignments.reduce((earliest, a) => {
      const [h, m] = a.startTime.split(':').map(Number);
      const [earliestH, earliestM] = earliest.split(':').map(Number);
      
      if (h < earliestH || (h === earliestH && m < earliestM)) {
        return a.startTime;
      }
      return earliest;
    }, '23:59');
  }

  calculateWeeklyRest(weekAssignments) {
    // Find longest continuous rest period in week
    const sorted = weekAssignments.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    let maxRest = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const rest = this.calculateRestPeriod(
        sorted[i].date,
        sorted[i].endTime,
        sorted[i + 1].date,
        sorted[i + 1].startTime
      );
      maxRest = Math.max(maxRest, rest);
    }
    
    return maxRest;
  }

  getSundayAssignments(assignments) {
    return assignments.filter(a => {
      const date = new Date(a.date);
      return date.getDay() === 0; // Sunday
    });
  }

  groupByFourWeeks(sundayAssignments) {
    const periods = [];
    const sorted = sundayAssignments.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    for (let i = 0; i < sorted.length; i += 4) {
      const chunk = sorted.slice(i, i + 4);
      if (chunk.length > 0) {
        periods.push({
          range: `${chunk[0].date} - ${chunk[chunk.length - 1].date}`,
          sundays: chunk
        });
      }
    }
    
    return periods;
  }

  getNightShifts(assignments) {
    return assignments.filter(a => this.isNightShift(a.startTime, a.endTime));
  }

  isNightShift(startTime, endTime) {
    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);
    
    // Night shift: 21:00-7:00
    return startH >= this.rules.NIGHT_SHIFT_START || 
           endH <= this.rules.NIGHT_SHIFT_END ||
           (startH < this.rules.NIGHT_SHIFT_END && endH <= this.rules.NIGHT_SHIFT_END);
  }

  getMaxConsecutiveNightShifts(nightShifts) {
    if (nightShifts.length === 0) return 0;
    
    const sorted = nightShifts.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].date);
      const currDate = new Date(sorted[i].date);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }
    
    return maxConsecutive;
  }

  isHoliday(date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    return this.holidays.includes(dateStr);
  }

  calculateComplianceScore(violations, warnings) {
    let score = 100;
    
    // Penalties
    score -= violations.filter(v => v.severity === 'critical').length * 20;
    score -= violations.filter(v => v.severity === 'high').length * 10;
    score -= violations.filter(v => v.severity === 'medium').length * 5;
    score -= warnings.filter(w => w.severity === 'medium').length * 3;
    score -= warnings.filter(w => w.severity === 'low').length * 1;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Quick validation for single assignment
   */
  validateAssignment(assignment, employee, existingAssignments) {
    const violations = [];
    
    // Check if adding this assignment would violate rules
    const date = new Date(assignment.date).toISOString().split('T')[0];
    const dayAssignments = existingAssignments.filter(a => {
      const aDate = new Date(a.date).toISOString().split('T')[0];
      return aDate === date && a.employeeId?.toString() === employee._id.toString();
    });
    
    const totalHours = this.calculateTotalHours([...dayAssignments, assignment]);
    
    if (totalHours > this.rules.MAX_DAILY_HOURS_EXTENDED) {
      violations.push({
        type: 'DAILY_HOURS_EXCEEDED',
        message: `Dodanie tej zmiany spowoduje przekroczenie limitu godzin (${totalHours.toFixed(1)}h > ${this.rules.MAX_DAILY_HOURS_EXTENDED}h)`
      });
    }
    
    return {
      isValid: violations.length === 0,
      violations
    };
  }
}

module.exports = LaborLawValidator;
