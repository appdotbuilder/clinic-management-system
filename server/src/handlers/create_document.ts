
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type CreateDocumentInput, type Document } from '../schema';

export const createDocument = async (input: CreateDocumentInput): Promise<Document> => {
  try {
    // Insert document record
    const result = await db.insert(documentsTable)
      .values({
        patient_id: input.patient_id,
        doctor_id: input.doctor_id,
        consultation_id: input.consultation_id,
        type: input.type,
        title: input.title,
        description: input.description,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        uploaded_by: input.uploaded_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Document creation failed:', error);
    throw error;
  }
};
