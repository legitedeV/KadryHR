# KadryHR Backend

Production-grade Node.js/Express backend for KadryHR SaaS application.

## 🏗️ Architecture

### Layers

```
┌─────────────────────────────────────┐
│         Routes (HTTP Layer)         │
│  - Request parsing                  │
│  - Response formatting              │
├─────────────────────────────────────┤
│      Middleware (Cross-cutting)     │
│  - Authentication                   │
│  - Multi-tenant (withTenant)        │
│  - Validation (Zod)                 │
├─────────────────────────────────────┤
│      Controllers (Orchestration)    │
│  - Thin layer                       │
│  - Calls services                   │
│  - Handles HTTP concerns            │
├─────────────────────────────────────┤
│      Services (Business Logic)      │
│  - Core business rules              │
│  - Reusable logic                   │
│  - Database operations              │
├─────────────────────────────────────┤
│         Models (Data Layer)         │
│  - Mongoose schemas                 │
│  - Validation rules                 │
│  - Virtual fields                   │
└─────────────────────────────────────┘
```

## 📁 Directory Structure

```
backend/
├── controllers/          # HTTP request handlers
│   ├── scheduleController.js
│   ├── scheduleEnhancedController.js  # NEW: Uses service layer
│   └── ...
├── middleware/          # Express middleware
│   ├── authMiddleware.js
│   └── withTenant.js    # NEW: Multi-tenant isolation
├── models/              # Mongoose models
│   ├── Schedule.js
│   ├── ShiftAssignment.js
│   ├── ShiftTemplate.js
│   └── ...
├── routes/              # Express routes
│   ├── scheduleRoutes.js
│   └── scheduleEnhancedRoutes.js  # NEW: Enhanced endpoints
├── services/            # Business logic layer
│   └── scheduleService.js  # NEW: Schedule operations
├── validators/          # Input validation
│   └── shiftValidators.js  # NEW: Zod schemas
├── .eslintrc.json       # NEW: ESLint config
├── .prettierrc          # NEW: Prettier config
├── package.json
└── server.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 5+
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create `.env` file (use `.env.example` as template):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kadryhr
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Running

```bash
# Development (with nodemon)
npm run dev

# Production
npm start

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
```

## 🔐 Multi-Tenant Architecture

### Using withTenant Middleware

All routes that access organization-specific data should use `withTenant` middleware:

```javascript
const withTenant = require('../middleware/withTenant');

router.get('/schedules', authMiddleware, withTenant, async (req, res) => {
  // Automatically filtered by organization
  const schedules = await Schedule.find(req.filterByOrganization());
  res.json(schedules);
});
```

### Benefits

- ✅ Automatic organization filtering
- ✅ Prevents data leakage between tenants
- ✅ Centralized multi-tenant logic
- ✅ Easy to use and maintain

## 🛡️ Validation

### Using Zod Validators

All endpoints should validate input using Zod schemas:

```javascript
const { validate, createShiftAssignmentSchema } = require('../validators/shiftValidators');

router.post(
  '/shifts',
  authMiddleware,
  withTenant,
  validate(createShiftAssignmentSchema),
  shiftController.create
);
```

### Available Validators

- `createShiftAssignmentSchema` - Create new shift
- `updateShiftAssignmentSchema` - Update existing shift
- `bulkOperationSchema` - Bulk operations
- `publishScheduleSchema` - Publish schedule
- `conflictCheckSchema` - Check conflicts

### Creating New Validators

```javascript
const { z } = require('zod');

const mySchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
  field3: z.enum(['option1', 'option2']),
});

module.exports = { mySchema };
```

## 🔧 Service Layer

### Using Services

Controllers should be thin and delegate business logic to services:

```javascript
const scheduleService = require('../services/scheduleService');

const publishSchedule = async (req, res) => {
  try {
    const schedule = await scheduleService.publishSchedule(
      req.params.id,
      req.user._id,
      req.organizationId
    );
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### Available Services

#### scheduleService

- `checkConflicts(employeeId, date, startTime, endTime, excludeId, orgId)`
- `publishSchedule(scheduleId, userId, orgId)`
- `copyWeek(scheduleId, sourceWeek, targetWeek, employeeIds, orgId)`
- `applyTemplate(scheduleId, templateId, dates, employeeIds, orgId)`
- `deleteRange(scheduleId, startDate, endDate, employeeIds, orgId)`
- `getScheduleStats(scheduleId, orgId)`

### Creating New Services

```javascript
class MyService {
  async myMethod(param1, param2, organizationId) {
    // Business logic here
    // Always filter by organizationId
    const data = await Model.find({ organization: organizationId });
    return data;
  }
}

module.exports = new MyService();
```

## 📝 API Examples

### Publish Schedule

```bash
POST /api/schedules/:id/publish
Authorization: Bearer <token>
Content-Type: application/json

{
  "notifyEmployees": true
}
```

### Check Conflicts

```bash
POST /api/schedules/check-conflicts
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": "507f1f77bcf86cd799439011",
  "date": "2025-12-28",
  "startTime": "08:00",
  "endTime": "16:00"
}
```

### Copy Week

```bash
POST /api/schedules/bulk/copy-week
Authorization: Bearer <token>
Content-Type: application/json

{
  "operation": "copy-week",
  "scheduleId": "507f1f77bcf86cd799439011",
  "sourceWeekStart": "2025-12-23",
  "targetWeekStart": "2025-12-30",
  "employeeIds": ["507f1f77bcf86cd799439012"]
}
```

### Get Schedule Stats

```bash
GET /api/schedules/:id/stats
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalShifts": 120,
    "totalHours": 960,
    "employeeCount": 15,
    "statusBreakdown": {
      "scheduled": 100,
      "confirmed": 15,
      "completed": 5
    },
    "typeBreakdown": {
      "shift": 110,
      "leave": 8,
      "sick": 2
    }
  }
}
```

## 🧪 Testing

### Unit Tests (TODO)

```bash
npm test
```

### Manual Testing

Use tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code)

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

### Pre-commit Hook (Recommended)

Install husky:

```bash
npm install -D husky lint-staged
npx husky install
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write"]
  }
}
```

## 🔒 Security Best Practices

### 1. Never Commit Secrets

- Use `.env` for secrets
- Add `.env` to `.gitignore`
- Use `.env.example` for documentation

### 2. Always Use Multi-Tenant Middleware

```javascript
// ❌ BAD: No organization filtering
router.get('/schedules', authMiddleware, async (req, res) => {
  const schedules = await Schedule.find();
  res.json(schedules);
});

// ✅ GOOD: Automatic organization filtering
router.get('/schedules', authMiddleware, withTenant, async (req, res) => {
  const schedules = await Schedule.find(req.filterByOrganization());
  res.json(schedules);
});
```

### 3. Always Validate Input

```javascript
// ❌ BAD: No validation
router.post('/shifts', authMiddleware, async (req, res) => {
  const shift = await ShiftAssignment.create(req.body);
  res.json(shift);
});

// ✅ GOOD: Validated input
router.post('/shifts', authMiddleware, validate(createShiftSchema), async (req, res) => {
  const shift = await ShiftAssignment.create(req.validatedData);
  res.json(shift);
});
```

### 4. Use Service Layer

```javascript
// ❌ BAD: Business logic in controller
router.post('/publish', authMiddleware, async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  schedule.status = 'published';
  schedule.publishedAt = new Date();
  await schedule.save();
  // ... more logic
  res.json(schedule);
});

// ✅ GOOD: Business logic in service
router.post('/publish', authMiddleware, async (req, res) => {
  const schedule = await scheduleService.publishSchedule(
    req.params.id,
    req.user._id,
    req.organizationId
  );
  res.json(schedule);
});
```

## 🐛 Debugging

### Enable Debug Logs

```bash
DEBUG=* npm run dev
```

### MongoDB Queries

```javascript
mongoose.set('debug', true);
```

### Request Logging

Already enabled with Morgan middleware.

## 📚 Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Zod Docs](https://zod.dev/)
- [ESLint Docs](https://eslint.org/)
- [Prettier Docs](https://prettier.io/)

## 🤝 Contributing

1. Create feature branch
2. Write code following conventions
3. Run linter and formatter
4. Test manually
5. Create Pull Request

## 📄 License

Proprietary - KadryHR
