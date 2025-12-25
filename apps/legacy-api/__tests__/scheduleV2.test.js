const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../middleware/authMiddleware', () => ({
  protect: (req, _res, next) => {
    req.user = {
      id: req.headers['x-test-user'] || 'companyAdmin',
      role: 'admin',
      supervisor: null,
      companyId: null
    };
    next();
  },
  adminOnly: (_req, _res, next) => next()
}));

jest.mock('../middleware/permissionMiddleware', () => ({
  requirePermission: () => (_req, _res, next) => next()
}));

const scheduleV2Routes = require('../routes/scheduleV2Routes');
const Schedule = require('../models/Schedule');
const ShiftAssignment = require('../models/ShiftAssignment');
const Employee = require('../models/Employee');
const express = require('express');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/schedules/v2', scheduleV2Routes);
  return app;
};

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Schedule.deleteMany({});
  await ShiftAssignment.deleteMany({});
  await Employee.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('schedules/v2 flow', () => {
  it('creates schedule and manages assignments', async () => {
    const app = createApp();
    const adminId = new mongoose.Types.ObjectId().toString();

    const employee = await Employee.create({
      companyId: adminId,
      firstName: 'Jan',
      lastName: 'Kowalski',
      position: 'Tester',
      hourlyRate: 50
    });

    const scheduleRes = await request(app)
      .post('/api/schedules/v2')
      .set('x-test-user', adminId)
      .send({ name: 'Styczen', month: '2025-01', year: 2025 });

    expect(scheduleRes.status).toBe(201);
    expect(scheduleRes.body.schedule.company).toBe(adminId);

    const assignmentRes = await request(app)
      .post(`/api/schedules/v2/${scheduleRes.body.schedule._id}/assignments`)
      .set('x-test-user', adminId)
      .send({
        employeeId: employee._id.toString(),
        date: '2025-01-05',
        type: 'shift',
        startTime: '08:00',
        endTime: '16:00'
      });

    expect(assignmentRes.status).toBe(201);
    const assignmentId = assignmentRes.body.assignment._id;

    const updateRes = await request(app)
      .put(`/api/schedules/v2/assignments/${assignmentId}`)
      .set('x-test-user', adminId)
      .send({ startTime: '09:00', endTime: '17:00' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.assignment.startTime).toBe('09:00');

    const listRes = await request(app)
      .get(`/api/schedules/v2/${scheduleRes.body.schedule._id}/assignments`)
      .set('x-test-user', adminId);

    expect(listRes.status).toBe(200);
    expect(listRes.body.assignments).toHaveLength(1);
    expect(listRes.body.assignments[0]._id).toBe(assignmentId);
  });
});
