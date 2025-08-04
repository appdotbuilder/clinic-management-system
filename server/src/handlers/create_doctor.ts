
import { db } from '../db';
import { doctorsTable } from '../db/schema';
import { type CreateDoctorInput, type Doctor } from '../schema';

export const createDoctor = async (input: CreateDoctorInput): Promise<Doctor> => {
  try {
    // Insert doctor record
    const result = await db.insert(doctorsTable)
      .values({
        user_id: input.user_id,
        specialty_id: input.specialty_id,
        license_number: input.license_number,
        phone: input.phone,
        consultation_fee: input.consultation_fee.toString(), // Convert number to string for numeric column
        bio: input.bio
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const doctor = result[0];
    return {
      ...doctor,
      consultation_fee: parseFloat(doctor.consultation_fee) // Convert string back to number
    };
  } catch (error) {
    console.error('Doctor creation failed:', error);
    throw error;
  }
};
