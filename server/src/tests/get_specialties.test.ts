
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { specialtiesTable } from '../db/schema';
import { type CreateSpecialtyInput } from '../schema';
import { getSpecialties } from '../handlers/get_specialties';

describe('getSpecialties', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no specialties exist', async () => {
    const result = await getSpecialties();
    expect(result).toEqual([]);
  });

  it('should return active specialties', async () => {
    // Create test specialties
    await db.insert(specialtiesTable)
      .values([
        {
          name: 'Cardiology',
          description: 'Heart and blood vessel care',
          is_active: true
        },
        {
          name: 'Neurology', 
          description: 'Brain and nervous system care',
          is_active: true
        }
      ])
      .execute();

    const result = await getSpecialties();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Cardiology');
    expect(result[0].description).toEqual('Heart and blood vessel care');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Neurology');
    expect(result[1].description).toEqual('Brain and nervous system care');
    expect(result[1].is_active).toBe(true);
  });

  it('should not return inactive specialties', async () => {
    // Create both active and inactive specialties
    await db.insert(specialtiesTable)
      .values([
        {
          name: 'Cardiology',
          description: 'Heart care',
          is_active: true
        },
        {
          name: 'Inactive Specialty',
          description: 'Should not appear',
          is_active: false
        }
      ])
      .execute();

    const result = await getSpecialties();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Cardiology');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle null descriptions correctly', async () => {
    await db.insert(specialtiesTable)
      .values({
        name: 'General Medicine',
        description: null,
        is_active: true
      })
      .execute();

    const result = await getSpecialties();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('General Medicine');
    expect(result[0].description).toBeNull();
    expect(result[0].is_active).toBe(true);
  });
});
