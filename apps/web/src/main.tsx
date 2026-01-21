import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import './index.css';

// Import components
import RootLayout from './routes/__root';
import LandingPage from './routes/index';
import LoginPage from './routes/login';
import RegisterPage from './routes/register';
import PanelLayout from './routes/panel';
import DashboardPage from './routes/panel/dashboard';
import TeamPage from './routes/panel/zespol';
import SchedulePage from './routes/panel/grafik-v2';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Create routes
const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

const panelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/panel',
  component: PanelLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => panelRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const teamRoute = createRoute({
  getParentRoute: () => panelRoute,
  path: '/zespol',
  component: TeamPage,
});

const scheduleRoute = createRoute({
  getParentRoute: () => panelRoute,
  path: '/grafik-v2',
  component: SchedulePage,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  panelRoute.addChildren([
    dashboardRoute,
    teamRoute,
    scheduleRoute,
  ]),
]);

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
