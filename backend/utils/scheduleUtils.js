/**
 * Schedule utility functions for validation and calculations
 */

/**
 * Calculate hours between two time strings (HH:MM format)
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} Hours worked (handles overnight shifts)
 */
function calculateHours(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  
  // Handle overnight shifts
  if (minutes < 0) {
    minutes += 24 * 60;
  }
  
  return minutes / 60;
}

/**
 * Calculate total hours for an employee in a given period
 * @param {Array} assignments - Array of schedule assignments
 * @returns {Object} Summary with total hours, overtime, etc.
 */
function calculateEmployeeHours(assignments) {
  let totalHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let nightHours = 0;
  let weekendHours = 0;
  
  assignments.forEach(assignment => {
    const hours = calculateHours(assignment.startTime, assignment.endTime);
    totalHours += hours;
    
    // Check if it's a weekend
    const date = new Date(assignment.date);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
      weekendHours += hours;
    }
    
    // Check for night hours (22:00 - 06:00)
    const [startHour] = assignment.startTime.split(':').map(Number);
    const [endHour] = assignment.endTime.split(':').map(Number);
    
    if (startHour >= 22 || startHour < 6 || endHour >= 22 || endHour <= 6) {
      nightHours += hours;
    }
    
    // Classify as regular or overtime (simple: >8h per day or >40h per week)
    if (hours > 8) {
      regularHours += 8;
      overtimeHours += (hours - 8);
    } else {
      regularHours += hours;
    }
  });
  
  return {
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    nightHours: Math.round(nightHours * 100) / 100,
    weekendHours: Math.round(weekendHours * 100) / 100,
    daysWorked: assignments.length
  };
}

/**
 * Validate schedule against Polish labor law constraints
 * @param {Array} assignments - Array of schedule assignments for an employee
 * @returns {Object} Validation result with violations
 */
function validateSchedule(assignments) {
  const violations = [];
  
  // Sort assignments by date
  const sortedAssignments = [...assignments].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // Check for minimum daily rest (11 hours between shifts)
  for (let i = 0; i < sortedAssignments.length - 1; i++) {
    const current = sortedAssignments[i];
    const next = sortedAssignments[i + 1];
    
    const currentEnd = new Date(current.date);
    const [endHour, endMin] = current.endTime.split(':').map(Number);
    currentEnd.setHours(endHour, endMin, 0, 0);
    
    const nextStart = new Date(next.date);
    const [startHour, startMin] = next.startTime.split(':').map(Number);
    nextStart.setHours(startHour, startMin, 0, 0);
    
    const restHours = (nextStart - currentEnd) / (1000 * 60 * 60);
    
    if (restHours < 11) {
      violations.push({
        type: 'INSUFFICIENT_REST',
        severity: 'high',
        message: `Niewystarczający odpoczynek między zmianami (${Math.round(restHours)}h zamiast 11h)`,
        date: current.date,
        details: {
          currentShift: `${current.date} ${current.startTime}-${current.endTime}`,
          nextShift: `${next.date} ${next.startTime}-${next.endTime}`,
          restHours: Math.round(restHours * 10) / 10
        }
      });
    }
  }
  
  // Check for weekly rest (35 hours continuous rest per week)
  // Group by week
  const weeklyGroups = {};
  sortedAssignments.forEach(assignment => {
    const date = new Date(assignment.date);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    if (!weeklyGroups[weekKey]) {
      weeklyGroups[weekKey] = [];
    }
    weeklyGroups[weekKey].push(assignment);
  });
  
  Object.entries(weeklyGroups).forEach(([week, weekAssignments]) => {
    // Check if there's a 35-hour gap
    let maxGap = 0;
    for (let i = 0; i < weekAssignments.length - 1; i++) {
      const current = weekAssignments[i];
      const next = weekAssignments[i + 1];
      
      const currentEnd = new Date(current.date);
      const [endHour, endMin] = current.endTime.split(':').map(Number);
      currentEnd.setHours(endHour, endMin, 0, 0);
      
      const nextStart = new Date(next.date);
      const [startHour, startMin] = next.startTime.split(':').map(Number);
      nextStart.setHours(startHour, startMin, 0, 0);
      
      const gap = (nextStart - currentEnd) / (1000 * 60 * 60);
      maxGap = Math.max(maxGap, gap);
    }
    
    if (maxGap < 35 && weekAssignments.length > 1) {
      violations.push({
        type: 'INSUFFICIENT_WEEKLY_REST',
        severity: 'high',
        message: `Brak 35-godzinnego odpoczynku tygodniowego (maksymalna przerwa: ${Math.round(maxGap)}h)`,
        week,
        details: {
          maxGap: Math.round(maxGap * 10) / 10,
          required: 35
        }
      });
    }
  });
  
  // Check for maximum weekly hours (48 hours average over 4 months)
  const summary = calculateEmployeeHours(sortedAssignments);
  const weeks = Object.keys(weeklyGroups).length;
  const avgWeeklyHours = weeks > 0 ? summary.totalHours / weeks : 0;
  
  if (avgWeeklyHours > 48) {
    violations.push({
      type: 'EXCESSIVE_WEEKLY_HOURS',
      severity: 'medium',
      message: `Przekroczenie średniego tygodniowego czasu pracy (${Math.round(avgWeeklyHours)}h zamiast max 48h)`,
      details: {
        avgWeeklyHours: Math.round(avgWeeklyHours * 10) / 10,
        totalHours: summary.totalHours,
        weeks
      }
    });
  }
  
  // Check for maximum daily hours (typically 8h, max 12h with overtime)
  sortedAssignments.forEach(assignment => {
    const hours = calculateHours(assignment.startTime, assignment.endTime);
    if (hours > 12) {
      violations.push({
        type: 'EXCESSIVE_DAILY_HOURS',
        severity: 'high',
        message: `Przekroczenie maksymalnego dziennego czasu pracy (${Math.round(hours)}h zamiast max 12h)`,
        date: assignment.date,
        details: {
          hours: Math.round(hours * 10) / 10,
          shift: `${assignment.startTime}-${assignment.endTime}`
        }
      });
    }
  });
  
  return {
    isValid: violations.length === 0,
    violations,
    summary: {
      totalViolations: violations.length,
      highSeverity: violations.filter(v => v.severity === 'high').length,
      mediumSeverity: violations.filter(v => v.severity === 'medium').length,
      lowSeverity: violations.filter(v => v.severity === 'low').length
    }
  };
}

/**
 * Get ISO week number for a date
 * @param {Date} date
 * @returns {number} Week number
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Check for conflicts with leave requests
 * @param {Array} assignments - Schedule assignments
 * @param {Array} leaves - Leave requests
 * @returns {Array} Conflicts found
 */
function checkLeaveConflicts(assignments, leaves) {
  const conflicts = [];
  
  assignments.forEach(assignment => {
    const assignmentDate = new Date(assignment.date).toISOString().split('T')[0];
    
    leaves.forEach(leave => {
      const leaveStart = new Date(leave.startDate).toISOString().split('T')[0];
      const leaveEnd = new Date(leave.endDate).toISOString().split('T')[0];
      
      if (assignmentDate >= leaveStart && assignmentDate <= leaveEnd) {
        conflicts.push({
          type: 'LEAVE_CONFLICT',
          severity: 'high',
          message: `Zmiana zaplanowana w czasie urlopu/L4`,
          date: assignment.date,
          details: {
            leaveType: leave.type,
            leaveStatus: leave.status,
            leaveRange: `${leaveStart} - ${leaveEnd}`
          }
        });
      }
    });
  });
  
  return conflicts;
}

module.exports = {
  calculateHours,
  calculateEmployeeHours,
  validateSchedule,
  checkLeaveConflicts,
  getWeekNumber
};
