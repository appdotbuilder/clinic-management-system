
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, specialtiesTable, doctorsTable, patientsTable, appointmentsTable, consultationsTable } from '../db/schema';
import { type CreateConsultationInput } from '../schema';
import { createConsultation } from '../handlers/create_consultation';
import { eq } from 'drizzle-orm';

describe('createConsultation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testData: {
    appointmentId: number;
    patientId: number;
    doctorId: number;
    userId: number;
    specialtyId: number;
  };

  beforeEach(async () => {
    // Create user for doctor
    const userResult = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashed_password',
        first_name: 'Dr. John',
        last_name: 'Smith',
        role: 'doctor'
      })
      .returning()
      .execute();

    // Create specialty
    const specialtyResult = await db.insert(specialtiesTable)
      .values({
        name: 'Cardiology',
        description: 'Heart specialist'
      })
      .returning()
      .execute();

    // Create doctor
    const doctorResult = await db.insert(doctorsTable)
      .values({
        user_id: userResult[0].id,
        specialty_id: specialtyResult[0].id,
        license_number: 'LIC123456',
        phone: '555-0123',
        consultation_fee: '150.00'
      })
      .returning()
      .execute();

    // Create patient
    const patientResult = await db.insert(patientsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'female',
        phone: '555-0456',
        email: 'jane@test.com'
      })
      .returning()
      .execute();

    // Create appointment
    const appointmentResult = await db.insert(appointmentsTable)
      .values({
        patient_id: patientResult[0].id,
        doctor_id: doctorResult[0].id,
        appointment_date: new Date('2024-12-20T10:00:00Z'),
        duration_minutes: 30,
        reason: 'Regular checkup',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    testData = {
      appointmentId: appointmentResult[0].id,
      patientId: patientResult[0].id,
      doctorId: doctorResult[0].id,
      userId: userResult[0].id,
      specialtyId: specialtyResult[0].id
    };
  });

  it('should create a consultation with all fields', async () => {
    const testInput: CreateConsultationInput = {
      appointment_id: testData.appointmentId,
      chief_complaint: 'Chest pain',
      symptoms: 'Sharp pain in chest, shortness of breath',
      diagnosis: 'Mild angina',
      treatment_plan: 'Rest, medication, follow-up in 2 weeks',
      prescription: 'Nitroglycerin 0.4mg as needed',
      follow_up_notes: 'Patient should monitor symptoms',
      follow_up_date: new Date('2024-12-27')
    };

    const result = await createConsultation(testInput);

    // Basic field validation
    expect(result.appointment_id).toEqual(testData.appointmentId);
    expect(result.chief_complaint).toEqual('Chest pain');
    expect(result.symptoms).toEqual(testInput.symptoms);
    expect(result.diagnosis).toEqual('Mild angina');
    expect(result.treatment_plan).toEqual(testInput.treatment_plan);
    expect(result.prescription).toEqual(testInput.prescription);
    expect(result.follow_up_notes).toEqual(testInput.follow_up_notes);
    expect(result.follow_up_date).toEqual(testInput.follow_up_date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a consultation with minimal fields', async () => {
    const testInput: CreateConsultationInput = {
      appointment_id: testData.appointmentId,
      chief_complaint: null,
      symptoms: null,
      diagnosis: null,
      treatment_plan: null,
      prescription: null,
      follow_up_notes: null,
      follow_up_date: null
    };

    const result = await createConsultation(testInput);

    expect(result.appointment_id).toEqual(testData.appointmentId);
    expect(result.chief_complaint).toBeNull();
    expect(result.symptoms).toBeNull();
    expect(result.diagnosis).toBeNull();
    expect(result.treatment_plan).toBeNull();
    expect(result.prescription).toBeNull();
    expect(result.follow_up_notes).toBeNull();
    expect(result.follow_up_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save consultation to database', async () => {
    const testInput: CreateConsultationInput = {
      appointment_id: testData.appointmentId,
      chief_complaint: 'Headache',
      symptoms: 'Severe headache, nausea',
      diagnosis: 'Migraine',
      treatment_plan: 'Pain medication, rest',
      prescription: 'Ibuprofen 400mg twice daily',
      follow_up_notes: 'Call if symptoms worsen',
      follow_up_date: new Date('2024-12-25')
    };

    const result = await createConsultation(testInput);

    // Query database to verify consultation was saved
    const consultations = await db.select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, result.id))
      .execute();

    expect(consultations).toHaveLength(1);
    expect(consultations[0].appointment_id).toEqual(testData.appointmentId);
    expect(consultations[0].chief_complaint).toEqual('Headache');
    expect(consultations[0].symptoms).toEqual(testInput.symptoms);
    expect(consultations[0].diagnosis).toEqual('Migraine');
    expect(consultations[0].treatment_plan).toEqual(testInput.treatment_plan);
    expect(consultations[0].prescription).toEqual(testInput.prescription);
    expect(consultations[0].follow_up_notes).toEqual(testInput.follow_up_notes);
    expect(consultations[0].follow_up_date).toEqual('2024-12-25');
    expect(consultations[0].created_at).toBeInstanceOf(Date);
    expect(consultations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent appointment', async () => {
    const testInput: CreateConsultationInput = {
      appointment_id: 99999, // Non-existent appointment ID
      chief_complaint: 'Test complaint',
      symptoms: null,
      diagnosis: null,
      treatment_plan: null,
      prescription: null,
      follow_up_notes: null,
      follow_up_date: null
    };

    await expect(createConsultation(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
