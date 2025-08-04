
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput, type Patient } from '../schema';

export const createPatient = async (input: CreatePatientInput): Promise<Patient> => {
  try {
    // Insert patient record - convert Date to string for date column
    const result = await db.insert(patientsTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        date_of_birth: input.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: input.gender,
        phone: input.phone,
        email: input.email,
        address: input.address,
        emergency_contact_name: input.emergency_contact_name,
        emergency_contact_phone: input.emergency_contact_phone,
        medical_history: input.medical_history,
        allergies: input.allergies,
        current_medications: input.current_medications,
        insurance_info: input.insurance_info
      })
      .returning()
      .execute();

    // Convert string date back to Date object for return
    const patient = result[0];
    return {
      ...patient,
      date_of_birth: new Date(patient.date_of_birth)
    };
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};
