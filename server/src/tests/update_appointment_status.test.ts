
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, specialtiesTable, doctorsTable, patientsTable, appointmentsTable } from '../db/schema';
import { type UpdateAppointmentStatusInput } from '../schema';
import { updateAppointmentStatus } from '../handlers/update_appointment_status';
import { eq } from 'drizzle-orm';

describe('updateAppointmentStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update appointment status', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashed_password',
        first_name: 'Dr. John',
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
        license_number: 'LIC123456',
        consultation_fee: '100.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'female'
      })
      .returning()
      .execute();

    const appointment = await db.insert(appointmentsTable)
      .values({
        patient_id: patient[0].id,
        doctor_id: doctor[0].id,
        appointment_date: new Date('2024-01-15 10:00:00'),
        duration_minutes: 30,
        status: 'scheduled',
        reason: 'Regular checkup',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const input: UpdateAppointmentStatusInput = {
      id: appointment[0].id,
      status: 'confirmed',
      notes: 'Patient confirmed attendance'
    };

    const result = await updateAppointmentStatus(input);

    // Verify the result
    expect(result.id).toEqual(appointment[0].id);
    expect(result.status).toEqual('confirmed');
    expect(result.notes).toEqual('Patient confirmed attendance');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(appointment[0].updated_at!.getTime());
  });

  it('should update status without notes', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashed_password',
        first_name: 'Dr. John',
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
        license_number: 'LIC123456',
        consultation_fee: '100.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'female'
      })
      .returning()
      .execute();

    const appointment = await db.insert(appointmentsTable)
      .values({
        patient_id: patient[0].id,
        doctor_id: doctor[0].id,
        appointment_date: new Date('2024-01-15 10:00:00'),
        duration_minutes: 30,
        status: 'scheduled',
        reason: 'Regular checkup',
        notes: 'Initial notes',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const input: UpdateAppointmentStatusInput = {
      id: appointment[0].id,
      status: 'completed'
    };

    const result = await updateAppointmentStatus(input);

    // Verify the result
    expect(result.id).toEqual(appointment[0].id);
    expect(result.status).toEqual('completed');
    expect(result.notes).toEqual('Initial notes'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'doctor@test.com',
        password_hash: 'hashed_password',
        first_name: 'Dr. John',
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
        license_number: 'LIC123456',
        consultation_fee: '100.00'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'female'
      })
      .returning()
      .execute();

    const appointment = await db.insert(appointmentsTable)
      .values({
        patient_id: patient[0].id,
        doctor_id: doctor[0].id,
        appointment_date: new Date('2024-01-15 10:00:00'),
        duration_minutes: 30,
        status: 'scheduled',
        reason: 'Regular checkup',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const input: UpdateAppointmentStatusInput = {
      id: appointment[0].id,
      status: 'cancelled',
      notes: 'Patient requested cancellation'
    };

    await updateAppointmentStatus(input);

    // Query database to verify changes were persisted
    const updatedAppointment = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, appointment[0].id))
      .execute();

    expect(updatedAppointment).toHaveLength(1);
    expect(updatedAppointment[0].status).toEqual('cancelled');
    expect(updatedAppointment[0].notes).toEqual('Patient requested cancellation');
    expect(updatedAppointment[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent appointment', async () => {
    const input: UpdateAppointmentStatusInput = {
      id: 99999,
      status: 'confirmed'
    };

    await expect(updateAppointmentStatus(input)).rejects.toThrow(/not found/i);
  });
});
