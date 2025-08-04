
import { db } from '../db';
import { doctorSchedulesTable } from '../db/schema';
import { type CreateDoctorScheduleInput, type DoctorSchedule } from '../schema';

export const createDoctorSchedule = async (input: CreateDoctorScheduleInput): Promise<DoctorSchedule> => {
  try {
    // Insert doctor schedule record
    const result = await db.insert(doctorSchedulesTable)
      .values({
        doctor_id: input.doctor_id,
        day_of_week: input.day_of_week,
        start_time: input.start_time,
        end_time: input.end_time,
        is_available: true // Default value as specified in schema
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Doctor schedule creation failed:', error);
    throw error;
  }
};
