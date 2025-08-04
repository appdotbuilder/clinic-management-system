
import { db } from '../db';
import { consultationsTable } from '../db/schema';
import { type Consultation } from '../schema';
import { eq } from 'drizzle-orm';

export async function getConsultationByAppointment(appointmentId: number): Promise<Consultation | null> {
  try {
    const result = await db.select()
      .from(consultationsTable)
      .where(eq(consultationsTable.appointment_id, appointmentId))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const consultation = result[0];
    return {
      ...consultation,
      // Convert date strings to Date objects for nullable date fields
      follow_up_date: consultation.follow_up_date ? new Date(consultation.follow_up_date) : null
    };
  } catch (error) {
    console.error('Get consultation by appointment failed:', error);
    throw error;
  }
}
