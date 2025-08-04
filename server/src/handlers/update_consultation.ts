
import { db } from '../db';
import { consultationsTable } from '../db/schema';
import { type UpdateConsultationInput, type Consultation } from '../schema';
import { eq } from 'drizzle-orm';

export const updateConsultation = async (input: UpdateConsultationInput): Promise<Consultation> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof consultationsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.chief_complaint !== undefined) {
      updateData['chief_complaint'] = input.chief_complaint;
    }
    if (input.symptoms !== undefined) {
      updateData['symptoms'] = input.symptoms;
    }
    if (input.diagnosis !== undefined) {
      updateData['diagnosis'] = input.diagnosis;
    }
    if (input.treatment_plan !== undefined) {
      updateData['treatment_plan'] = input.treatment_plan;
    }
    if (input.prescription !== undefined) {
      updateData['prescription'] = input.prescription;
    }
    if (input.follow_up_notes !== undefined) {
      updateData['follow_up_notes'] = input.follow_up_notes;
    }
    if (input.follow_up_date !== undefined) {
      // Convert Date to string for date column
      updateData['follow_up_date'] = input.follow_up_date ? input.follow_up_date.toISOString().split('T')[0] : null;
    }

    // Update consultation record
    const result = await db.update(consultationsTable)
      .set(updateData)
      .where(eq(consultationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Consultation with id ${input.id} not found`);
    }

    // Convert date string back to Date object before returning
    const consultation = result[0];
    return {
      ...consultation,
      follow_up_date: consultation.follow_up_date ? new Date(consultation.follow_up_date) : null
    };
  } catch (error) {
    console.error('Consultation update failed:', error);
    throw error;
  }
};
