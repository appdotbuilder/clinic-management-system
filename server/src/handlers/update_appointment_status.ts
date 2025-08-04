
import { db } from '../db';
import { appointmentsTable } from '../db/schema';
import { type UpdateAppointmentStatusInput, type Appointment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAppointmentStatus = async (input: UpdateAppointmentStatusInput): Promise<Appointment> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      status: input.status,
      updated_at: new Date()
    };

    // Only include notes if it's provided in the input
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update appointment record
    const result = await db.update(appointmentsTable)
      .set(updateData)
      .where(eq(appointmentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Appointment with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const appointment = result[0];
    return {
      ...appointment,
      // No numeric conversions needed for appointments table
    };
  } catch (error) {
    console.error('Appointment status update failed:', error);
    throw error;
  }
};
