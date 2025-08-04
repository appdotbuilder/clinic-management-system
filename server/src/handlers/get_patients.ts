
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type Patient } from '../schema';

export async function getPatients(): Promise<Patient[]> {
  try {
    const results = await db.select()
      .from(patientsTable)
      .execute();

    // Convert date strings to Date objects for date_of_birth
    return results.map(patient => ({
      ...patient,
      date_of_birth: new Date(patient.date_of_birth),
      created_at: patient.created_at,
      updated_at: patient.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    throw error;
  }
}
