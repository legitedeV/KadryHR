import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { LocationsService } from './locations.service';

describe('LocationsService geocodeLocation', () => {
  let service: LocationsService;
  let configService: { get: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockReturnValue('test-key'),
    };

    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: PrismaService, useValue: {} },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reject invalid coordinates', async () => {
    await expect(service.geocodeLocation(120, 10)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should reject when api key is missing', async () => {
    configService.get.mockReturnValue(undefined);
    await expect(service.geocodeLocation(52.2297, 21.0122)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should normalize geocode response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        results: [
          {
            formatted_address: 'ul. Marszałkowska 10, 00-000 Warszawa, Polska',
            address_components: [
              {
                long_name: '10',
                short_name: '10',
                types: ['street_number'],
              },
              {
                long_name: 'Marszałkowska',
                short_name: 'Marszałkowska',
                types: ['route'],
              },
              {
                long_name: '00-000',
                short_name: '00-000',
                types: ['postal_code'],
              },
              {
                long_name: 'Warszawa',
                short_name: 'Warszawa',
                types: ['locality'],
              },
              {
                long_name: 'Polska',
                short_name: 'PL',
                types: ['country'],
              },
            ],
          },
        ],
      }),
    });

    await expect(service.geocodeLocation(52.2297, 21.0122)).resolves.toEqual({
      formattedAddress: 'ul. Marszałkowska 10, 00-000 Warszawa, Polska',
      street: 'Marszałkowska',
      streetNumber: '10',
      postalCode: '00-000',
      city: 'Warszawa',
      country: 'Polska',
    });
  });

  it('should reject when Google returns no results', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ZERO_RESULTS',
        results: [],
      }),
    });

    await expect(service.geocodeLocation(52.2297, 21.0122)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
