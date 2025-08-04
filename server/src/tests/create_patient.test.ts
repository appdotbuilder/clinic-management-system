
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { createPatient } from '../handlers/create_patient';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePatientInput = {
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: new Date('1990-05-15'),
  gender: 'male',
  phone: '+1234567890',
  email: 'john.doe@example.com',
  address: '123 Main St, City, State 12345',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '+0987654321',
  medical_history: 'No significant medical history',
  allergies: 'Penicillin',
  current_medications: 'None',
  insurance_info: 'Health Insurance Plan ABC'
};

describe('createPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a patient with all fields', async () => {
    const result = await createPatient(testInput);

    // Basic field validation
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.date_of_birth).toEqual(new Date('1990-05-15'));
    expect(result.gender).toEqual('male');
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.address).toEqual('123 Main St, City, State 12345');
    expect(result.emergency_contact_name).toEqual('Jane Doe');
    expect(result.emergency_contact_phone).toEqual('+0987654321');
    expect(result.medical_history).toEqual('No significant medical history');
    expect(result.allergies).toEqual('Penicillin');
    expect(result.current_medications).toEqual('None');
    expect(result.insurance_info).toEqual('Health Insurance Plan ABC');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save patient to database', async () => {
    const result = await createPatient(testInput);

    // Query database to verify patient was saved
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(patients).toHaveLength(1);
    const savedPatient = patients[0];
    expect(savedPatient.first_name).toEqual('John');
    expect(savedPatient.last_name).toEqual('Doe');
    expect(savedPatient.date_of_birth).toEqual('1990-05-15'); // Database stores as string
    expect(savedPatient.gender).toEqual('male');
    expect(savedPatient.phone).toEqual('+1234567890');
    expect(savedPatient.email).toEqual('john.doe@example.com');
    expect(savedPatient.created_at).toBeInstanceOf(Date);
    expect(savedPatient.updated_at).toBeInstanceOf(Date);
  });

  it('should create patient with minimal required fields', async () => {
    const minimalInput: CreatePatientInput = {
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: new Date('1985-12-20'),
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

    const result = await createPatient(minimalInput);

    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.date_of_birth).toEqual(new Date('1985-12-20'));
    expect(result.gender).toEqual('female');
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.address).toBeNull();
    expect(result.emergency_contact_name).toBeNull();
    expect(result.emergency_contact_phone).toBeNull();
    expect(result.medical_history).toBeNull();
    expect(result.allergies).toBeNull();
    expect(result.current_medications).toBeNull();
    expect(result.insurance_info).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should handle different gender values', async () => {
    const testCases = [
      { ...testInput, gender: 'male' as const },
      { ...testInput, gender: 'female' as const },
      { ...testInput, gender: 'other' as const }
    ];

    for (const testCase of testCases) {
      const result = await createPatient(testCase);
      expect(result.gender).toEqual(testCase.gender);
    }
  });

  it('should handle date_of_birth correctly', async () => {
    const birthDate = new Date('1975-03-10');
    const inputWithDate = {
      ...testInput,
      date_of_birth: birthDate
    };

    const result = await createPatient(inputWithDate);

    expect(result.date_of_birth).toEqual(birthDate);
    expect(result.date_of_birth).toBeInstanceOf(Date);
  });

  it('should handle date conversion properly', async () => {
    const testDate = new Date('2000-01-01');
    const inputWithDate = {
      ...testInput,
      date_of_birth: testDate
    };

    const result = await createPatient(inputWithDate);

    // Verify the returned date matches input
    expect(result.date_of_birth.getFullYear()).toEqual(2000);
    expect(result.date_of_birth.getMonth()).toEqual(0); // January is 0
    expect(result.date_of_birth.getDate()).toEqual(1);

    // Verify database storage
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(patients[0].date_of_birth).toEqual('2000-01-01');
  });
});
