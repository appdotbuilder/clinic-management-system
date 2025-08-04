
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput, type UpdatePatientInput } from '../schema';
import { updatePatient } from '../handlers/update_patient';
import { eq } from 'drizzle-orm';

// Test data
const createPatientInput: CreatePatientInput = {
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: new Date('1990-01-01'),
  gender: 'male',
  phone: '+1-555-0123',
  email: 'john.doe@example.com',
  address: '123 Main St',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '+1-555-0124',
  medical_history: 'No significant history',
  allergies: 'None',
  current_medications: 'None',
  insurance_info: 'Blue Cross Blue Shield'
};

describe('updatePatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update patient with all fields', async () => {
    // Create a patient first - convert Date to string for database insertion
    const createdPatients = await db.insert(patientsTable)
      .values({
        ...createPatientInput,
        date_of_birth: createPatientInput.date_of_birth.toISOString().split('T')[0] // Convert to YYYY-MM-DD
      })
      .returning()
      .execute();
    
    const createdPatient = createdPatients[0];

    const updateInput: UpdatePatientInput = {
      id: createdPatient.id,
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: new Date('1985-05-15'),
      gender: 'female',
      phone: '+1-555-9999',
      email: 'jane.smith@example.com',
      address: '456 Oak Ave',
      emergency_contact_name: 'John Smith',
      emergency_contact_phone: '+1-555-8888',
      medical_history: 'Diabetes',
      allergies: 'Penicillin',
      current_medications: 'Metformin',
      insurance_info: 'Aetna'
    };

    const result = await updatePatient(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(createdPatient.id);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.date_of_birth).toEqual(new Date('1985-05-15'));
    expect(result.gender).toEqual('female');
    expect(result.phone).toEqual('+1-555-9999');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.address).toEqual('456 Oak Ave');
    expect(result.emergency_contact_name).toEqual('John Smith');
    expect(result.emergency_contact_phone).toEqual('+1-555-8888');
    expect(result.medical_history).toEqual('Diabetes');
    expect(result.allergies).toEqual('Penicillin');
    expect(result.current_medications).toEqual('Metformin');
    expect(result.insurance_info).toEqual('Aetna');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create a patient first - convert Date to string for database insertion
    const createdPatients = await db.insert(patientsTable)
      .values({
        ...createPatientInput,
        date_of_birth: createPatientInput.date_of_birth.toISOString().split('T')[0] // Convert to YYYY-MM-DD
      })
      .returning()
      .execute();
    
    const createdPatient = createdPatients[0];

    const updateInput: UpdatePatientInput = {
      id: createdPatient.id,
      first_name: 'Updated John',
      phone: '+1-555-7777'
    };

    const result = await updatePatient(updateInput);

    // Verify only specified fields were updated
    expect(result.first_name).toEqual('Updated John');
    expect(result.phone).toEqual('+1-555-7777');
    
    // Verify other fields remained unchanged
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.address).toEqual('123 Main St');
    expect(result.gender).toEqual('male');
  });

  it('should update nullable fields to null', async () => {
    // Create a patient first - convert Date to string for database insertion
    const createdPatients = await db.insert(patientsTable)
      .values({
        ...createPatientInput,
        date_of_birth: createPatientInput.date_of_birth.toISOString().split('T')[0] // Convert to YYYY-MM-DD
      })
      .returning()
      .execute();
    
    const createdPatient = createdPatients[0];

    const updateInput: UpdatePatientInput = {
      id: createdPatient.id,
      phone: null,
      email: null,
      allergies: null
    };

    const result = await updatePatient(updateInput);

    // Verify nullable fields were set to null
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.allergies).toBeNull();
    
    // Verify other fields remained unchanged
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
  });

  it('should save updated patient to database', async () => {
    // Create a patient first - convert Date to string for database insertion
    const createdPatients = await db.insert(patientsTable)
      .values({
        ...createPatientInput,
        date_of_birth: createPatientInput.date_of_birth.toISOString().split('T')[0] // Convert to YYYY-MM-DD
      })
      .returning()
      .execute();
    
    const createdPatient = createdPatients[0];

    const updateInput: UpdatePatientInput = {
      id: createdPatient.id,
      first_name: 'Database Test',
      last_name: 'Patient'
    };

    await updatePatient(updateInput);

    // Query database directly to verify changes were persisted
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, createdPatient.id))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].first_name).toEqual('Database Test');
    expect(patients[0].last_name).toEqual('Patient');
  });

  it('should throw error for non-existent patient', async () => {
    const updateInput: UpdatePatientInput = {
      id: 99999,
      first_name: 'Non-existent'
    };

    await expect(updatePatient(updateInput)).rejects.toThrow(/Patient with id 99999 not found/i);
  });

  it('should handle date conversion correctly', async () => {
    // Create a patient first - convert Date to string for database insertion
    const createdPatients = await db.insert(patientsTable)
      .values({
        ...createPatientInput,
        date_of_birth: createPatientInput.date_of_birth.toISOString().split('T')[0] // Convert to YYYY-MM-DD
      })
      .returning()
      .execute();
    
    const createdPatient = createdPatients[0];

    const newDate = new Date('1995-12-25');
    const updateInput: UpdatePatientInput = {
      id: createdPatient.id,
      date_of_birth: newDate
    };

    const result = await updatePatient(updateInput);

    // Verify date is returned as Date object
    expect(result.date_of_birth).toBeInstanceOf(Date);
    expect(result.date_of_birth.getTime()).toEqual(newDate.getTime());
  });
});
