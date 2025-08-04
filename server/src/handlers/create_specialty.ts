
import { db } from '../db';
import { specialtiesTable } from '../db/schema';
import { type CreateSpecialtyInput, type Specialty } from '../schema';

export const createSpecialty = async (input: CreateSpecialtyInput): Promise<Specialty> => {
  try {
    const result = await db.insert(specialtiesTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Specialty creation failed:', error);
    throw error;
  }
};
