import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindLeaveRequestsQueryDto } from './find-leave-requests-query.dto';

async function validateDto(payload: Record<string, unknown>) {
  const dto = plainToInstance(FindLeaveRequestsQueryDto, payload);
  const errors = await validate(dto);
  return errors;
}

describe('FindLeaveRequestsQueryDto', () => {
  it('accepts valid pagination inputs', async () => {
    const errors = await validateDto({ skip: 0, take: 10 });
    expect(errors).toHaveLength(0);
  });

  it('rejects negative or non-integer values', async () => {
    const errors = await validateDto({ skip: -1, take: 'abc' });
    expect(errors).not.toHaveLength(0);
  });
});
