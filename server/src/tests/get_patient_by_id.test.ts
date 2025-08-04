
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { getPatientById } from '../handlers/get_patient_by_id';

const testPatientInput: CreatePatientInput = {
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: new Date('1990-01-15'),
  gender: 'male',
  phone: '+1234567890',
  email: 'john.doe@example.com',
  address: '123 Main St, City, State 12345',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '+1987654321',
  medical_history: 'No significant medical history',
  allergies: 'None known',
  current_medications: 'None',
  insurance_info: 'Health Insurance Plan ABC'
};

describe('getPatientById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return patient when found', async () => {
    // Create test patient
    const insertedPatients = await db.insert(patientsTable)
      .values({
        ...testPatientInput,
        date_of_birth: testPatientInput.date_of_birth.toISOString().split('T')[0] // Convert to date string for insertion
      })
      .returning()
      .execute();

    const insertedPatient = insertedPatients[0];

    // Test the handler
    const result = await getPatientById(insertedPatient.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedPatient.id);
    expect(result!.first_name).toEqual('John');
    expect(result!.last_name).toEqual('Doe');
    expect(result!.date_of_birth).toBeInstanceOf(Date);
    expect(result!.date_of_birth.toISOString().split('T')[0]).toEqual('1990-01-15');
    expect(result!.gender).toEqual('male');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.address).toEqual('123 Main St, City, State 12345');
    expect(result!.emergency_contact_name).toEqual('Jane Doe');
    expect(result!.emergency_contact_phone).toEqual('+1987654321');
    expect(result!.medical_history).toEqual('No significant medical history');
    expect(result!.allergies).toEqual('None known');
    expect(result!.current_medications).toEqual('None');
    expect(result!.insurance_info).toEqual('Health Insurance Plan ABC');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when patient not found', async () => {
    const result = await getPatientById(999);

    expect(result).toBeNull();
  });

  it('should handle patients with minimal data', async () => {
    // Create patient with only required fields
    const minimalPatient: CreatePatientInput = {
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: new Date('1985-03-20'),
      gender: 'female',
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

    const insertedPatients = await db.insert(patientsTable)
      .values({
        ...minimalPatient,
        date_of_birth: minimalPatient.date_of_birth.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const insertedPatient = insertedPatients[0];

    const result = await getPatientById(insertedPatient.id);

    expect(result).not.toBeNull();
    expect(result!.first_name).toEqual('Jane');
    expect(result!.last_name).toEqual('Smith');
    expect(result!.date_of_birth).toBeInstanceOf(Date);
    expect(result!.gender).toEqual('female');
    expect(result!.phone).toBeNull();
    expect(result!.email).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.emergency_contact_name).toBeNull();
    expect(result!.emergency_contact_phone).toBeNull();
    expect(result!.medical_history).toBeNull();
    expect(result!.allergies).toBeNull();
    expect(result!.current_medications).toBeNull();
    expect(result!.insurance_info).toBeNull();
  });
});
