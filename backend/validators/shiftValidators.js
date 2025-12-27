const { z } = require('zod');

// Time format validator (HH:MM)
const timeFormat = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: 'Invalid time format. Use HH:MM (e.g., 09:00, 14:30)',
});

// Break schema
const breakSchema = z.object({
  startTime: timeFormat.optional(),
  endTime: timeFormat.optional(),
  duration: z.number().min(5).max(120).optional(),
  isPaid: z.boolean().default(false),
  type: z.enum(['meal', 'rest', 'other']).default('rest'),
  description: z.string().max(200).optional(),
});

// Create shift assignment validator
const createShiftAssignmentSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  type: z.enum(['shift', 'leave', 'off', 'sick', 'holiday']).default('shift'),
  startTime: timeFormat.optional(),
  endTime: timeFormat.optional(),
  shiftTemplateId: z.string().optional(),
  notes: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  breaks: z.array(breakSchema).optional(),
  isOvertime: z.boolean().default(false),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).default('scheduled'),
});

// Update shift assignment validator
const updateShiftAssignmentSchema = createShiftAssignmentSchema.partial().extend({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
});

// Bulk operations validator
const bulkOperationSchema = z.object({
  operation: z.enum(['copy-week', 'apply-template', 'delete-range']),
  scheduleId: z.string().min(1),
  sourceWeekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  targetWeekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  templateId: z.string().optional(),
  employeeIds: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional(),
});

// Publish schedule validator
const publishScheduleSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  notifyEmployees: z.boolean().default(true),
});

// Conflict check validator
const conflictCheckSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: timeFormat,
  endTime: timeFormat,
  excludeAssignmentId: z.string().optional(),
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedData = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

module.exports = {
  createShiftAssignmentSchema,
  updateShiftAssignmentSchema,
  bulkOperationSchema,
  publishScheduleSchema,
  conflictCheckSchema,
  validate,
};
