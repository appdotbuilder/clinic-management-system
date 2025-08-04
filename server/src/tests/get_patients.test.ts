
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { getPatients } from '../handlers/get_patients';

// Test patient data - convert dates to strings for database insertion
const testPatient1 = {
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1985-06-15',
  gender: 'male' as const,
  phone: '555-1234',
  email: 'john.doe@example.com',
  address: '123 Main St',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '555-5678',
  medical_history: 'No significant history',
  allergies: 'None known',
  current_medications: 'None',
  insurance_info: 'Blue Cross Blue Shield'
};

const testPatient2 = {
  first_name: 'Alice',
  last_name: 'Smith',
  date_of_birth: '1990-03-22',
  gender: 'female' as const,
  phone: '555-9999',
  email: 'alice.smith@example.com',
  address: '456 Oak Ave',
  emergency_contact_name: 'Bob Smith',
  emergency_contact_phone: '555-8888',
  medical_history: 'Hypertension',
  allergies: 'Penicillin',
  current_medications: 'Lisinopril 10mg',
  insurance_info: 'Aetna'
};

describe('getPatients', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no patients exist', async () => {
    const result = await getPatients();

    expect(result).toEqual([]);
  });

  it('should return all patients from database', async () => {
    // Create test patients
    await db.insert(patientsTable)
      .values([testPatient1, testPatient2])
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(2);
    
    // Check first patient
    const patient1 = result.find(p => p.first_name === 'John');
    expect(patient1).toBeDefined();
    expect(patient1!.last_name).toEqual('Doe');
    expect(patient1!.date_of_birth).toBeInstanceOf(Date);
    expect(patient1!.date_of_birth.getFullYear()).toEqual(1985);
    expect(patient1!.gender).toEqual('male');
    expect(patient1!.email).toEqual('john.doe@example.com');
    expect(patient1!.phone).toEqual('555-1234');

    // Check second patient
    const patient2 = result.find(p => p.first_name === 'Alice');
    expect(patient2).toBeDefined();
    expect(patient2!.last_name).toEqual('Smith');
    expect(patient2!.date_of_birth).toBeInstanceOf(Date);
    expect(patient2!.date_of_birth.getFullYear()).toEqual(1990);
    expect(patient2!.gender).toEqual('female');
    expect(patient2!.email).toEqual('alice.smith@example.com');
    expect(patient2!.medical_history).toEqual('Hypertension');
  });

  it('should return patients with proper date types', async () => {
    await db.insert(patientsTable)
      .values([testPatient1])
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(1);
    const patient = result[0];
    
    // Verify all date fields are Date objects
    expect(patient.date_of_birth).toBeInstanceOf(Date);
    expect(patient.created_at).toBeInstanceOf(Date);
    expect(patient.updated_at).toBeInstanceOf(Date);
    
    // Verify date_of_birth has correct value
    expect(patient.date_of_birth.toISOString().split('T')[0]).toEqual('1985-06-15');
  });

  it('should handle patients with nullable fields', async () => {
    const minimalPatient = {
      first_name: 'Minimal',
      last_name: 'Patient',
      date_of_birth: '2000-01-01',
      gender: 'other' as const,
      phone: null,
      email: null,
      address: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      medical_history: null,
      allergies: null,
      current_medications: null,
      insurance_info: null
    };

    await db.insert(patientsTable)
      .values([minimalPatient])
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(1);
    const patient = result[0];
    
    expect(patient.first_name).toEqual('Minimal');
    expect(patient.last_name).toEqual('Patient');
    expect(patient.gender).toEqual('other');
    expect(patient.phone).toBeNull();
    expect(patient.email).toBeNull();
    expect(patient.address).toBeNull();
    expect(patient.emergency_contact_name).toBeNull();
    expect(patient.medical_history).toBeNull();
  });
});
