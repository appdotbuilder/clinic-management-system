
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, specialtiesTable, doctorsTable } from '../db/schema';
import { getDoctors } from '../handlers/get_doctors';
import { type CreateUserInput, type CreateSpecialtyInput, type CreateDoctorInput } from '../schema';

describe('getDoctors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no doctors exist', async () => {
    const result = await getDoctors();
    expect(result).toEqual([]);
  });

  it('should return active doctors with converted numeric fields', async () => {
    // Create prerequisite data
    const userData: CreateUserInput = {
      email: 'doctor@test.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      role: 'doctor'
    };

    const specialtyData: CreateSpecialtyInput = {
      name: 'Cardiology',
      description: 'Heart specialist'
    };

    // Insert user
    const [user] = await db.insert(usersTable)
      .values({
        email: userData.email,
        password_hash: 'hashed_password',
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role
      })
      .returning()
      .execute();

    // Insert specialty
    const [specialty] = await db.insert(specialtiesTable)
      .values(specialtyData)
      .returning()
      .execute();

    // Insert doctor
    const doctorData: CreateDoctorInput = {
      user_id: user.id,
      specialty_id: specialty.id,
      license_number: 'DOC123456',
      phone: '+1234567890',
      consultation_fee: 150.50,
      bio: 'Experienced cardiologist'
    };

    await db.insert(doctorsTable)
      .values({
        ...doctorData,
        consultation_fee: doctorData.consultation_fee.toString()
      })
      .execute();

    const result = await getDoctors();

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].specialty_id).toEqual(specialty.id);
    expect(result[0].license_number).toEqual('DOC123456');
    expect(result[0].phone).toEqual('+1234567890');
    expect(result[0].consultation_fee).toEqual(150.50);
    expect(typeof result[0].consultation_fee).toBe('number');
    expect(result[0].bio).toEqual('Experienced cardiologist');
    expect(result[0].is_available).toBe(true);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should only return available doctors', async () => {
    // Create prerequisite data
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'doctor1@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'doctor'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'doctor2@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'doctor'
      })
      .returning()
      .execute();

    const [specialty] = await db.insert(specialtiesTable)
      .values({
        name: 'Cardiology',
        description: 'Heart specialist'
      })
      .returning()
      .execute();

    // Insert available doctor
    await db.insert(doctorsTable)
      .values({
        user_id: user1.id,
        specialty_id: specialty.id,
        license_number: 'DOC123456',
        phone: '+1234567890',
        consultation_fee: '150.50',
        bio: 'Available doctor',
        is_available: true
      })
      .execute();

    // Insert unavailable doctor
    await db.insert(doctorsTable)
      .values({
        user_id: user2.id,
        specialty_id: specialty.id,
        license_number: 'DOC789012',
        phone: '+0987654321',
        consultation_fee: '200.00',
        bio: 'Unavailable doctor',
        is_available: false
      })
      .execute();

    const result = await getDoctors();

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1.id);
    expect(result[0].bio).toEqual('Available doctor');
    expect(result[0].is_available).toBe(true);
  });

  it('should return multiple active doctors', async () => {
    // Create two users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'doctor1@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'doctor'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'doctor2@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'doctor'
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

    // Insert two doctors
    await db.insert(doctorsTable)
      .values([
        {
          user_id: user1.id,
          specialty_id: specialty.id,
          license_number: 'DOC123456',
          phone: '+1234567890',
          consultation_fee: '150.50',
          bio: 'First doctor'
        },
        {
          user_id: user2.id,
          specialty_id: specialty.id,
          license_number: 'DOC789012',
          phone: '+0987654321',
          consultation_fee: '200.75',
          bio: 'Second doctor'
        }
      ])
      .execute();

    const result = await getDoctors();

    expect(result).toHaveLength(2);
    expect(result[0].consultation_fee).toEqual(150.50);
    expect(result[1].consultation_fee).toEqual(200.75);
    expect(typeof result[0].consultation_fee).toBe('number');
    expect(typeof result[1].consultation_fee).toBe('number');
  });
});
