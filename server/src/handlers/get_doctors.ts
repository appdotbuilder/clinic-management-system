
import { db } from '../db';
import { doctorsTable, usersTable, specialtiesTable } from '../db/schema';
import { type Doctor } from '../schema';
import { eq } from 'drizzle-orm';

export async function getDoctors(): Promise<Doctor[]> {
  try {
    const results = await db.select({
      id: doctorsTable.id,
      user_id: doctorsTable.user_id,
      specialty_id: doctorsTable.specialty_id,
      license_number: doctorsTable.license_number,
      phone: doctorsTable.phone,
      consultation_fee: doctorsTable.consultation_fee,
      bio: doctorsTable.bio,
      is_available: doctorsTable.is_available,
      created_at: doctorsTable.created_at,
    })
    .from(doctorsTable)
    .innerJoin(usersTable, eq(doctorsTable.user_id, usersTable.id))
    .innerJoin(specialtiesTable, eq(doctorsTable.specialty_id, specialtiesTable.id))
    .where(eq(doctorsTable.is_available, true))
    .execute();

    // Convert numeric fields back to numbers
    return results.map(doctor => ({
      ...doctor,
      consultation_fee: parseFloat(doctor.consultation_fee)
    }));
  } catch (error) {
    console.error('Failed to get doctors:', error);
    throw error;
  }
}
