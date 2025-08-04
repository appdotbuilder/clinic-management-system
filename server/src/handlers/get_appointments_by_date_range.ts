
import { db } from '../db';
import { appointmentsTable } from '../db/schema';
import { type GetAppointmentsByDateRangeInput, type Appointment } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export async function getAppointmentsByDateRange(input: GetAppointmentsByDateRangeInput): Promise<Appointment[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Add date range filter
    conditions.push(gte(appointmentsTable.appointment_date, input.start_date));
    conditions.push(lte(appointmentsTable.appointment_date, input.end_date));

    // Add doctor filter if provided
    if (input.doctor_id !== undefined) {
      conditions.push(eq(appointmentsTable.doctor_id, input.doctor_id));
    }

    // Build and execute query
    const results = await db
      .select()
      .from(appointmentsTable)
      .where(and(...conditions))
      .orderBy(appointmentsTable.appointment_date)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get appointments by date range:', error);
    throw error;
  }
}
