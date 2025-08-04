
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type GetPatientsBySearchInput, type Patient } from '../schema';
import { or, ilike } from 'drizzle-orm';

export async function searchPatients(input: GetPatientsBySearchInput): Promise<Patient[]> {
  try {
    // Build search conditions for first_name, last_name, phone, and email
    const searchTerm = `%${input.search_term}%`;
    
    const results = await db.select()
      .from(patientsTable)
      .where(
        or(
          ilike(patientsTable.first_name, searchTerm),
          ilike(patientsTable.last_name, searchTerm),
          ilike(patientsTable.phone, searchTerm),
          ilike(patientsTable.email, searchTerm)
        )
      )
      .limit(input.limit)
      .execute();

    // Convert date fields and return
    return results.map(patient => ({
      ...patient,
      date_of_birth: new Date(patient.date_of_birth), // Convert date string to Date object
      created_at: patient.created_at,
      updated_at: patient.updated_at
    }));
  } catch (error) {
    console.error('Patient search failed:', error);
    throw error;
  }
}
