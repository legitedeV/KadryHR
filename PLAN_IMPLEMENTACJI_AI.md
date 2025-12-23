# 🤖 Plan implementacji AI Auto-Schedule i kluczowych funkcji

## 🎯 Cel: Dorównać i przewyższyć Kadromierz.pl

---

## PRIORYTET 1: AI Auto-Schedule (2 tygodnie)

### Architektura rozwiązania

#### Backend: Algorytm optymalizacji grafiku

**Plik:** `backend/services/scheduleOptimizer.js`

```javascript
class ScheduleOptimizer {
  constructor(options) {
    this.employees = options.employees;
    this.availabilities = options.availabilities;
    this.constraints = options.constraints;
    this.forecast = options.forecast;
    this.budget = options.budget;
  }

  async optimize() {
    // 1. Przygotuj dane
    const workDays = this.generateWorkDays();
    const shifts = this.generateShifts();
    
    // 2. Genetic Algorithm
    let population = this.initializePopulation(100);
    
    for (let generation = 0; generation < 500; generation++) {
      // Evaluate fitness
      population = population.map(schedule => ({
        schedule,
        fitness: this.calculateFitness(schedule)
      }));
      
      // Sort by fitness
      population.sort((a, b) => b.fitness - a.fitness);
      
      // Selection (top 20%)
      const selected = population.slice(0, 20);
      
      // Crossover & Mutation
      const newPopulation = [];
      while (newPopulation.length < 100) {
        const parent1 = this.selectParent(selected);
        const parent2 = this.selectParent(selected);
        const child = this.crossover(parent1, parent2);
        const mutated = this.mutate(child);
        newPopulation.push(mutated);
      }
      
      population = newPopulation;
    }
    
    // Return best solution
    const best = population[0];
    return {
      schedule: best.schedule,
      fitness: best.fitness,
      violations: this.checkViolations(best.schedule),
      cost: this.calculateCost(best.schedule),
      coverage: this.calculateCoverage(best.schedule)
    };
  }

  calculateFitness(schedule) {
    let score = 100;
    
    // Penalties
    score -= this.laborLawViolations(schedule) * 50; // CRITICAL
    score -= this.availabilityMismatches(schedule) * 10;
    score -= this.underStaffing(schedule) * 20;
    score -= this.overStaffing(schedule) * 5;
    score -= this.budgetOverrun(schedule) * 30;
    
    // Bonuses
    score += this.employeeSatisfaction(schedule) * 5;
    score += this.costEfficiency(schedule) * 10;
    score += this.coverageQuality(schedule) * 15;
    
    return Math.max(0, score);
  }

  laborLawViolations(schedule) {
    let violations = 0;
    
    schedule.assignments.forEach(assignment => {
      const employee = this.employees.find(e => e._id === assignment.employeeId);
      
      // Check daily hours
      const dailyHours = this.getDailyHours(schedule, employee, assignment.date);
      if (dailyHours > 8) violations++;
      
      // Check weekly hours
      const weeklyHours = this.getWeeklyHours(schedule, employee, assignment.date);
      if (weeklyHours > 40) violations++;
      
      // Check rest period
      const restHours = this.getRestHours(schedule, employee, assignment.date);
      if (restHours < 11) violations += 2; // CRITICAL
      
      // Check weekly rest
      const weeklyRest = this.getWeeklyRest(schedule, employee, assignment.date);
      if (weeklyRest < 35) violations += 2; // CRITICAL
    });
    
    return violations;
  }

  availabilityMismatches(schedule) {
    let mismatches = 0;
    
    schedule.assignments.forEach(assignment => {
      const availability = this.availabilities.find(a => 
        a.employeeId === assignment.employeeId &&
        this.isDateInRange(assignment.date, a.startDate, a.endDate)
      );
      
      if (!availability || availability.type === 'unavailable') {
        mismatches++;
      }
    });
    
    return mismatches;
  }

  underStaffing(schedule) {
    let underStaffed = 0;
    
    schedule.assignments.forEach(assignment => {
      const required = this.forecast?.requiredStaff?.[assignment.date] || 
                      this.constraints.minStaffPerShift;
      const actual = this.getStaffCount(schedule, assignment.date, assignment.shift);
      
      if (actual < required) {
        underStaffed += (required - actual);
      }
    });
    
    return underStaffed;
  }

  calculateCost(schedule) {
    let totalCost = 0;
    
    schedule.assignments.forEach(assignment => {
      const employee = this.employees.find(e => e._id === assignment.employeeId);
      const hours = this.calculateHours(assignment.startTime, assignment.endTime);
      const rate = employee.hourlyRate || 30;
      
      // Base cost
      totalCost += hours * rate;
      
      // Overtime multiplier
      const weeklyHours = this.getWeeklyHours(schedule, employee, assignment.date);
      if (weeklyHours > 40) {
        const overtimeHours = weeklyHours - 40;
        totalCost += overtimeHours * rate * 0.5; // 50% extra
      }
      
      // Night shift bonus (20:00-6:00)
      if (this.isNightShift(assignment.startTime, assignment.endTime)) {
        totalCost += hours * rate * 0.2; // 20% extra
      }
      
      // Sunday/holiday bonus
      if (this.isSundayOrHoliday(assignment.date)) {
        totalCost += hours * rate; // 100% extra
      }
    });
    
    return totalCost;
  }
}
```

#### Endpoint implementacji

**Plik:** `backend/controllers/scheduleAIController.js`

```javascript
const ScheduleOptimizer = require('../services/scheduleOptimizer');

exports.generateAISchedule = async (req, res) => {
  try {
    const {
      month,
      year,
      employeeIds,
      constraints,
      forecast,
      budget
    } = req.body;

    // 1. Fetch employees
    const employees = await Employee.find({
      _id: { $in: employeeIds },
      isActive: true
    });

    // 2. Fetch availabilities
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const availabilities = await EmployeeAvailability.find({
      employee: { $in: employeeIds },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    // 3. Fetch forecast data (if provided)
    const forecastData = forecast || await generateDefaultForecast(startDate, endDate);

    // 4. Run optimizer
    const optimizer = new ScheduleOptimizer({
      employees,
      availabilities,
      constraints: {
        minStaffPerShift: constraints?.minStaffPerShift || 2,
        maxStaffPerShift: constraints?.maxStaffPerShift || 10,
        respectLaborLaws: true,
        ...constraints
      },
      forecast: forecastData,
      budget
    });

    const result = await optimizer.optimize();

    // 5. Save schedule
    const schedule = await Schedule.create({
      name: `AI Grafik ${month}/${year}`,
      month,
      year,
      status: 'draft',
      generatedBy: 'AI',
      aiMetadata: {
        fitness: result.fitness,
        violations: result.violations,
        cost: result.cost,
        coverage: result.coverage,
        algorithm: 'genetic',
        generations: 500
      }
    });

    // 6. Save assignments
    const assignments = await ShiftAssignment.insertMany(
      result.schedule.assignments.map(a => ({
        ...a,
        schedule: schedule._id
      }))
    );

    res.json({
      success: true,
      schedule,
      assignments,
      metadata: result.aiMetadata,
      recommendations: generateRecommendations(result)
    });

  } catch (error) {
    console.error('AI Schedule generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Nie udało się wygenerować grafiku',
      error: error.message
    });
  }
};

function generateRecommendations(result) {
  const recommendations = [];
  
  if (result.violations.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Wykryto naruszenia Kodeksu Pracy',
      description: `Znaleziono ${result.violations.length} naruszeń. Przejrzyj i popraw grafik.`,
      violations: result.violations
    });
  }
  
  if (result.cost > result.budget * 0.95) {
    recommendations.push({
      type: 'warning',
      title: 'Przekroczenie budżetu',
      description: `Koszt grafiku (${result.cost} PLN) przekracza 95% budżetu.`,
      suggestions: [
        'Zmniejsz liczbę zmian w weekendy',
        'Ogranicz nadgodziny',
        'Wykorzystaj pracowników z niższą stawką'
      ]
    });
  }
  
  if (result.coverage < 0.9) {
    recommendations.push({
      type: 'info',
      title: 'Niepełne pokrycie',
      description: `Pokrycie wynosi ${(result.coverage * 100).toFixed(1)}%. Rozważ dodanie pracowników.`
    });
  }
  
  return recommendations;
}
```

---

## PRIORYTET 2: Walidator Kodeksu Pracy (1 dzień)

### Implementacja

**Plik:** `backend/utils/laborLawValidator.js`

```javascript
class LaborLawValidator {
  constructor() {
    this.rules = {
      MAX_DAILY_HOURS: 8,
      MAX_DAILY_HOURS_EXTENDED: 12, // system równoważny
      MAX_WEEKLY_HOURS: 40,
      MAX_WEEKLY_HOURS_AVERAGE: 48, // średnio w okresie rozliczeniowym
      MIN_DAILY_REST: 11, // hours
      MIN_WEEKLY_REST: 35, // hours
      MAX_OVERTIME_YEARLY: 150, // hours
      NIGHT_SHIFT_START: 21, // 21:00
      NIGHT_SHIFT_END: 7, // 7:00
      MAX_NIGHT_SHIFTS_CONSECUTIVE: 3,
      MIN_SUNDAYS_OFF_PER_4_WEEKS: 2
    };
  }

  validateSchedule(schedule, employees) {
    const violations = [];
    const warnings = [];
    
    employees.forEach(employee => {
      const employeeAssignments = schedule.assignments.filter(
        a => a.employeeId.toString() === employee._id.toString()
      );
      
      // Group by date
      const byDate = this.groupByDate(employeeAssignments);
      
      // Check each day
      Object.keys(byDate).forEach(date => {
        const dayAssignments = byDate[date];
        
        // 1. Daily hours check
        const dailyHours = this.calculateTotalHours(dayAssignments);
        if (dailyHours > this.rules.MAX_DAILY_HOURS) {
          if (dailyHours > this.rules.MAX_DAILY_HOURS_EXTENDED) {
            violations.push({
              type: 'DAILY_HOURS_EXCEEDED',
              severity: 'critical',
              employee: employee.firstName + ' ' + employee.lastName,
              date,
              hours: dailyHours,
              limit: this.rules.MAX_DAILY_HOURS_EXTENDED,
              message: `Przekroczono maksymalny czas pracy (${dailyHours}h > ${this.rules.MAX_DAILY_HOURS_EXTENDED}h)`
            });
          } else {
            warnings.push({
              type: 'DAILY_HOURS_WARNING',
              severity: 'medium',
              employee: employee.firstName + ' ' + employee.lastName,
              date,
              hours: dailyHours,
              message: `Praca powyżej 8h wymaga systemu równoważnego (${dailyHours}h)`
            });
          }
        }
        
        // 2. Rest period check
        const nextDayAssignments = byDate[this.getNextDay(date)];
        if (nextDayAssignments && nextDayAssignments.length > 0) {
          const restHours = this.calculateRestPeriod(
            dayAssignments[dayAssignments.length - 1].endTime,
            nextDayAssignments[0].startTime
          );
          
          if (restHours < this.rules.MIN_DAILY_REST) {
            violations.push({
              type: 'INSUFFICIENT_REST',
              severity: 'critical',
              employee: employee.firstName + ' ' + employee.lastName,
              date,
              restHours,
              limit: this.rules.MIN_DAILY_REST,
              message: `Niewystarczający odpoczynek dobowy (${restHours}h < ${this.rules.MIN_DAILY_REST}h)`
            });
          }
        }
      });
      
      // 3. Weekly hours check
      const weeks = this.groupByWeek(employeeAssignments);
      Object.keys(weeks).forEach(week => {
        const weeklyHours = this.calculateTotalHours(weeks[week]);
        
        if (weeklyHours > this.rules.MAX_WEEKLY_HOURS) {
          if (weeklyHours > this.rules.MAX_WEEKLY_HOURS_AVERAGE) {
            violations.push({
              type: 'WEEKLY_HOURS_EXCEEDED',
              severity: 'high',
              employee: employee.firstName + ' ' + employee.lastName,
              week,
              hours: weeklyHours,
              limit: this.rules.MAX_WEEKLY_HOURS_AVERAGE,
              message: `Przekroczono maksymalny czas pracy tygodniowo (${weeklyHours}h > ${this.rules.MAX_WEEKLY_HOURS_AVERAGE}h)`
            });
          } else {
            warnings.push({
              type: 'WEEKLY_HOURS_WARNING',
              severity: 'medium',
              employee: employee.firstName + ' ' + employee.lastName,
              week,
              hours: weeklyHours,
              message: `Praca powyżej 40h/tydzień (${weeklyHours}h) - sprawdź średnią w okresie rozliczeniowym`
            });
          }
        }
      });
      
      // 4. Sunday work check
      const sundays = this.getSundays(employeeAssignments);
      const fourWeekPeriods = this.groupByFourWeeks(sundays);
      
      fourWeekPeriods.forEach(period => {
        const sundaysOff = 4 - period.length;
        if (sundaysOff < this.rules.MIN_SUNDAYS_OFF_PER_4_WEEKS) {
          violations.push({
            type: 'SUNDAY_WORK_EXCEEDED',
            severity: 'high',
            employee: employee.firstName + ' ' + employee.lastName,
            period: period.range,
            sundaysWorked: period.length,
            message: `Za mało niedziel wolnych (${sundaysOff} < ${this.rules.MIN_SUNDAYS_OFF_PER_4_WEEKS} w okresie 4 tygodni)`
          });
        }
      });
      
      // 5. Night shifts check
      const nightShifts = this.getNightShifts(employeeAssignments);
      const consecutiveNights = this.getConsecutiveNightShifts(nightShifts);
      
      if (consecutiveNights > this.rules.MAX_NIGHT_SHIFTS_CONSECUTIVE) {
        warnings.push({
          type: 'CONSECUTIVE_NIGHT_SHIFTS',
          severity: 'medium',
          employee: employee.firstName + ' ' + employee.lastName,
          consecutive: consecutiveNights,
          message: `Zbyt wiele kolejnych zmian nocnych (${consecutiveNights} > ${this.rules.MAX_NIGHT_SHIFTS_CONSECUTIVE})`
        });
      }
    });
    
    return {
      isValid: violations.length === 0,
      violations,
      warnings,
      complianceScore: this.calculateComplianceScore(violations, warnings)
    };
  }

  calculateComplianceScore(violations, warnings) {
    let score = 100;
    score -= violations.filter(v => v.severity === 'critical').length * 20;
    score -= violations.filter(v => v.severity === 'high').length * 10;
    score -= warnings.filter(w => w.severity === 'medium').length * 5;
    return Math.max(0, score);
  }

  // Helper methods
  groupByDate(assignments) { /* ... */ }
  groupByWeek(assignments) { /* ... */ }
  calculateTotalHours(assignments) { /* ... */ }
  calculateRestPeriod(endTime, startTime) { /* ... */ }
  // ... więcej helpers
}

module.exports = LaborLawValidator;
```

#### Frontend: UI dla AI Schedule

**Plik:** `frontend/src/pages/AIScheduleBuilder.jsx`

```javascript
const AIScheduleBuilder = () => {
  const [step, setStep] = useState(1); // Wizard: 1-4
  const [config, setConfig] = useState({
    month: '',
    year: '',
    employeeIds: [],
    minStaffPerShift: 2,
    maxStaffPerShift: 5,
    budget: '',
    prioritizeAvailability: true,
    prioritizeCostOptimization: false,
    useForecast: false,
    forecastData: null
  });
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generateSchedule = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/schedule/ai-generate', config);
      setResult(data);
      setStep(4); // Show results
    } catch (error) {
      alert(error.response?.data?.message || 'Błąd generowania');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wizard Steps */}
      <div className="app-card p-6">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {s}
              </div>
              {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-pink-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Basic config */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Krok 1: Podstawowe ustawienia</h2>
            {/* Month, year, employees selection */}
          </div>
        )}

        {/* Step 2: Constraints */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Krok 2: Ograniczenia i preferencje</h2>
            {/* Min/max staff, budget, priorities */}
          </div>
        )}

        {/* Step 3: Forecast (optional) */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Krok 3: Prognoza zapotrzebowania (opcjonalnie)</h2>
            {/* Upload forecast data or use default */}
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && result && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Wyniki generowania</h2>
            
            {/* Quality Score */}
            <div className="grid grid-cols-3 gap-4">
              <div className="app-card p-4">
                <div className="text-sm text-slate-600">Jakość grafiku</div>
                <div className="text-3xl font-bold text-pink-600">
                  {result.metadata.fitness.toFixed(0)}%
                </div>
              </div>
              <div className="app-card p-4">
                <div className="text-sm text-slate-600">Koszt</div>
                <div className="text-3xl font-bold text-slate-900">
                  {result.metadata.cost.toLocaleString()} PLN
                </div>
              </div>
              <div className="app-card p-4">
                <div className="text-sm text-slate-600">Pokrycie</div>
                <div className="text-3xl font-bold text-green-600">
                  {(result.metadata.coverage * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Violations */}
            {result.metadata.violations.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2">
                  ⚠️ Naruszenia Kodeksu Pracy ({result.metadata.violations.length})
                </h3>
                <div className="space-y-2">
                  {result.metadata.violations.map((v, i) => (
                    <div key={i} className="text-sm text-red-700">
                      • {v.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Rekomendacje:</h3>
                {result.recommendations.map((rec, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="font-medium">{rec.title}</div>
                    <div className="text-sm mt-1">{rec.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => saveSchedule(result)} className="btn-primary">
                Zapisz grafik
              </button>
              <button onClick={() => setStep(1)} className="btn-secondary">
                Generuj ponownie
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## PRIORYTET 3: Prognoza zapotrzebowania (1 tydzień)

### Model ML dla prognozy

**Plik:** `backend/services/forecastingService.js`

```javascript
const brain = require('brain.js');

class ForecastingService {
  constructor() {
    this.network = new brain.recurrent.LSTMTimeStep({
      inputSize: 5,
      hiddenLayers: [10, 10],
      outputSize: 1
    });
  }

  async trainModel(historicalData) {
    // historicalData: [{ date, revenue, customers, dayOfWeek, isHoliday }]
    
    const trainingData = historicalData.map(d => ({
      input: [
        d.dayOfWeek / 7, // normalized
        d.isHoliday ? 1 : 0,
        d.revenue / 10000, // normalized
        d.customers / 100, // normalized
        d.month / 12 // normalized
      ],
      output: [d.requiredStaff / 10] // normalized
    }));

    await this.network.train(trainingData, {
      iterations: 2000,
      errorThresh: 0.005,
      log: true,
      logPeriod: 100
    });

    return { success: true, trained: true };
  }

  predict(date, revenue, customers) {
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;
    const isHoliday = this.isHoliday(date);

    const input = [
      dayOfWeek / 7,
      isHoliday ? 1 : 0,
      revenue / 10000,
      customers / 100,
      month / 12
    ];

    const output = this.network.run(input);
    const requiredStaff = Math.round(output[0] * 10);

    return {
      date,
      requiredStaff,
      confidence: this.calculateConfidence(input),
      factors: {
        dayOfWeek,
        isHoliday,
        revenue,
        customers,
        month
      }
    };
  }

  // Simple heuristic fallback (if no ML model)
  predictHeuristic(date, avgRevenue, avgCustomers) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = this.isHoliday(date);

    let baseStaff = 3;

    // Weekend multiplier
    if (isWeekend) baseStaff *= 1.5;
    
    // Holiday multiplier
    if (isHoliday) baseStaff *= 0.5;

    // Revenue-based adjustment
    const revenueMultiplier = avgRevenue / 5000; // baseline 5000 PLN
    baseStaff *= revenueMultiplier;

    // Customer-based adjustment
    const customerMultiplier = avgCustomers / 50; // baseline 50 customers
    baseStaff *= customerMultiplier;

    return {
      date,
      requiredStaff: Math.max(1, Math.round(baseStaff)),
      confidence: 0.7,
      method: 'heuristic'
    };
  }

  isHoliday(date) {
    // Polish holidays 2025
    const holidays = [
      '2025-01-01', '2025-01-06', '2025-04-20', '2025-04-21',
      '2025-05-01', '2025-05-03', '2025-06-08', '2025-06-19',
      '2025-08-15', '2025-11-01', '2025-11-11', '2025-12-25', '2025-12-26'
    ];
    
    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
  }
}
```

---

## PRIORYTET 4: PWA + Push Notifications (1 tydzień)

### Service Worker

**Plik:** `frontend/public/service-worker.js`

```javascript
const CACHE_NAME = 'kadryhr-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    },
    actions: [
      { action: 'open', title: 'Otwórz' },
      { action: 'close', title: 'Zamknij' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});
```

### Backend: Web Push

**Plik:** `backend/services/pushNotificationService.js`

```javascript
const webpush = require('web-push');

// Setup VAPID keys (generate once)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  'mailto:admin@kadryhr.pl',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

class PushNotificationService {
  async sendNotification(subscription, payload) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return { success: true };
    } catch (error) {
      console.error('Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendToUser(userId, payload) {
    // Get user's subscriptions
    const subscriptions = await PushSubscription.find({ user: userId });
    
    const results = await Promise.allSettled(
      subscriptions.map(sub => this.sendNotification(sub.subscription, payload))
    );

    return {
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }

  async sendToAll(payload) {
    const subscriptions = await PushSubscription.find({});
    
    const results = await Promise.allSettled(
      subscriptions.map(sub => this.sendNotification(sub.subscription, payload))
    );

    return {
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }
}
```

---

## PRIORYTET 5: Dashboard budżetowy (1 tydzień)

### Model

**Plik:** `backend/models/Budget.js`

```javascript
const budgetSchema = new mongoose.Schema({
  month: { type: String, required: true }, // "2025-01"
  year: { type: Number, required: true },
  totalBudget: { type: Number, required: true },
  departments: [{
    name: String,
    budget: Number,
    spent: Number
  }],
  categories: [{
    name: String, // salaries, overtime, bonuses, benefits
    budget: Number,
    spent: Number
  }],
  alerts: [{
    type: String, // warning, critical
    message: String,
    threshold: Number,
    createdAt: Date
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});
```

### Controller

**Plik:** `backend/controllers/budgetController.js`

```javascript
exports.getBudgetSummary = async (req, res) => {
  const { month, year } = req.query;
  
  // 1. Get budget
  const budget = await Budget.findOne({ month, year });
  if (!budget) {
    return res.status(404).json({ message: 'Brak budżetu dla tego miesiąca' });
  }

  // 2. Calculate actual costs
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const timeEntries = await TimeEntry.find({
    timestamp: { $gte: startDate, $lte: endDate }
  }).populate('employee');

  let totalCost = 0;
  const costBreakdown = {
    salaries: 0,
    overtime: 0,
    nightShift: 0,
    weekend: 0,
    bonuses: 0
  };

  timeEntries.forEach(entry => {
    const hours = entry.duration / 60; // minutes to hours
    const rate = entry.employee.hourlyRate || 30;
    
    // Base cost
    const baseCost = hours * rate;
    totalCost += baseCost;
    costBreakdown.salaries += baseCost;

    // Overtime
    if (entry.isOvertime) {
      const overtimeCost = hours * rate * 0.5;
      totalCost += overtimeCost;
      costBreakdown.overtime += overtimeCost;
    }

    // Night shift
    if (entry.isNightShift) {
      const nightCost = hours * rate * 0.2;
      totalCost += nightCost;
      costBreakdown.nightShift += nightCost;
    }

    // Weekend
    if (entry.isWeekend) {
      const weekendCost = hours * rate * 0.5;
      totalCost += weekendCost;
      costBreakdown.weekend += weekendCost;
    }
  });

  // 3. Calculate forecast
  const daysInMonth = endDate.getDate();
  const daysPassed = new Date().getDate();
  const forecast = (totalCost / daysPassed) * daysInMonth;

  // 4. Generate alerts
  const alerts = [];
  if (totalCost > budget.totalBudget * 0.9) {
    alerts.push({
      type: 'critical',
      message: 'Przekroczono 90% budżetu!',
      threshold: 90
    });
  } else if (totalCost > budget.totalBudget * 0.75) {
    alerts.push({
      type: 'warning',
      message: 'Wykorzystano 75% budżetu',
      threshold: 75
    });
  }

  if (forecast > budget.totalBudget) {
    alerts.push({
      type: 'warning',
      message: `Prognoza przekracza budżet o ${(forecast - budget.totalBudget).toFixed(0)} PLN`,
      forecast: forecast
    });
  }

  res.json({
    budget: budget.totalBudget,
    spent: totalCost,
    remaining: budget.totalBudget - totalCost,
    percentUsed: (totalCost / budget.totalBudget) * 100,
    forecast,
    onTrack: forecast <= budget.totalBudget,
    breakdown: costBreakdown,
    alerts,
    daysInMonth,
    daysPassed
  });
};
```

---

## 📦 Pakiety npm do zainstalowania

### Backend:
```bash
npm install brain.js          # ML dla prognoz
npm install web-push          # Push notifications
npm install exceljs           # Eksport do Excel
npm install pdfkit            # Zaawansowane PDF
npm install bull              # Queue system
npm install ioredis           # Redis client
npm install @google-cloud/optimization  # OR-Tools (opcjonalnie)
```

### Frontend:
```bash
npm install workbox-webpack-plugin  # PWA
npm install react-big-calendar      # Advanced calendar
npm install @dnd-kit/core          # Drag & drop
npm install react-hook-form        # Better forms
npm install zod                    # Validation
npm install zustand                # State management
npm install recharts               # Charts (już mamy)
```

---

## 🎯 Metryki sukcesu implementacji

### Po SPRINT 1:
- ✅ 100% grafików zgodnych z Kodeksem Pracy
- ✅ Geolokalizacja działa dla 100% clock-in
- ✅ Dashboard budżetowy pokazuje real-time koszty
- ✅ PWA instalowalna na telefonie

### Po SPRINT 2:
- ✅ AI generuje grafik w <30 sekund
- ✅ 90%+ jakość wygenerowanych grafików
- ✅ Push notifications działają
- ✅ Prognoza zapotrzebowania z 70%+ accuracy

### Po SPRINT 3:
- ✅ 10+ typów raportów dostępnych
- ✅ Eksport do Excel/PDF działa
- ✅ Dashboard analityczny z 15+ metrykami

### Po SPRINT 4:
- ✅ API publiczne udokumentowane
- ✅ Eksport do systemów płacowych
- ✅ Webhooks dla 10+ zdarzeń

---

## 🏆 Przewaga konkurencyjna - podsumowanie

| Funkcja | KadryHR (teraz) | Kadromierz | KadryHR (po wdrożeniu) |
|---------|-----------------|------------|------------------------|
| AI Auto-Schedule | ❌ | ✅ | ✅✅ (lepszy algorytm) |
| Kodeks Pracy | ❌ | ✅ | ✅✅ (real-time validation) |
| Prognoza | ❌ | ✅ | ✅✅ (ML model) |
| App mobilna | ❌ | ✅ | ✅✅ (PWA) |
| Push notifications | ❌ | ✅ | ✅ |
| Chat | ✅ | ❌ | ✅✅ |
| Dark mode | ✅ | ❌ | ✅✅ |
| AI Assistant | ❌ | ❌ | ✅✅ (INNOWACJA) |
| Predykcja rotacji | ❌ | ❌ | ✅✅ (INNOWACJA) |
| Gamifikacja | ❌ | ❌ | ✅✅ (INNOWACJA) |
| Open API | ❌ | ❌ | ✅✅ (INNOWACJA) |

**Wynik:** KadryHR może być LEPSZY niż Kadromierz dzięki innowacjom AI i lepszemu UX!

---

## 💡 Podsumowanie

### Co mamy już dobrego:
1. ✅ Solidna podstawa techniczna
2. ✅ Piękny, nowoczesny UI
3. ✅ Chat (przewaga!)
4. ✅ Dark mode (przewaga!)
5. ✅ Dobra architektura

### Co musimy dodać (MUST HAVE):
1. 🔴 AI Auto-Schedule
2. 🔴 Walidator Kodeksu Pracy
3. 🔴 Prognoza zapotrzebowania
4. 🔴 PWA + Push notifications
5. 🔴 Dashboard budżetowy

### Co da nam przewagę (NICE TO HAVE):
1. 🚀 AI Assistant
2. 🚀 Predykcyjna analityka
3. 🚀 Gamifikacja
4. 🚀 Open API
5. 🚀 LMS

### Czas do parity z Kadromierz:
- **Podstawowe funkcje:** 4-6 tygodni
- **Pełna parność:** 2-3 miesiące
- **Przewaga konkurencyjna:** 4-6 miesięcy

### Szacowany budżet:
- **SPRINT 1-2 (MVP):** 80-120h pracy = 8-12k PLN
- **SPRINT 3-4 (Parity):** 120-160h pracy = 12-16k PLN
- **SPRINT 5+ (Przewaga):** 200-300h pracy = 20-30k PLN
- **RAZEM:** 400-580h = 40-58k PLN

### ROI:
- **Oszczędność czasu klienta:** 18h/miesiąc = 2.25 dnia
- **Oszczędność kosztów:** 20-40k PLN/miesiąc (dla firmy 50 osób)
- **Możliwa cena:** 199 PLN/m (vs Kadromierz ~150 PLN/m)
- **Break-even:** ~200 klientów = 40k PLN/m

---

**Rekomendacja finalna:** Rozpocząć od SPRINT 1-2 (Quick Wins + AI), aby szybko dorównać Kadromierz, a następnie skupić się na innowacjach (AI Assistant, Predykcja, Gamifikacja), które dadzą nam unikalną przewagę na rynku.
