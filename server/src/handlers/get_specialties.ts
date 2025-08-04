
import { db } from '../db';
import { specialtiesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Specialty } from '../schema';

export async function getSpecialties(): Promise<Specialty[]> {
  try {
    const results = await db.select()
      .from(specialtiesTable)
      .where(eq(specialtiesTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Get specialties failed:', error);
    throw error;
  }
}
