
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, specialtiesTable, doctorsTable, patientsTable, appointmentsTable, consultationsTable } from '../db/schema';
import { getConsultationByAppointment } from '../handlers/get_consultation_by_appointment';

describe('getConsultationByAppointment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return consultation for existing appointment', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashed_password',
        first_name: 'Dr',
        last_name: 'Smith',
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
        license_number: 'LIC123',
        consultation_fee: '150.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'male'
      })
      .returning()
      .execute();

    const appointment = await db.insert(appointmentsTable)
      .values({
        patient_id: patient[0].id,
        doctor_id: doctor[0].id,
        appointment_date: new Date('2024-01-15T10:00:00Z'),
        duration_minutes: 30,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const consultation = await db.insert(consultationsTable)
      .values({
        appointment_id: appointment[0].id,
        chief_complaint: 'Chest pain',
        symptoms: 'Sharp pain in chest',
        diagnosis: 'Muscle strain',
        treatment_plan: 'Rest and medication',
        prescription: 'Ibuprofen 400mg',
        follow_up_notes: 'Return in 2 weeks',
        follow_up_date: '2024-01-29'
      })
      .returning()
      .execute();

    const result = await getConsultationByAppointment(appointment[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(consultation[0].id);
    expect(result!.appointment_id).toEqual(appointment[0].id);
    expect(result!.chief_complaint).toEqual('Chest pain');
    expect(result!.symptoms).toEqual('Sharp pain in chest');
    expect(result!.diagnosis).toEqual('Muscle strain');
    expect(result!.treatment_plan).toEqual('Rest and medication');
    expect(result!.prescription).toEqual('Ibuprofen 400mg');
    expect(result!.follow_up_notes).toEqual('Return in 2 weeks');
    expect(result!.follow_up_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent appointment', async () => {
    const result = await getConsultationByAppointment(999);

    expect(result).toBeNull();
  });

  it('should return null for appointment without consultation', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashed_password',
        first_name: 'Dr',
        last_name: 'Smith',
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
        license_number: 'LIC123',
        consultation_fee: '150.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'male'
      })
      .returning()
      .execute();

    const appointment = await db.insert(appointmentsTable)
      .values({
        patient_id: patient[0].id,
        doctor_id: doctor[0].id,
        appointment_date: new Date('2024-01-15T10:00:00Z'),
        duration_minutes: 30,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const result = await getConsultationByAppointment(appointment[0].id);

    expect(result).toBeNull();
  });

  it('should handle consultation with null follow_up_date', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashed_password',
        first_name: 'Dr',
        last_name: 'Smith',
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
        license_number: 'LIC123',
        consultation_fee: '150.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'male'
      })
      .returning()
      .execute();

    const appointment = await db.insert(appointmentsTable)
      .values({
        patient_id: patient[0].id,
        doctor_id: doctor[0].id,
        appointment_date: new Date('2024-01-15T10:00:00Z'),
        duration_minutes: 30,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const consultation = await db.insert(consultationsTable)
      .values({
        appointment_id: appointment[0].id,
        chief_complaint: 'Headache',
        symptoms: 'Mild headache',
        diagnosis: 'Tension headache',
        treatment_plan: 'Stress management',
        prescription: null,
        follow_up_notes: null,
        follow_up_date: null
      })
      .returning()
      .execute();

    const result = await getConsultationByAppointment(appointment[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(consultation[0].id);
    expect(result!.appointment_id).toEqual(appointment[0].id);
    expect(result!.chief_complaint).toEqual('Headache');
    expect(result!.follow_up_date).toBeNull();
    expect(result!.prescription).toBeNull();
    expect(result!.follow_up_notes).toBeNull();
  });
});
