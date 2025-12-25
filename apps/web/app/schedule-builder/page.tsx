"use client";

import { useState } from "react";

export default function ScheduleBuilderPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const departments = [
    { id: "all", name: "Wszystkie działy" },
    { id: "it", name: "IT" },
    { id: "hr", name: "HR" },
    { id: "sales", name: "Sprzedaż" },
    { id: "support", name: "Wsparcie" },
  ];

  const mockEmployees = [
    { id: 1, name: "Jan Kowalski", department: "IT" },
    { id: 2, name: "Anna Nowak", department: "HR" },
    { id: 3, name: "Piotr Wiśniewski", department: "Sales" },
  ];

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a 
            href="/" 
            className="text-sm hover:underline inline-flex items-center mb-4"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ← Powrót do strony głównej
          </a>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Kreator Grafików
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Zarządzaj grafikami pracy pracowników
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="app-card p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Filtry
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="date" 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Data
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input-primary"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="department" 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Dział
                  </label>
                  <select
                    id="department"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="input-primary"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button className="btn-primary w-full">
                  Zastosuj filtry
                </button>
              </div>

              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Szybkie akcje
                </h3>
                <div className="space-y-2">
                  <button 
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ 
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--surface-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                    }}
                  >
                    Dodaj zmianę
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ 
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--surface-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                    }}
                  >
                    Kopiuj tydzień
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ 
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--surface-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                    }}
                  >
                    Eksportuj PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="app-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Grafik na {selectedDate}
                </h2>
                <span 
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: 'var(--surface-secondary)',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  {mockEmployees.length} pracowników
                </span>
              </div>

              <div className="space-y-3">
                {mockEmployees.map((employee) => (
                  <div 
                    key={employee.id}
                    className="p-4 rounded-lg border transition-all hover:shadow-md"
                    style={{ 
                      backgroundColor: 'var(--surface-secondary)',
                      borderColor: 'var(--border-primary)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {employee.name}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          {employee.department}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1 text-sm rounded-lg transition-colors"
                          style={{ 
                            backgroundColor: 'var(--theme-light)',
                            color: 'var(--theme-primary)'
                          }}
                        >
                          Edytuj
                        </button>
                        <button 
                          className="px-3 py-1 text-sm rounded-lg transition-colors"
                          style={{ 
                            backgroundColor: 'var(--surface-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div 
                className="mt-6 p-4 rounded-lg text-center"
                style={{ 
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-primary)',
                  border: '2px dashed'
                }}
              >
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Funkcja kreatora grafików zostanie w pełni zintegrowana z API V2
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                  Obecnie wyświetlane są dane testowe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
