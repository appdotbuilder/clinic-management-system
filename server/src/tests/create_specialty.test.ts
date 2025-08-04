
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { specialtiesTable } from '../db/schema';
import { type CreateSpecialtyInput } from '../schema';
import { createSpecialty } from '../handlers/create_specialty';
import { eq } from 'drizzle-orm';

const testInput: CreateSpecialtyInput = {
  name: 'Cardiology',
  description: 'Heart and cardiovascular system specialization'
};

describe('createSpecialty', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a specialty with description', async () => {
    const result = await createSpecialty(testInput);

    expect(result.name).toEqual('Cardiology');
    expect(result.description).toEqual('Heart and cardiovascular system specialization');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a specialty with null description', async () => {
    const inputWithoutDescription: CreateSpecialtyInput = {
      name: 'Neurology',
      description: null
    };

    const result = await createSpecialty(inputWithoutDescription);

    expect(result.name).toEqual('Neurology');
    expect(result.description).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save specialty to database', async () => {
    const result = await createSpecialty(testInput);

    const specialties = await db.select()
      .from(specialtiesTable)
      .where(eq(specialtiesTable.id, result.id))
      .execute();

    expect(specialties).toHaveLength(1);
    expect(specialties[0].name).toEqual('Cardiology');
    expect(specialties[0].description).toEqual('Heart and cardiovascular system specialization');
    expect(specialties[0].is_active).toBe(true);
    expect(specialties[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate specialty names', async () => {
    await createSpecialty(testInput);

    const duplicateInput: CreateSpecialtyInput = {
      name: 'Cardiology',
      description: 'Another cardiology specialty'
    };

    await expect(createSpecialty(duplicateInput)).rejects.toThrow(/unique/i);
  });
});
