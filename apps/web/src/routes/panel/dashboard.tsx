import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Calendar, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
  });

  const stats = [
    {
      title: 'Liczba pracowników',
      value: data?.data.employeesCount ?? 0,
      icon: Users,
      color: 'text-primary-600',
    },
    {
      title: 'Zmiany w tym miesiącu',
      value: data?.data.shiftsThisMonth ?? 0,
      icon: Calendar,
      color: 'text-success-600',
    },
    {
      title: 'Oczekujące dostępności',
      value: data?.data.pendingAvailability ?? 0,
      icon: Clock,
      color: 'text-warning-600',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-secondary-900 mb-6">Panel</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-secondary-700">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Witamy w KadryHR v2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary-600">
              To jest panel HR. Użyj menu nawigacji, aby zarządzać zespołem,
              tworzyć grafiki i śledzić dostępność.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
