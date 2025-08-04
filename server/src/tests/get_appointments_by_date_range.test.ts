
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, specialtiesTable, doctorsTable, patientsTable, appointmentsTable } from '../db/schema';
import { type GetAppointmentsByDateRangeInput } from '../schema';
import { getAppointmentsByDateRange } from '../handlers/get_appointments_by_date_range';

describe('getAppointmentsByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return appointments within date range', async () => {
    // Create test data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'Doctor',
        role: 'doctor'
      })
      .returning()
      .execute();

    const specialty = await db.insert(specialtiesTable)
      .values({
        name: 'Cardiology',
        description: 'Heart specialist'
      })
      .returning()
      .execute();

    const doctor = await db.insert(doctorsTable)
      .values({
        user_id: user[0].id,
        specialty_id: specialty[0].id,
        license_number: 'DOC123',
        consultation_fee: '150.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'male'
      })
      .returning()
      .execute();

    // Create appointments on different dates
    const baseDate = new Date('2024-01-15');
    const appointment1Date = new Date(baseDate);
    const appointment2Date = new Date(baseDate);
    appointment2Date.setDate(appointment2Date.getDate() + 2);
    const appointment3Date = new Date(baseDate);
    appointment3Date.setDate(appointment3Date.getDate() + 10); // Outside range

    await db.insert(appointmentsTable)
      .values([
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: appointment1Date,
          duration_minutes: 30,
          reason: 'Checkup 1',
          created_by: user[0].id
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: appointment2Date,
          duration_minutes: 45,
          reason: 'Checkup 2',
          created_by: user[0].id
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: appointment3Date,
          duration_minutes: 30,
          reason: 'Checkup 3',
          created_by: user[0].id
        }
      ])
      .execute();

    // Test input for first 5 days
    const startDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-20');
    const input: GetAppointmentsByDateRangeInput = {
      start_date: startDate,
      end_date: endDate
    };

    const result = await getAppointmentsByDateRange(input);

    // Should return 2 appointments within range
    expect(result).toHaveLength(2);
    expect(result[0].reason).toEqual('Checkup 1');
    expect(result[1].reason).toEqual('Checkup 2');
    expect(result[0].appointment_date).toBeInstanceOf(Date);
    expect(result[1].appointment_date).toBeInstanceOf(Date);
    
    // Verify dates are within range
    result.forEach(appointment => {
      expect(appointment.appointment_date >= startDate).toBe(true);
      expect(appointment.appointment_date <= endDate).toBe(true);
    });
  });

  it('should filter by doctor when doctor_id is provided', async () => {
    // Create test users
    const user1 = await db.insert(usersTable)
      .values({
        email: 'doctor1@test.com',
        password_hash: 'hash',
        first_name: 'Doctor',
        last_name: 'One',
        role: 'doctor'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        email: 'doctor2@test.com',
        password_hash: 'hash',
        first_name: 'Doctor',
        last_name: 'Two',
        role: 'doctor'
      })
      .returning()
      .execute();

    const specialty = await db.insert(specialtiesTable)
      .values({
        name: 'General Medicine',
        description: 'General practice'
      })
      .returning()
      .execute();

    // Create two doctors
    const doctor1 = await db.insert(doctorsTable)
      .values({
        user_id: user1[0].id,
        specialty_id: specialty[0].id,
        license_number: 'DOC001',
        consultation_fee: '100.00'
      })
      .returning()
      .execute();

    const doctor2 = await db.insert(doctorsTable)
      .values({
        user_id: user2[0].id,
        specialty_id: specialty[0].id,
        license_number: 'DOC002',
        consultation_fee: '120.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1985-05-15',
        gender: 'female'
      })
      .returning()
      .execute();

    const appointmentDate = new Date('2024-02-10');

    // Create appointments for both doctors on same date
    await db.insert(appointmentsTable)
      .values([
        {
          patient_id: patient[0].id,
          doctor_id: doctor1[0].id,
          appointment_date: appointmentDate,
          duration_minutes: 30,
          reason: 'Doctor 1 appointment',
          created_by: user1[0].id
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctor2[0].id,
          appointment_date: appointmentDate,
          duration_minutes: 45,
          reason: 'Doctor 2 appointment',
          created_by: user2[0].id
        }
      ])
      .execute();

    // Test filtering by specific doctor
    const input: GetAppointmentsByDateRangeInput = {
      doctor_id: doctor1[0].id,
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };

    const result = await getAppointmentsByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].doctor_id).toEqual(doctor1[0].id);
    expect(result[0].reason).toEqual('Doctor 1 appointment');
  });

  it('should return empty array when no appointments in date range', async () => {
    const input: GetAppointmentsByDateRangeInput = {
      start_date: new Date('2024-12-01'),
      end_date: new Date('2024-12-31')
    };

    const result = await getAppointmentsByDateRange(input);

    expect(result).toHaveLength(0);
  });

  it('should return appointments ordered by appointment date', async () => {
    // Create test data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'Doctor',
        role: 'doctor'
      })
      .returning()
      .execute();

    const specialty = await db.insert(specialtiesTable)
      .values({
        name: 'Neurology',
        description: 'Brain specialist'
      })
      .returning()
      .execute();

    const doctor = await db.insert(doctorsTable)
      .values({
        user_id: user[0].id,
        specialty_id: specialty[0].id,
        license_number: 'NEU123',
        consultation_fee: '200.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'Alice',
        last_name: 'Johnson',
        date_of_birth: '1992-03-20',
        gender: 'female'
      })
      .returning()
      .execute();

    // Create appointments in non-chronological order
    const laterDate = new Date('2024-03-20');
    const earlierDate = new Date('2024-03-10');
    const middleDate = new Date('2024-03-15');

    await db.insert(appointmentsTable)
      .values([
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: laterDate,
          duration_minutes: 30,
          reason: 'Latest appointment',
          created_by: user[0].id
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: earlierDate,
          duration_minutes: 30,
          reason: 'Earliest appointment',
          created_by: user[0].id
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: middleDate,
          duration_minutes: 30,
          reason: 'Middle appointment',
          created_by: user[0].id
        }
      ])
      .execute();

    const input: GetAppointmentsByDateRangeInput = {
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-03-31')
    };

    const result = await getAppointmentsByDateRange(input);

    expect(result).toHaveLength(3);
    // Verify chronological order
    expect(result[0].reason).toEqual('Earliest appointment');
    expect(result[1].reason).toEqual('Middle appointment');
    expect(result[2].reason).toEqual('Latest appointment');
    
    // Verify dates are in ascending order
    expect(result[0].appointment_date <= result[1].appointment_date).toBe(true);
    expect(result[1].appointment_date <= result[2].appointment_date).toBe(true);
  });

  it('should handle edge case with exact date boundaries', async () => {
    // Create test data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'Doctor',
        role: 'doctor'
      })
      .returning()
      .execute();

    const specialty = await db.insert(specialtiesTable)
      .values({
        name: 'Dermatology',
        description: 'Skin specialist'
      })
      .returning()
      .execute();

    const doctor = await db.insert(doctorsTable)
      .values({
        user_id: user[0].id,
        specialty_id: specialty[0].id,
        license_number: 'DERM123',
        consultation_fee: '180.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'Bob',
        last_name: 'Wilson',
        date_of_birth: '1988-07-12',
        gender: 'male'
      })
      .returning()
      .execute();

    // Create appointments exactly on boundaries
    const startBoundary = new Date('2024-04-01T00:00:00Z');
    const endBoundary = new Date('2024-04-30T23:59:59Z');
    const outsideStart = new Date('2024-03-31T23:59:59Z');
    const outsideEnd = new Date('2024-05-01T00:00:01Z');

    await db.insert(appointmentsTable)
      .values([
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: startBoundary,
          duration_minutes: 30,
          reason: 'Start boundary',
          created_by: user[0].id
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: endBoundary,
          duration_minutes: 30,
          reason: 'End boundary',
          created_by: user[0].id
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: outsideStart,
          duration_minutes: 30,
          reason: 'Outside start',
          created_by: user[0].id
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: outsideEnd,
          duration_minutes: 30,
          reason: 'Outside end',
          created_by: user[0].id
        }
      ])
      .execute();

    const input: GetAppointmentsByDateRangeInput = {
      start_date: new Date('2024-04-01'),
      end_date: new Date('2024-04-30T23:59:59Z')
    };

    const result = await getAppointmentsByDateRange(input);

    expect(result).toHaveLength(2);
    const reasons = result.map(r => r.reason);
    expect(reasons).toContain('Start boundary');
    expect(reasons).toContain('End boundary');
    expect(reasons).not.toContain('Outside start');
    expect(reasons).not.toContain('Outside end');
  });
});
