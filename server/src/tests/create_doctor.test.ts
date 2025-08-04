
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorsTable, usersTable, specialtiesTable } from '../db/schema';
import { type CreateDoctorInput } from '../schema';
import { createDoctor } from '../handlers/create_doctor';
import { eq } from 'drizzle-orm';

describe('createDoctor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a doctor', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'doctor'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create prerequisite specialty
    const specialtyResult = await db.insert(specialtiesTable)
      .values({
        name: 'Cardiology',
        description: 'Heart specialist'
      })
      .returning()
      .execute();
    const specialty = specialtyResult[0];

    // Test input
    const testInput: CreateDoctorInput = {
      user_id: user.id,
      specialty_id: specialty.id,
      license_number: 'LIC123456',
      phone: '+1234567890',
      consultation_fee: 150.75,
      bio: 'Experienced cardiologist'
    };

    const result = await createDoctor(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.specialty_id).toEqual(specialty.id);
    expect(result.license_number).toEqual('LIC123456');
    expect(result.phone).toEqual('+1234567890');
    expect(result.consultation_fee).toEqual(150.75);
    expect(typeof result.consultation_fee).toBe('number');
    expect(result.bio).toEqual('Experienced cardiologist');
    expect(result.is_available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save doctor to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'doctor2@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'doctor'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create prerequisite specialty
    const specialtyResult = await db.insert(specialtiesTable)
      .values({
        name: 'Neurology',
        description: 'Brain specialist'
      })
      .returning()
      .execute();
    const specialty = specialtyResult[0];

    const testInput: CreateDoctorInput = {
      user_id: user.id,
      specialty_id: specialty.id,
      license_number: 'LIC789012',
      phone: null,
      consultation_fee: 200.00,
      bio: null
    };

    const result = await createDoctor(testInput);

    // Query using proper drizzle syntax
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, result.id))
      .execute();

    expect(doctors).toHaveLength(1);
    expect(doctors[0].user_id).toEqual(user.id);
    expect(doctors[0].specialty_id).toEqual(specialty.id);
    expect(doctors[0].license_number).toEqual('LIC789012');
    expect(doctors[0].phone).toBeNull();
    expect(parseFloat(doctors[0].consultation_fee)).toEqual(200.00);
    expect(doctors[0].bio).toBeNull();
    expect(doctors[0].is_available).toEqual(true);
    expect(doctors[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key validation', async () => {
    const testInput: CreateDoctorInput = {
      user_id: 999, // Non-existent user_id
      specialty_id: 999, // Non-existent specialty_id
      license_number: 'LIC999999',
      phone: '+1234567890',
      consultation_fee: 100.00,
      bio: 'Test doctor'
    };

    expect(createDoctor(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
