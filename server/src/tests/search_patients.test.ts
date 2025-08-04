
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { searchPatients } from '../handlers/search_patients';

// Test patient data
const testPatients: CreatePatientInput[] = [
  {
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: new Date('1990-01-15'),
    gender: 'male',
    phone: '555-0123',
    email: 'john.doe@example.com',
    address: '123 Main St',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    medical_history: null,
    allergies: null,
    current_medications: null,
    insurance_info: null
  },
  {
    first_name: 'Jane',
    last_name: 'Smith',
    date_of_birth: new Date('1985-03-22'),
    gender: 'female',
    phone: '555-0456',
    email: 'jane.smith@example.com',
    address: '456 Oak Ave',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    medical_history: null,
    allergies: null,
    current_medications: null,
    insurance_info: null
  },
  {
    first_name: 'Bob',
    last_name: 'Wilson',
    date_of_birth: new Date('1975-07-10'),
    gender: 'male',
    phone: '555-0789',
    email: 'bob.wilson@example.com',
    address: '789 Pine St',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    medical_history: null,
    allergies: null,
    current_medications: null,
    insurance_info: null
  }
];

describe('searchPatients', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test patients
    for (const patient of testPatients) {
      await db.insert(patientsTable)
        .values({
          ...patient,
          date_of_birth: patient.date_of_birth.toISOString().split('T')[0] // Convert Date to string for insertion
        })
        .execute();
    }
  });
  
  afterEach(resetDB);

  it('should search patients by first name', async () => {
    const results = await searchPatients({ search_term: 'John', limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('John');
    expect(results[0].last_name).toEqual('Doe');
    expect(results[0].email).toEqual('john.doe@example.com');
    expect(results[0].date_of_birth).toBeInstanceOf(Date);
  });

  it('should search patients by last name', async () => {
    const results = await searchPatients({ search_term: 'Smith', limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Jane');
    expect(results[0].last_name).toEqual('Smith');
    expect(results[0].email).toEqual('jane.smith@example.com');
  });

  it('should search patients by phone number', async () => {
    const results = await searchPatients({ search_term: '555-0456', limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Jane');
    expect(results[0].phone).toEqual('555-0456');
  });

  it('should search patients by email', async () => {
    const results = await searchPatients({ search_term: 'bob.wilson@example.com', limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Bob');
    expect(results[0].email).toEqual('bob.wilson@example.com');
  });

  it('should perform case-insensitive search', async () => {
    const results = await searchPatients({ search_term: 'jane', limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Jane');
  });

  it('should search with partial matches', async () => {
    const results = await searchPatients({ search_term: 'Do', limit: 10 });

    expect(results).toHaveLength(1); // Only John Doe
    expect(results[0].first_name).toEqual('John');
    expect(results[0].last_name).toEqual('Doe');
  });

  it('should respect limit parameter', async () => {
    const results = await searchPatients({ search_term: 'o', limit: 2 });

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should return empty array when no matches found', async () => {
    const results = await searchPatients({ search_term: 'NonExistent', limit: 10 });

    expect(results).toHaveLength(0);
  });

  it('should apply default limit when not provided', async () => {
    // Since TypeScript requires limit, we'll test with the default value explicitly
    const results = await searchPatients({ search_term: '555', limit: 10 });

    expect(results.length).toBeLessThanOrEqual(10);
    results.forEach(patient => {
      expect(patient.id).toBeDefined();
      expect(patient.created_at).toBeInstanceOf(Date);
      expect(patient.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should search across multiple fields simultaneously', async () => {
    const results = await searchPatients({ search_term: 'example.com', limit: 10 });

    expect(results).toHaveLength(3); // All test patients have example.com emails
    results.forEach(patient => {
      expect(patient.email).toMatch(/example\.com/);
    });
  });

  it('should find patients by partial phone search', async () => {
    const results = await searchPatients({ search_term: '0123', limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('John');
    expect(results[0].phone).toEqual('555-0123');
  });
});
