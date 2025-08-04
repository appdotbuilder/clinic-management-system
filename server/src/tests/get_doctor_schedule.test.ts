
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, specialtiesTable, doctorsTable, doctorSchedulesTable } from '../db/schema';
import { type CreateUserInput, type CreateSpecialtyInput, type CreateDoctorInput, type CreateDoctorScheduleInput } from '../schema';
import { getDoctorSchedule } from '../handlers/get_doctor_schedule';

// Test data
const testUser: CreateUserInput = {
  email: 'doctor@test.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'doctor'
};

const testSpecialty: CreateSpecialtyInput = {
  name: 'General Medicine',
  description: 'General medical practice'
};

const testDoctor: CreateDoctorInput = {
  user_id: 1,
  specialty_id: 1,
  license_number: 'LIC123456',
  phone: '+1234567890',
  consultation_fee: 150.00,
  bio: 'Experienced doctor'
};

const testSchedules: CreateDoctorScheduleInput[] = [
  {
    doctor_id: 1,
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '17:00'
  },
  {
    doctor_id: 1,
    day_of_week: 2, // Tuesday
    start_time: '10:00',
    end_time: '16:00'
  },
  {
    doctor_id: 1,
    day_of_week: 3, // Wednesday
    start_time: '08:00',
    end_time: '18:00'
  }
];

describe('getDoctorSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for doctor with no schedule', async () => {
    // Create prerequisites but no schedule
    await db.insert(usersTable).values({
      email: testUser.email,
      password_hash: 'hashed_password',
      first_name: testUser.first_name,
      last_name: testUser.last_name,
      role: testUser.role
    });

    await db.insert(specialtiesTable).values({
      name: testSpecialty.name,
      description: testSpecialty.description
    });

    await db.insert(doctorsTable).values({
      user_id: testDoctor.user_id,
      specialty_id: testDoctor.specialty_id,
      license_number: testDoctor.license_number,
      phone: testDoctor.phone,
      consultation_fee: testDoctor.consultation_fee.toString(),
      bio: testDoctor.bio
    });

    const result = await getDoctorSchedule(1);

    expect(result).toEqual([]);
  });

  it('should return doctor schedule ordered by day and time', async () => {
    // Create prerequisites
    await db.insert(usersTable).values({
      email: testUser.email,
      password_hash: 'hashed_password',
      first_name: testUser.first_name,
      last_name: testUser.last_name,
      role: testUser.role
    });

    await db.insert(specialtiesTable).values({
      name: testSpecialty.name,
      description: testSpecialty.description
    });

    await db.insert(doctorsTable).values({
      user_id: testDoctor.user_id,
      specialty_id: testDoctor.specialty_id,
      license_number: testDoctor.license_number,
      phone: testDoctor.phone,
      consultation_fee: testDoctor.consultation_fee.toString(),
      bio: testDoctor.bio
    });

    // Insert schedules in random order to test ordering
    await db.insert(doctorSchedulesTable).values([
      {
        doctor_id: testSchedules[2].doctor_id,
        day_of_week: testSchedules[2].day_of_week,
        start_time: testSchedules[2].start_time,
        end_time: testSchedules[2].end_time
      },
      {
        doctor_id: testSchedules[0].doctor_id,
        day_of_week: testSchedules[0].day_of_week,
        start_time: testSchedules[0].start_time,
        end_time: testSchedules[0].end_time
      },
      {
        doctor_id: testSchedules[1].doctor_id,
        day_of_week: testSchedules[1].day_of_week,
        start_time: testSchedules[1].start_time,
        end_time: testSchedules[1].end_time
      }
    ]);

    const result = await getDoctorSchedule(1);

    expect(result).toHaveLength(3);
    
    // Verify ordering by day_of_week
    expect(result[0].day_of_week).toBe(1); // Monday
    expect(result[1].day_of_week).toBe(2); // Tuesday
    expect(result[2].day_of_week).toBe(3); // Wednesday

    // Verify schedule details
    expect(result[0].start_time).toBe('09:00:00');
    expect(result[0].end_time).toBe('17:00:00');
    expect(result[0].is_available).toBe(true);
    expect(result[0].doctor_id).toBe(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].start_time).toBe('10:00:00');
    expect(result[1].end_time).toBe('16:00:00');
    
    expect(result[2].start_time).toBe('08:00:00');
    expect(result[2].end_time).toBe('18:00:00');
  });

  it('should return only schedules for specified doctor', async () => {
    // Create two doctors
    await db.insert(usersTable).values([
      {
        email: 'doctor1@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'doctor'
      },
      {
        email: 'doctor2@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'doctor'
      }
    ]);

    await db.insert(specialtiesTable).values({
      name: testSpecialty.name,
      description: testSpecialty.description
    });

    await db.insert(doctorsTable).values([
      {
        user_id: 1,
        specialty_id: 1,
        license_number: 'LIC123456',
        phone: '+1234567890',
        consultation_fee: '150.00',
        bio: 'Doctor 1'
      },
      {
        user_id: 2,
        specialty_id: 1,
        license_number: 'LIC789012',
        phone: '+0987654321',
        consultation_fee: '200.00',
        bio: 'Doctor 2'
      }
    ]);

    // Create schedules for both doctors
    await db.insert(doctorSchedulesTable).values([
      {
        doctor_id: 1,
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00'
      },
      {
        doctor_id: 2,
        day_of_week: 1,
        start_time: '10:00',
        end_time: '18:00'
      },
      {
        doctor_id: 1,
        day_of_week: 2,
        start_time: '08:00',
        end_time: '16:00'
      }
    ]);

    const result = await getDoctorSchedule(1);

    expect(result).toHaveLength(2);
    result.forEach(schedule => {
      expect(schedule.doctor_id).toBe(1);
    });
  });

  it('should handle multiple schedules on same day ordered by start time', async () => {
    // Create prerequisites
    await db.insert(usersTable).values({
      email: testUser.email,
      password_hash: 'hashed_password',
      first_name: testUser.first_name,
      last_name: testUser.last_name,
      role: testUser.role
    });

    await db.insert(specialtiesTable).values({
      name: testSpecialty.name,
      description: testSpecialty.description
    });

    await db.insert(doctorsTable).values({
      user_id: testDoctor.user_id,
      specialty_id: testDoctor.specialty_id,
      license_number: testDoctor.license_number,
      phone: testDoctor.phone,
      consultation_fee: testDoctor.consultation_fee.toString(),
      bio: testDoctor.bio
    });

    // Create multiple schedules for the same day
    await db.insert(doctorSchedulesTable).values([
      {
        doctor_id: 1,
        day_of_week: 1,
        start_time: '14:00',
        end_time: '18:00'
      },
      {
        doctor_id: 1,
        day_of_week: 1,
        start_time: '08:00',
        end_time: '12:00'
      }
    ]);

    const result = await getDoctorSchedule(1);

    expect(result).toHaveLength(2);
    expect(result[0].start_time).toBe('08:00:00'); // Earlier time first
    expect(result[1].start_time).toBe('14:00:00'); // Later time second
  });
});
