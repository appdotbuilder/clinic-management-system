
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, usersTable, patientsTable, doctorsTable, specialtiesTable, appointmentsTable, consultationsTable } from '../db/schema';
import { type CreateDocumentInput } from '../schema';
import { createDocument } from '../handlers/create_document';
import { eq } from 'drizzle-orm';

describe('createDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testDoctorId: number;
  let testPatientId: number;
  let testAppointmentId: number;
  let testConsultationId: number;

  beforeEach(async () => {
    // Create test user (for uploaded_by)
    const users = await db.insert(usersTable)
      .values({
        email: 'uploader@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Uploader',
        role: 'secretary'
      })
      .returning()
      .execute();
    testUserId = users[0].id;

    // Create test specialty
    const specialties = await db.insert(specialtiesTable)
      .values({
        name: 'Test Specialty',
        description: 'A specialty for testing'
      })
      .returning()
      .execute();

    // Create test doctor user
    const doctorUsers = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Dr',
        last_name: 'Test',
        role: 'doctor'
      })
      .returning()
      .execute();

    // Create test doctor
    const doctors = await db.insert(doctorsTable)
      .values({
        user_id: doctorUsers[0].id,
        specialty_id: specialties[0].id,
        license_number: 'DOC123',
        consultation_fee: '100.00'
      })
      .returning()
      .execute();
    testDoctorId = doctors[0].id;

    // Create test patient
    const patients = await db.insert(patientsTable)
      .values({
        first_name: 'Test',
        last_name: 'Patient',
        date_of_birth: '1990-01-01',
        gender: 'male'
      })
      .returning()
      .execute();
    testPatientId = patients[0].id;

    // Create test appointment
    const appointments = await db.insert(appointmentsTable)
      .values({
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        appointment_date: new Date(),
        duration_minutes: 30,
        created_by: testUserId
      })
      .returning()
      .execute();
    testAppointmentId = appointments[0].id;

    // Create test consultation
    const consultations = await db.insert(consultationsTable)
      .values({
        appointment_id: testAppointmentId
      })
      .returning()
      .execute();
    testConsultationId = consultations[0].id;
  });

  // Test input with all required fields
  const getTestInput = (): CreateDocumentInput => ({
    patient_id: testPatientId,
    doctor_id: testDoctorId,
    consultation_id: testConsultationId,
    type: 'lab_result',
    title: 'Blood Test Results',
    description: 'Complete blood count results',
    file_path: '/uploads/documents/blood_test_123.pdf',
    file_size: 2048,
    mime_type: 'application/pdf',
    uploaded_by: testUserId
  });

  it('should create a document with all fields', async () => {
    const input = getTestInput();
    const result = await createDocument(input);

    // Verify all fields are set correctly
    expect(result.patient_id).toEqual(testPatientId);
    expect(result.doctor_id).toEqual(testDoctorId);
    expect(result.consultation_id).toEqual(testConsultationId);
    expect(result.type).toEqual('lab_result');
    expect(result.title).toEqual('Blood Test Results');
    expect(result.description).toEqual('Complete blood count results');
    expect(result.file_path).toEqual('/uploads/documents/blood_test_123.pdf');
    expect(result.file_size).toEqual(2048);
    expect(result.mime_type).toEqual('application/pdf');
    expect(result.uploaded_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save document to database', async () => {
    const input = getTestInput();
    const result = await createDocument(input);

    // Query database to verify document was saved
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].patient_id).toEqual(testPatientId);
    expect(documents[0].title).toEqual('Blood Test Results');
    expect(documents[0].type).toEqual('lab_result');
    expect(documents[0].file_size).toEqual(2048);
    expect(documents[0].created_at).toBeInstanceOf(Date);
  });

  it('should create document with nullable fields as null', async () => {
    const input: CreateDocumentInput = {
      patient_id: testPatientId,
      doctor_id: null,
      consultation_id: null,
      type: 'other',
      title: 'General Document',
      description: null,
      file_path: '/uploads/general.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      uploaded_by: testUserId
    };

    const result = await createDocument(input);

    expect(result.doctor_id).toBeNull();
    expect(result.consultation_id).toBeNull();
    expect(result.description).toBeNull();
    expect(result.type).toEqual('other');
    expect(result.title).toEqual('General Document');
  });

  it('should create document with different document types', async () => {
    const types = ['lab_result', 'prescription', 'medical_report', 'imaging', 'referral', 'other'] as const;

    for (const type of types) {
      const input: CreateDocumentInput = {
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        consultation_id: testConsultationId,
        type: type,
        title: `Test ${type}`,
        description: null,
        file_path: `/uploads/${type}.pdf`,
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: testUserId
      };

      const result = await createDocument(input);
      expect(result.type).toEqual(type);
      expect(result.title).toEqual(`Test ${type}`);
    }
  });

  it('should throw error for invalid patient_id foreign key', async () => {
    const input: CreateDocumentInput = {
      patient_id: 99999, // Non-existent patient
      doctor_id: testDoctorId,
      consultation_id: testConsultationId,
      type: 'lab_result',
      title: 'Test Document',
      description: null,
      file_path: '/uploads/test.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      uploaded_by: testUserId
    };

    await expect(createDocument(input)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should throw error for invalid uploaded_by foreign key', async () => {
    const input: CreateDocumentInput = {
      patient_id: testPatientId,
      doctor_id: testDoctorId,
      consultation_id: testConsultationId,
      type: 'lab_result',
      title: 'Test Document',
      description: null,
      file_path: '/uploads/test.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      uploaded_by: 99999 // Non-existent user
    };

    await expect(createDocument(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
