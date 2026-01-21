import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  employee: { id: string; name: string };
  position: { id: string; name: string };
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: schedulesData } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => apiClient.getSchedules(),
  });

  const activeSchedule = schedulesData?.data?.[0] as { id: string; name: string } | undefined;

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ['schedule-shifts', activeSchedule?.id, currentDate.toISOString()],
    queryFn: () => 
      activeSchedule 
        ? apiClient.getScheduleShifts(activeSchedule.id, {
            from: startOfMonth.toISOString(),
            to: endOfMonth.toISOString(),
          }) as Promise<{ data: Shift[] }>
        : Promise.resolve({ data: [] as Shift[] }),
    enabled: !!activeSchedule,
  });

  const daysInMonth = endOfMonth.getDate();
  const firstDayOfWeek = startOfMonth.getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const getShiftsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return shiftsData?.data.filter((shift: Shift) => shift.date.startsWith(dateStr)) || [];
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (!activeSchedule) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">Schedule</h1>
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No schedules created"
          description="Create your first schedule to start managing shifts."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">Schedule</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeSchedule.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-secondary-700 py-2">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before month starts */}
              {emptyDays.map((i) => (
                <div key={`empty-${i}`} className="border border-secondary-200 rounded-md p-2 bg-secondary-50" />
              ))}
              
              {/* Calendar days */}
              {days.map((day) => {
                const shifts = getShiftsForDay(day);
                return (
                  <div
                    key={day}
                    className="border border-secondary-200 rounded-md p-2 min-h-[100px] bg-white hover:bg-secondary-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-secondary-700 mb-1">{day}</div>
                    <div className="space-y-1">
                      {shifts.map((shift: Shift) => (
                        <div
                          key={shift.id}
                          className="text-xs bg-primary-50 text-primary-700 rounded px-2 py-1"
                        >
                          <div className="font-medium truncate">{shift.employee.name}</div>
                          <div className="text-primary-600">
                            {shift.startTime} - {shift.endTime}
                          </div>
                        </div>
                      ))}
                      {shifts.length === 0 && (
                        <div className="text-xs text-secondary-400">No shifts</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
