# KadryHR v2 Frontend

Modern HR management application frontend built with React, TanStack Router, and TanStack Query.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Vite** - Build tool

## Project Structure

```
src/
├── components/
│   └── ui/           # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Drawer.tsx
│       ├── Badge.tsx
│       ├── Chip.tsx
│       ├── EmptyState.tsx
│       ├── Skeleton.tsx
│       ├── Select.tsx
│       ├── Checkbox.tsx
│       ├── Table.tsx
│       └── index.ts
├── lib/
│   ├── api.ts        # API client with all endpoints
│   └── utils.ts      # Utility functions (cn)
├── routes/
│   ├── __root.tsx              # Root layout
│   ├── index.tsx               # Landing page
│   ├── login.tsx               # Login page
│   ├── register.tsx            # Registration page
│   ├── panel.tsx               # Panel layout (TopNav + Sidebar)
│   └── panel/
│       ├── dashboard.tsx       # Dashboard with stats
│       ├── zespol.tsx          # Team management
│       └── grafik-v2.tsx       # Schedule calendar
├── main.tsx          # Application entry point
└── index.css         # Global styles

## Features

### Design System
- **Button** - Multiple variants (primary, secondary, ghost, danger) and sizes
- **Input** - Form input with label and error states
- **Card** - Container with header, title, and content sections
- **Modal** - Dialog overlay for forms and confirmations
- **Drawer** - Side panel for detailed views
- **Badge** - Status indicators with color variants
- **Chip** - Removable tags
- **EmptyState** - Placeholder for empty data
- **Skeleton** - Loading placeholders
- **Select** - Dropdown with search
- **Checkbox** - Accessible checkbox
- **Table** - Data table with sortable columns

### Pages

#### Landing Page (`/`)
- Hero section with CTA
- Feature cards
- Call-to-action section
- Links to register/login

#### Authentication
- **Login** (`/login`) - Email/password authentication
- **Register** (`/register`) - New account creation with organization name

#### Panel (`/panel`)
- **Dashboard** (`/panel/dashboard`)
  - Employee count
  - Shifts this month
  - Pending availability
  - Welcome card
  
- **Team Management** (`/panel/zespol`)
  - Employee table with CRUD operations
  - Add employee modal
  - Status badges
  - Delete functionality
  
- **Schedule** (`/panel/grafik-v2`)
  - Monthly calendar view
  - Shift display with employee names
  - Month navigation
  - Shift time details

### API Integration

All API calls use TanStack Query for:
- Automatic caching
- Background refetching
- Optimistic updates
- Loading/error states

Endpoints implemented:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/schedules` - List schedules
- `GET /api/schedules/:id/shifts` - Get schedule shifts

## Development

### Prerequisites
- Node.js 18+
- pnpm

### Install Dependencies
```bash
pnpm install
```

### Development Server
```bash
pnpm dev
```
Runs on `http://localhost:5173`

### Build for Production
```bash
pnpm build
```

### Type Check
```bash
pnpm typecheck
```

### Lint
```bash
pnpm lint
```

## Environment Variables

Create `.env` file:
```env
VITE_API_BASE=http://localhost:3000
```

## Styling

Uses Tailwind CSS with custom theme:
- **Primary**: Blue (`#2563eb`)
- **Secondary**: Gray
- **Success**: Green
- **Warning**: Yellow
- **Error**: Red

Custom spacing, border radius, and shadow utilities defined in `tailwind.config.js`.

## Routing

Routes are defined in `main.tsx` using TanStack Router:
- Type-safe navigation
- Nested routes for panel layout
- Loading states
- Error handling

## State Management

- **Server State**: TanStack Query (queries, mutations, caching)
- **UI State**: React useState/useContext
- **Form State**: React Hook Form (ready to integrate)

## Next Steps

1. Add form validation with Zod
2. Implement role-based access control
3. Add real-time updates with WebSockets
4. Implement file upload for avatars
5. Add more dashboard widgets
6. Implement shift editing
7. Add availability management UI
8. Implement holiday management
9. Add notifications
10. Add user settings page
