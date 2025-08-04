
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { appointmentsTable, usersTable, specialtiesTable, doctorsTable, patientsTable } from '../db/schema';
import { type CreateAppointmentInput } from '../schema';
import { createAppointment } from '../handlers/create_appointment';
import { eq } from 'drizzle-orm';

describe('createAppointment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPatientId: number;
  let testDoctorId: number;
  let testUserId: number;
  let testSpecialtyId: number;

  beforeEach(async () => {
    // Create prerequisite data
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Dr. John',
        last_name: 'Smith',
        role: 'doctor'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create specialty
    const specialtyResult = await db.insert(specialtiesTable)
      .values({
        name: 'Cardiology',
        description: 'Heart specialist'
      })
      .returning()
      .execute();
    testSpecialtyId = specialtyResult[0].id;

    // Create doctor
    const doctorResult = await db.insert(doctorsTable)
      .values({
        user_id: testUserId,
        specialty_id: testSpecialtyId,
        license_number: 'DOC123456',
        phone: '555-0123',
        consultation_fee: '150.00',
        bio: 'Experienced cardiologist'
      })
      .returning()
      .execute();
    testDoctorId = doctorResult[0].id;

    // Create patient
    const patientResult = await db.insert(patientsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'female',
        phone: '555-0456',
        email: 'jane.doe@example.com'
      })
      .returning()
      .execute();
    testPatientId = patientResult[0].id;
  });

  it('should create an appointment', async () => {
    const testInput: CreateAppointmentInput = {
      patient_id: testPatientId,
      doctor_id: testDoctorId,
      appointment_date: new Date('2024-01-15T10:00:00Z'),
      duration_minutes: 30,
      reason: 'Regular checkup',
      created_by: testUserId
    };

    const result = await createAppointment(testInput);

    // Basic field validation
    expect(result.patient_id).toEqual(testPatientId);
    expect(result.doctor_id).toEqual(testDoctorId);
    expect(result.appointment_date).toEqual(new Date('2024-01-15T10:00:00Z'));
    expect(result.duration_minutes).toEqual(30);
    expect(result.status).toEqual('scheduled');
    expect(result.reason).toEqual('Regular checkup');
    expect(result.created_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save appointment to database', async () => {
    const testInput: CreateAppointmentInput = {
      patient_id: testPatientId,
      doctor_id: testDoctorId,
      appointment_date: new Date('2024-01-15T10:00:00Z'),
      duration_minutes: 30,
      reason: 'Regular checkup',
      created_by: testUserId
    };

    const result = await createAppointment(testInput);

    // Query database to verify appointment was saved
    const appointments = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, result.id))
      .execute();

    expect(appointments).toHaveLength(1);
    expect(appointments[0].patient_id).toEqual(testPatientId);
    expect(appointments[0].doctor_id).toEqual(testDoctorId);
    expect(appointments[0].appointment_date).toEqual(new Date('2024-01-15T10:00:00Z'));
    expect(appointments[0].duration_minutes).toEqual(30);
    expect(appointments[0].status).toEqual('scheduled');
    expect(appointments[0].reason).toEqual('Regular checkup');
    expect(appointments[0].created_by).toEqual(testUserId);
    expect(appointments[0].created_at).toBeInstanceOf(Date);
    expect(appointments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent patient', async () => {
    const testInput: CreateAppointmentInput = {
      patient_id: 99999, // Non-existent patient ID
      doctor_id: testDoctorId,
      appointment_date: new Date('2024-01-15T10:00:00Z'),
      duration_minutes: 30,
      reason: 'Regular checkup',
      created_by: testUserId
    };

    expect(createAppointment(testInput)).rejects.toThrow(/patient not found/i);
  });

  it('should throw error for non-existent doctor', async () => {
    const testInput: CreateAppointmentInput = {
      patient_id: testPatientId,
      doctor_id: 99999, // Non-existent doctor ID
      appointment_date: new Date('2024-01-15T10:00:00Z'),
      duration_minutes: 30,
      reason: 'Regular checkup',
      created_by: testUserId
    };

    expect(createAppointment(testInput)).rejects.toThrow(/doctor not found/i);
  });

  it('should create appointment with nullable fields', async () => {
    const testInput: CreateAppointmentInput = {
      patient_id: testPatientId,
      doctor_id: testDoctorId,
      appointment_date: new Date('2024-01-15T10:00:00Z'),
      duration_minutes: 30,
      reason: null,
      created_by: testUserId
    };

    const result = await createAppointment(testInput);

    expect(result.reason).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.patient_id).toEqual(testPatientId);
    expect(result.doctor_id).toEqual(testDoctorId);
    expect(result.status).toEqual('scheduled');
  });
});
