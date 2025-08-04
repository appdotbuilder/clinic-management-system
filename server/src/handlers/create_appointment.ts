
import { db } from '../db';
import { appointmentsTable, patientsTable, doctorsTable } from '../db/schema';
import { type CreateAppointmentInput, type Appointment } from '../schema';
import { eq } from 'drizzle-orm';

export const createAppointment = async (input: CreateAppointmentInput): Promise<Appointment> => {
  try {
    // Verify patient exists
    const patient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.patient_id))
      .execute();

    if (patient.length === 0) {
      throw new Error('Patient not found');
    }

    // Verify doctor exists
    const doctor = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, input.doctor_id))
      .execute();

    if (doctor.length === 0) {
      throw new Error('Doctor not found');
    }

    // Insert appointment record
    const result = await db.insert(appointmentsTable)
      .values({
        patient_id: input.patient_id,
        doctor_id: input.doctor_id,
        appointment_date: input.appointment_date,
        duration_minutes: input.duration_minutes,
        status: 'scheduled',
        reason: input.reason,
        created_by: input.created_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Appointment creation failed:', error);
    throw error;
  }
};
