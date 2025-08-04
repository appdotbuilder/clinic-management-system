
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, specialtiesTable, doctorsTable, patientsTable, appointmentsTable, consultationsTable } from '../db/schema';
import { type UpdateConsultationInput } from '../schema';
import { updateConsultation } from '../handlers/update_consultation';
import { eq } from 'drizzle-orm';

describe('updateConsultation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let consultationId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashed_password',
        first_name: 'Dr. John',
        last_name: 'Doe',
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
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1990-01-01',
        gender: 'female'
      })
      .returning()
      .execute();

    const appointment = await db.insert(appointmentsTable)
      .values({
        patient_id: patient[0].id,
        doctor_id: doctor[0].id,
        appointment_date: new Date('2024-12-20T10:00:00Z'),
        duration_minutes: 30,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const consultation = await db.insert(consultationsTable)
      .values({
        appointment_id: appointment[0].id,
        chief_complaint: 'Initial complaint',
        symptoms: 'Initial symptoms',
        diagnosis: 'Initial diagnosis'
      })
      .returning()
      .execute();

    consultationId = consultation[0].id;
  });

  it('should update consultation with provided fields', async () => {
    const input: UpdateConsultationInput = {
      id: consultationId,
      chief_complaint: 'Updated chest pain',
      symptoms: 'Updated shortness of breath',
      diagnosis: 'Updated hypertension',
      treatment_plan: 'New treatment plan',
      prescription: 'Updated medication list'
    };

    const result = await updateConsultation(input);

    expect(result.id).toEqual(consultationId);
    expect(result.chief_complaint).toEqual('Updated chest pain');
    expect(result.symptoms).toEqual('Updated shortness of breath');
    expect(result.diagnosis).toEqual('Updated hypertension');
    expect(result.treatment_plan).toEqual('New treatment plan');
    expect(result.prescription).toEqual('Updated medication list');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const input: UpdateConsultationInput = {
      id: consultationId,
      diagnosis: 'Updated diagnosis only'
    };

    const result = await updateConsultation(input);

    expect(result.id).toEqual(consultationId);
    expect(result.chief_complaint).toEqual('Initial complaint'); // Unchanged
    expect(result.symptoms).toEqual('Initial symptoms'); // Unchanged
    expect(result.diagnosis).toEqual('Updated diagnosis only'); // Changed
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle date fields correctly', async () => {
    const followUpDate = new Date('2024-12-30');
    const input: UpdateConsultationInput = {
      id: consultationId,
      follow_up_notes: 'Follow up in 2 weeks',
      follow_up_date: followUpDate
    };

    const result = await updateConsultation(input);

    expect(result.id).toEqual(consultationId);
    expect(result.follow_up_notes).toEqual('Follow up in 2 weeks');
    expect(result.follow_up_date).toBeInstanceOf(Date);
    expect(result.follow_up_date?.toISOString().split('T')[0]).toEqual('2024-12-30');
  });

  it('should set nullable fields to null', async () => {
    const input: UpdateConsultationInput = {
      id: consultationId,
      chief_complaint: null,
      symptoms: null,
      follow_up_date: null
    };

    const result = await updateConsultation(input);

    expect(result.id).toEqual(consultationId);
    expect(result.chief_complaint).toBeNull();
    expect(result.symptoms).toBeNull();
    expect(result.follow_up_date).toBeNull();
  });

  it('should persist changes in database', async () => {
    const input: UpdateConsultationInput = {
      id: consultationId,
      diagnosis: 'Confirmed diagnosis',
      treatment_plan: 'Long-term treatment'
    };

    await updateConsultation(input);

    // Verify changes in database
    const consultations = await db.select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, consultationId))
      .execute();

    expect(consultations).toHaveLength(1);
    expect(consultations[0].diagnosis).toEqual('Confirmed diagnosis');
    expect(consultations[0].treatment_plan).toEqual('Long-term treatment');
    expect(consultations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle date persistence correctly', async () => {
    const followUpDate = new Date('2024-12-25');
    const input: UpdateConsultationInput = {
      id: consultationId,
      follow_up_date: followUpDate
    };

    await updateConsultation(input);

    // Verify date is stored and retrieved correctly
    const consultations = await db.select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, consultationId))
      .execute();

    expect(consultations).toHaveLength(1);
    expect(consultations[0].follow_up_date).toEqual('2024-12-25');
  });

  it('should throw error for non-existent consultation', async () => {
    const input: UpdateConsultationInput = {
      id: 99999,
      diagnosis: 'Test diagnosis'
    };

    expect(updateConsultation(input)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const originalConsultation = await db.select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, consultationId))
      .execute();

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateConsultationInput = {
      id: consultationId,
      diagnosis: 'Updated diagnosis'
    };

    const result = await updateConsultation(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalConsultation[0].updated_at.getTime());
  });
});
