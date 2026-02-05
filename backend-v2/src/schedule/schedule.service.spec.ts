import { ScheduleService } from './schedule.service';
import { ScheduleRepository } from './schedule.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailTemplatesService } from '../email/email-templates.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let scheduleRepository: jest.Mocked<ScheduleRepository>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let emailTemplatesService: jest.Mocked<EmailTemplatesService>;

  beforeEach(() => {
    scheduleRepository = {
      findShifts: jest.fn(),
    } as unknown as jest.Mocked<ScheduleRepository>;

    notificationsService = {
      notify: jest.fn(),
    } as unknown as jest.Mocked<NotificationsService>;

    emailTemplatesService = {
      shiftAssignmentTemplate: jest.fn(),
      schedulePublishedTemplate: jest.fn(),
    } as unknown as jest.Mocked<EmailTemplatesService>;

    service = new ScheduleService(
      scheduleRepository,
      notificationsService,
      emailTemplatesService,
    );
  });

  it('uses exclusive end for date-only ranges to include sunday', async () => {
    scheduleRepository.findShifts.mockResolvedValue([]);

    await service.getSchedule('org-1', {
      from: '2024-02-19',
      to: '2024-02-25',
    } as any);

    expect(scheduleRepository.findShifts).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startsAt: {
            gte: new Date('2024-02-19T00:00:00.000Z'),
            lt: new Date('2024-02-26T00:00:00.000Z'),
          },
        }),
      }),
    );
  });
});
