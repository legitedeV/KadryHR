import * as generatedPrisma from '../generated/prisma';

describe('generated prisma module', () => {
  it('exposes PrismaClient', () => {
    expect(typeof generatedPrisma.PrismaClient).toBe('function');
  });
});
