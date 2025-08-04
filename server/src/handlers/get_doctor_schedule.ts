
import { db } from '../db';
import { doctorSchedulesTable } from '../db/schema';
import { type DoctorSchedule } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getDoctorSchedule(doctorId: number): Promise<DoctorSchedule[]> {
  try {
    const results = await db.select()
      .from(doctorSchedulesTable)
      .where(eq(doctorSchedulesTable.doctor_id, doctorId))
      .orderBy(asc(doctorSchedulesTable.day_of_week), asc(doctorSchedulesTable.start_time))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch doctor schedule:', error);
    throw error;
  }
}
