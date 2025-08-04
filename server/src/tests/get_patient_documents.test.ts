
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, specialtiesTable, doctorsTable, patientsTable, documentsTable } from '../db/schema';
import { getPatientDocuments } from '../handlers/get_patient_documents';

describe('getPatientDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return documents for a specific patient', async () => {
    // Create test user (uploader)
    const [user] = await db.insert(usersTable)
      .values({
        email: 'uploader@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Uploader',
        role: 'secretary'
      })
      .returning()
      .execute();

    // Create specialty
    const [specialty] = await db.insert(specialtiesTable)
      .values({
        name: 'Cardiology',
        description: 'Heart specialist'
      })
      .returning()
      .execute();

    // Create doctor user
    const [doctorUser] = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashed_password',
        first_name: 'Dr. Jane',
        last_name: 'Smith',
        role: 'doctor'
      })
      .returning()
      .execute();

    // Create doctor
    const [doctor] = await db.insert(doctorsTable)
      .values({
        user_id: doctorUser.id,
        specialty_id: specialty.id,
        license_number: 'DOC123',
        consultation_fee: '150.00'
      })
      .returning()
      .execute();

    // Create test patient
    const [patient] = await db.insert(patientsTable)
      .values({
        first_name: 'Test',
        last_name: 'Patient',
        date_of_birth: '1990-01-01',
        gender: 'male',
        phone: '123-456-7890',
        email: 'patient@test.com'
      })
      .returning()
      .execute();

    // Create test documents
    const [document1] = await db.insert(documentsTable)
      .values({
        patient_id: patient.id,
        doctor_id: doctor.id,
        type: 'lab_result',
        title: 'Blood Test Results',
        description: 'Annual blood work',
        file_path: '/uploads/blood_test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: user.id
      })
      .returning()
      .execute();

    const [document2] = await db.insert(documentsTable)
      .values({
        patient_id: patient.id,
        doctor_id: null,
        type: 'prescription',
        title: 'Medication Prescription',
        description: 'Monthly prescription',
        file_path: '/uploads/prescription.pdf',
        file_size: 512,
        mime_type: 'application/pdf',
        uploaded_by: user.id
      })
      .returning()
      .execute();

    const result = await getPatientDocuments(patient.id);

    expect(result).toHaveLength(2);
    
    // Check first document
    const doc1 = result.find(d => d.id === document1.id);
    expect(doc1).toBeDefined();
    expect(doc1!.patient_id).toEqual(patient.id);
    expect(doc1!.doctor_id).toEqual(doctor.id);
    expect(doc1!.type).toEqual('lab_result');
    expect(doc1!.title).toEqual('Blood Test Results');
    expect(doc1!.file_size).toEqual(1024);
    expect(doc1!.created_at).toBeInstanceOf(Date);

    // Check second document
    const doc2 = result.find(d => d.id === document2.id);
    expect(doc2).toBeDefined();
    expect(doc2!.patient_id).toEqual(patient.id);
    expect(doc2!.doctor_id).toBeNull();
    expect(doc2!.type).toEqual('prescription');
    expect(doc2!.title).toEqual('Medication Prescription');
    expect(doc2!.file_size).toEqual(512);
  });

  it('should return empty array for patient with no documents', async () => {
    // Create test patient without documents
    const [patient] = await db.insert(patientsTable)
      .values({
        first_name: 'No',
        last_name: 'Documents',
        date_of_birth: '1985-05-15',
        gender: 'female'
      })
      .returning()
      .execute();

    const result = await getPatientDocuments(patient.id);

    expect(result).toHaveLength(0);
  });

  it('should not return documents for other patients', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'uploader@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Uploader',
        role: 'secretary'
      })
      .returning()
      .execute();

    // Create two patients
    const [patient1] = await db.insert(patientsTable)
      .values({
        first_name: 'Patient',
        last_name: 'One',
        date_of_birth: '1990-01-01',
        gender: 'male'
      })
      .returning()
      .execute();

    const [patient2] = await db.insert(patientsTable)
      .values({
        first_name: 'Patient',
        last_name: 'Two',
        date_of_birth: '1992-02-02',
        gender: 'female'
      })
      .returning()
      .execute();

    // Create document for patient1
    await db.insert(documentsTable)
      .values({
        patient_id: patient1.id,
        type: 'medical_report',
        title: 'Patient 1 Report',
        file_path: '/uploads/report1.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
        uploaded_by: user.id
      })
      .execute();

    // Create document for patient2
    await db.insert(documentsTable)
      .values({
        patient_id: patient2.id,
        type: 'imaging',
        title: 'Patient 2 X-Ray',
        file_path: '/uploads/xray2.jpg',
        file_size: 4096,
        mime_type: 'image/jpeg',
        uploaded_by: user.id
      })
      .execute();

    // Query documents for patient1
    const result = await getPatientDocuments(patient1.id);

    expect(result).toHaveLength(1);
    expect(result[0].patient_id).toEqual(patient1.id);
    expect(result[0].title).toEqual('Patient 1 Report');
  });
});
