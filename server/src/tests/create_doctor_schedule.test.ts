
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorSchedulesTable, usersTable, specialtiesTable, doctorsTable } from '../db/schema';
import { type CreateDoctorScheduleInput } from '../schema';
import { createDoctorSchedule } from '../handlers/create_doctor_schedule';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateDoctorScheduleInput = {
  doctor_id: 1,
  day_of_week: 1, // Monday
  start_time: '09:00',
  end_time: '17:00'
};

describe('createDoctorSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create prerequisite data
    // Create user first
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'doctor'
      })
      .returning()
      .execute();

    // Create specialty
    const specialty = await db.insert(specialtiesTable)
      .values({
        name: 'Cardiology',
        description: 'Heart specialist'
      })
      .returning()
      .execute();

    // Create doctor
    await db.insert(doctorsTable)
      .values({
        user_id: user[0].id,
        specialty_id: specialty[0].id,
        license_number: 'DOC123',
        phone: '+1234567890',
        consultation_fee: '150.00'
      })
      .returning()
      .execute();
  });

  it('should create a doctor schedule', async () => {
    const result = await createDoctorSchedule(testInput);

    // Basic field validation
    expect(result.doctor_id).toEqual(1);
    expect(result.day_of_week).toEqual(1);
    expect(result.start_time).toEqual('09:00:00'); // PostgreSQL time format includes seconds
    expect(result.end_time).toEqual('17:00:00'); // PostgreSQL time format includes seconds
    expect(result.is_available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save doctor schedule to database', async () => {
    const result = await createDoctorSchedule(testInput);

    // Query using proper drizzle syntax
    const schedules = await db.select()
      .from(doctorSchedulesTable)
      .where(eq(doctorSchedulesTable.id, result.id))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].doctor_id).toEqual(1);
    expect(schedules[0].day_of_week).toEqual(1);
    expect(schedules[0].start_time).toEqual('09:00:00'); // PostgreSQL time format includes seconds
    expect(schedules[0].end_time).toEqual('17:00:00'); // PostgreSQL time format includes seconds
    expect(schedules[0].is_available).toEqual(true);
    expect(schedules[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different day of week values', async () => {
    const sundayInput = { ...testInput, day_of_week: 0 }; // Sunday
    const saturdayInput = { ...testInput, day_of_week: 6 }; // Saturday

    const sundayResult = await createDoctorSchedule(sundayInput);
    const saturdayResult = await createDoctorSchedule(saturdayInput);

    expect(sundayResult.day_of_week).toEqual(0);
    expect(saturdayResult.day_of_week).toEqual(6);

    // Verify both are saved
    const schedules = await db.select()
      .from(doctorSchedulesTable)
      .execute();

    expect(schedules).toHaveLength(2);
  });

  it('should handle different time formats correctly', async () => {
    const earlyInput = { ...testInput, start_time: '08:30', end_time: '12:30' };
    
    const result = await createDoctorSchedule(earlyInput);

    expect(result.start_time).toEqual('08:30:00'); // PostgreSQL time format includes seconds
    expect(result.end_time).toEqual('12:30:00'); // PostgreSQL time format includes seconds

    // Verify in database
    const schedule = await db.select()
      .from(doctorSchedulesTable)
      .where(eq(doctorSchedulesTable.id, result.id))
      .execute();

    expect(schedule[0].start_time).toEqual('08:30:00'); // PostgreSQL time format includes seconds
    expect(schedule[0].end_time).toEqual('12:30:00'); // PostgreSQL time format includes seconds
  });

  it('should fail when doctor does not exist', async () => {
    const invalidInput = { ...testInput, doctor_id: 999 };

    await expect(createDoctorSchedule(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
