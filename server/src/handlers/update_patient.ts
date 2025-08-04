
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type UpdatePatientInput, type Patient } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePatient = async (input: UpdatePatientInput): Promise<Patient> => {
  try {
    // First, verify the patient exists
    const existingPatients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.id))
      .execute();

    if (existingPatients.length === 0) {
      throw new Error(`Patient with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof patientsTable.$inferInsert> = {};

    if (input.first_name !== undefined) updateData.first_name = input.first_name;
    if (input.last_name !== undefined) updateData.last_name = input.last_name;
    if (input.date_of_birth !== undefined) updateData.date_of_birth = input.date_of_birth.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.emergency_contact_name !== undefined) updateData.emergency_contact_name = input.emergency_contact_name;
    if (input.emergency_contact_phone !== undefined) updateData.emergency_contact_phone = input.emergency_contact_phone;
    if (input.medical_history !== undefined) updateData.medical_history = input.medical_history;
    if (input.allergies !== undefined) updateData.allergies = input.allergies;
    if (input.current_medications !== undefined) updateData.current_medications = input.current_medications;
    if (input.insurance_info !== undefined) updateData.insurance_info = input.insurance_info;

    // Update patient record
    const result = await db.update(patientsTable)
      .set(updateData)
      .where(eq(patientsTable.id, input.id))
      .returning()
      .execute();

    const patient = result[0];
    return {
      ...patient,
      date_of_birth: new Date(patient.date_of_birth), // Convert date string back to Date object
      created_at: patient.created_at,
      updated_at: patient.updated_at
    };
  } catch (error) {
    console.error('Patient update failed:', error);
    throw error;
  }
};
