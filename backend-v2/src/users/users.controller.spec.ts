import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PermissionsService } from '../auth/permissions.service';
import { Role } from '@prisma/client';

const mockUsersService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMemberRole: jest.fn(),
};

const mockPermissionsService = {
  canChangeUserRole: jest.fn().mockReturnValue({ allowed: true }),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: PermissionsService, useValue: mockPermissionsService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('returns users scoped to organisation', async () => {
    mockUsersService.findAll.mockResolvedValue([{ id: 'user-1' }]);

    const result = await controller.findAll({
      id: 'actor-1',
      organisationId: 'org-1',
      role: Role.OWNER,
      email: 'owner@example.com',
    });

    expect(result).toEqual([{ id: 'user-1' }]);
    expect(mockUsersService.findAll).toHaveBeenCalledWith('org-1');
  });

  it('creates user with actor context', async () => {
    mockUsersService.create.mockResolvedValue({ id: 'user-2' });

    await controller.create(
      {
        id: 'actor-1',
        organisationId: 'org-1',
        role: Role.OWNER,
        email: 'owner@example.com',
      },
      {
        email: 'new@example.com',
        password: 'StrongPass123!',
        role: Role.MANAGER,
      },
    );

    expect(mockUsersService.create).toHaveBeenCalledWith('actor-1', 'org-1', {
      email: 'new@example.com',
      password: 'StrongPass123!',
      role: Role.MANAGER,
    });
  });
});
