
import { db } from '../db';
import { consultationsTable } from '../db/schema';
import { type CreateConsultationInput, type Consultation } from '../schema';

export const createConsultation = async (input: CreateConsultationInput): Promise<Consultation> => {
  try {
    // Insert consultation record
    const result = await db.insert(consultationsTable)
      .values({
        appointment_id: input.appointment_id,
        chief_complaint: input.chief_complaint,
        symptoms: input.symptoms,
        diagnosis: input.diagnosis,
        treatment_plan: input.treatment_plan,
        prescription: input.prescription,
        follow_up_notes: input.follow_up_notes,
        follow_up_date: input.follow_up_date ? input.follow_up_date.toISOString().split('T')[0] : null
      })
      .returning()
      .execute();

    const consultation = result[0];
    
    // Convert date string back to Date object for return
    return {
      ...consultation,
      follow_up_date: consultation.follow_up_date ? new Date(consultation.follow_up_date) : null
    };
  } catch (error) {
    console.error('Consultation creation failed:', error);
    throw error;
  }
};
