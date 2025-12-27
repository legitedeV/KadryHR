# KadryHR Frontend

Modern React frontend for KadryHR SaaS application.

## 🏗️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Axios** - HTTP client

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── api/              # API client configuration
│   │   └── axios.js
│   ├── components/       # Reusable components
│   │   ├── Layout.jsx
│   │   ├── Alert.jsx
│   │   └── ...
│   ├── context/          # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx
│   │   ├── ScheduleBuilderV2.jsx  # Main schedule builder
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   └── permissions.js
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── .eslintrc.json        # NEW: ESLint config
├── .prettierrc           # NEW: Prettier config
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### Running

```bash
# Development server (with HMR)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
```

## 🎨 Component Patterns

### Page Components

Page components should be lazy-loaded for code splitting:

```javascript
// App.jsx
const ScheduleBuilderV2 = lazy(() => import('./pages/ScheduleBuilderV2'));

<Route
  path="/schedule-builder"
  element={
    <Suspense fallback={<LoadingFallback />}>
      <Layout>
        <ScheduleBuilderV2 />
      </Layout>
    </Suspense>
  }
/>
```

### Modal Components

Modals should:
- Lock body scroll when open
- Have proper max-height for viewport
- Scroll content, not page
- Use flex layout for header/content/footer

**Example**:

```javascript
const Modal = ({ open, onClose, children }) => {
  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl my-8 max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header - flex-shrink-0 */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3>Modal Title</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Content - overflow-y-auto flex-1 */}
        <div className="overflow-y-auto flex-1 pr-2">
          {children}
        </div>

        {/* Footer - flex-shrink-0 */}
        <div className="mt-5 flex gap-2 flex-shrink-0 pt-4 border-t">
          <button onClick={onClose}>Cancel</button>
          <button>Save</button>
        </div>
      </div>
    </div>
  );
};
```

## 🔄 Data Fetching with TanStack Query

### Query Example

```javascript
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

const useSchedules = (month) => {
  return useQuery({
    queryKey: ['schedules', month],
    queryFn: async () => {
      const { data } = await api.get(`/schedules?month=${month}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Usage
const { data: schedules, isLoading, error } = useSchedules('2025-12');
```

### Mutation Example

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

const useCreateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftData) => {
      const { data } = await api.post('/shifts', shiftData);
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

// Usage
const createShift = useCreateShift();

const handleSave = () => {
  createShift.mutate(formData, {
    onSuccess: () => {
      alert('Shift created!');
      onClose();
    },
    onError: (error) => {
      alert(error.message);
    },
  });
};
```

## 🎨 Styling with TailwindCSS

### Dark Theme Support

The app supports dark theme. Use Tailwind's dark mode classes:

```javascript
<div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
  Content
</div>
```

### Custom Theme Colors

Defined in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'theme-primary': '#3b82f6',
      'theme-secondary': '#8b5cf6',
    },
  },
}
```

### Responsive Design

Always use responsive classes:

```javascript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

## 🔐 Authentication

### Using Auth Context

```javascript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, loading, logout } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  return (
    <div>
      <p>Welcome, {user.firstName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### Protected Routes

```javascript
import ProtectedRoute from '../components/ProtectedRoute';
import { PERMISSIONS } from '../utils/permissions';

<Route
  path="/employees"
  element={
    <ProtectedRoute requiredPermissions={[PERMISSIONS.EMPLOYEES_VIEW]}>
      <Layout>
        <Employees />
      </Layout>
    </ProtectedRoute>
  }
/>
```

## 📊 Schedule Builder Best Practices

### Quick Templates

Quick templates should set **shift times**, not notes:

```javascript
// ✅ GOOD
const quickTemplates = [
  { 
    label: 'I zmiana', 
    startTime: '05:45', 
    endTime: '15:00',
    note: 'Optional note'
  },
];

const handleTemplateClick = (template) => {
  setFormData({
    ...formData,
    startTime: template.startTime,
    endTime: template.endTime,
    notes: template.note || '',
  });
};

// ❌ BAD
const handleTemplateClick = (template) => {
  setFormData({
    ...formData,
    notes: '05:45 - 15:00', // Wrong! This should be in startTime/endTime
  });
};
```

### Modal UX

- Always lock body scroll when modal is open
- Use proper max-height and overflow
- Make content scrollable, not the page
- Add visual separation between sections

### Form State Management

Use controlled components with useState:

```javascript
const [formData, setFormData] = useState({
  employeeId: '',
  date: '',
  startTime: '',
  endTime: '',
  shiftTemplateId: '',
  notes: '',
});

const handleChange = (key) => (e) => {
  setFormData((prev) => ({ ...prev, [key]: e.target.value }));
};

<input
  value={formData.startTime}
  onChange={handleChange('startTime')}
/>
```

## 🧪 Testing (TODO)

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

## 📊 Code Quality

### ESLint

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Prettier

```bash
# Format all files
npm run format
```

## 🚀 Build and Deployment

### Production Build

```bash
npm run build
```

Output: `dist/` directory

### Preview Build

```bash
npm run preview
```

### Environment Variables

For production, set:

```env
VITE_API_URL=https://api.kadryhr.com/api
```

## 🎯 Performance Optimization

### Code Splitting

Use lazy loading for routes:

```javascript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
```

### Memoization

Use React.memo for expensive components:

```javascript
const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering
  return <div>{/* ... */}</div>;
});
```

Use useMemo for expensive calculations:

```javascript
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);
```

### Image Optimization

- Use WebP format
- Lazy load images
- Use appropriate sizes

## 🐛 Debugging

### React DevTools

Install React DevTools browser extension.

### TanStack Query DevTools

Already included in development:

```javascript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Network Requests

Check browser DevTools → Network tab.

## 📚 Resources

- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Router Docs](https://reactrouter.com/)

## 🤝 Contributing

1. Create feature branch
2. Write code following conventions
3. Run linter and formatter
4. Test manually
5. Create Pull Request

## 📄 License

Proprietary - KadryHR
