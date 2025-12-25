export type Employee = {
  id: string;
  name: string;
  role: string;
  color: string;
};

export type Shift = {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  type: string;
  note?: string;
};

type OrgScheduleState = {
  employees: Employee[];
  shifts: Shift[];
};

const STORAGE_KEY = "kadryhr_schedule_builder";

function loadStorage(): Record<string, OrgScheduleState> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, OrgScheduleState>) : {};
}

function persist(orgId: string, data: OrgScheduleState) {
  if (typeof window === "undefined") return;
  const storage = loadStorage();
  storage[orgId] = data;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

function seed(orgId: string): OrgScheduleState {
  const colors = ["#2563eb", "#0ea5e9", "#f97316", "#22c55e", "#a855f7", "#eab308", "#ec4899", "#06b6d4"];
  const employees: Employee[] = [
    { id: "emp-1", name: "Jan Kowalski", role: "Magazyn", color: colors[0] },
    { id: "emp-2", name: "Anna Nowak", role: "Obsługa klienta", color: colors[1] },
    { id: "emp-3", name: "Piotr Wiśniewski", role: "IT", color: colors[2] },
    { id: "emp-4", name: "Katarzyna Zielińska", role: "Księgowość", color: colors[3] },
    { id: "emp-5", name: "Marek Lewandowski", role: "Sprzedaż", color: colors[4] },
    { id: "emp-6", name: "Ewa Krawczyk", role: "Marketing", color: colors[5] },
    { id: "emp-7", name: "Tomasz Lis", role: "Administracja", color: colors[6] },
    { id: "emp-8", name: "Monika Dąbrowska", role: "HR", color: colors[7] },
  ];

  const today = new Date();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const baseShift: Pick<Shift, "start" | "end" | "type"> = { start: "09:00", end: "17:00", type: "Dzień" };
  const sampleShifts: Shift[] = employees.slice(0, 5).flatMap((employee, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), 3 + index * 2);
    return {
      id: `seed-${employee.id}-${monthKey}`,
      employeeId: employee.id,
      date: date.toISOString().split("T")[0],
      note: "Zmiana próbna",
      ...baseShift,
    } satisfies Shift;
  });

  const state: OrgScheduleState = { employees, shifts: sampleShifts };
  persist(orgId, state);
  return state;
}

function getState(orgId: string): OrgScheduleState {
  const storage = loadStorage();
  if (storage[orgId]) return storage[orgId];
  return seed(orgId);
}

function delay(ms = 160) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSchedule(orgId: string, monthKey: string) {
  const state = getState(orgId);
  await delay();
  const shifts = state.shifts.filter((shift) => shift.date.startsWith(monthKey));
  return { employees: state.employees, shifts };
}

export async function upsertShifts(orgId: string, updates: Shift[]) {
  const state = getState(orgId);
  const ids = new Set(updates.map((item) => item.id));
  const remaining = state.shifts.filter((shift) => !ids.has(shift.id));
  const nextState: OrgScheduleState = { ...state, shifts: [...remaining, ...updates] };
  persist(orgId, nextState);
  await delay();
  return nextState.shifts;
}

export async function deleteShifts(orgId: string, ids: string[]) {
  const state = getState(orgId);
  const idSet = new Set(ids);
  const nextState: OrgScheduleState = { ...state, shifts: state.shifts.filter((shift) => !idSet.has(shift.id)) };
  persist(orgId, nextState);
  await delay();
  return nextState.shifts;
}

export async function updateOrgEmployees(orgId: string, employees: Employee[]) {
  const state = getState(orgId);
  const nextState: OrgScheduleState = { ...state, employees };
  persist(orgId, nextState);
  await delay();
  return nextState.employees;
}
