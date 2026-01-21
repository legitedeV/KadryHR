import { Outlet, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { LayoutDashboard, Users, Calendar, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function PanelLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.me(),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      navigate({ to: '/login' });
    },
  });

  const navItems = [
    { to: '/panel/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/panel/zespol', icon: Users, label: 'Team' },
    { to: '/panel/grafik-v2', icon: Calendar, label: 'Schedule' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-secondary-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-secondary-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-primary-600">KadryHR</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary-600 hidden sm:block">
              {data?.user.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              isLoading={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 fixed lg:static inset-y-16 lg:inset-y-0 left-0 z-20
            w-64 bg-white border-r border-secondary-200 transition-transform duration-300
          `}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-2 rounded-md text-secondary-700 hover:bg-secondary-100 transition-colors"
                activeProps={{
                  className: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
