
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type Document } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPatientDocuments(patientId: number): Promise<Document[]> {
  try {
    const results = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.patient_id, patientId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch patient documents:', error);
    throw error;
  }
}
