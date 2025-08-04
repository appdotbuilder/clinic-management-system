
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Patient } from '../schema';

export const getPatientById = async (id: number): Promise<Patient | null> => {
  try {
    const results = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const patient = results[0];
    return {
      ...patient,
      // Convert date_of_birth string to Date object for consistency with schema
      date_of_birth: new Date(patient.date_of_birth)
    };
  } catch (error) {
    console.error('Patient retrieval failed:', error);
    throw error;
  }
};
