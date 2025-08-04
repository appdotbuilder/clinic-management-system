
import { z } from 'zod';

// Enums
export const userRoleSchema = z.enum(['super_admin', 'doctor', 'secretary']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const appointmentStatusSchema = z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const documentTypeSchema = z.enum(['lab_result', 'prescription', 'medical_report', 'imaging', 'referral', 'other']);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const genderSchema = z.enum(['male', 'female', 'other']);
export type Gender = z.infer<typeof genderSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleSchema,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

// Specialty schema
export const specialtySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});
export type Specialty = z.infer<typeof specialtySchema>;

// Doctor schema
export const doctorSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  specialty_id: z.number(),
  license_number: z.string(),
  phone: z.string().nullable(),
  consultation_fee: z.number(),
  bio: z.string().nullable(),
  is_available: z.boolean(),
  created_at: z.coerce.date()
});
export type Doctor = z.infer<typeof doctorSchema>;

// Patient schema
export const patientSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  date_of_birth: z.coerce.date(),
  gender: genderSchema,
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  emergency_contact_name: z.string().nullable(),
  emergency_contact_phone: z.string().nullable(),
  medical_history: z.string().nullable(),
  allergies: z.string().nullable(),
  current_medications: z.string().nullable(),
  insurance_info: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Patient = z.infer<typeof patientSchema>;

// Appointment schema
export const appointmentSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  doctor_id: z.number(),
  appointment_date: z.coerce.date(),
  duration_minutes: z.number().int(),
  status: appointmentStatusSchema,
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Appointment = z.infer<typeof appointmentSchema>;

// Consultation schema
export const consultationSchema = z.object({
  id: z.number(),
  appointment_id: z.number(),
  chief_complaint: z.string().nullable(),
  symptoms: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment_plan: z.string().nullable(),
  prescription: z.string().nullable(),
  follow_up_notes: z.string().nullable(),
  follow_up_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Consultation = z.infer<typeof consultationSchema>;

// Document schema
export const documentSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  doctor_id: z.number().nullable(),
  consultation_id: z.number().nullable(),
  type: documentTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  file_path: z.string(),
  file_size: z.number().int(),
  mime_type: z.string(),
  uploaded_by: z.number(),
  created_at: z.coerce.date()
});
export type Document = z.infer<typeof documentSchema>;

// Doctor Schedule schema
export const doctorScheduleSchema = z.object({
  id: z.number(),
  doctor_id: z.number(),
  day_of_week: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  start_time: z.string(), // Time format HH:MM
  end_time: z.string(), // Time format HH:MM
  is_available: z.boolean(),
  created_at: z.coerce.date()
});
export type DoctorSchedule = z.infer<typeof doctorScheduleSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: userRoleSchema
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createSpecialtyInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});
export type CreateSpecialtyInput = z.infer<typeof createSpecialtyInputSchema>;

export const createDoctorInputSchema = z.object({
  user_id: z.number(),
  specialty_id: z.number(),
  license_number: z.string().min(1),
  phone: z.string().nullable(),
  consultation_fee: z.number().positive(),
  bio: z.string().nullable()
});
export type CreateDoctorInput = z.infer<typeof createDoctorInputSchema>;

export const createPatientInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.coerce.date(),
  gender: genderSchema,
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  emergency_contact_name: z.string().nullable(),
  emergency_contact_phone: z.string().nullable(),
  medical_history: z.string().nullable(),
  allergies: z.string().nullable(),
  current_medications: z.string().nullable(),
  insurance_info: z.string().nullable()
});
export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;

export const createAppointmentInputSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number(),
  appointment_date: z.coerce.date(),
  duration_minutes: z.number().int().positive(),
  reason: z.string().nullable(),
  created_by: z.number()
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentInputSchema>;

export const createConsultationInputSchema = z.object({
  appointment_id: z.number(),
  chief_complaint: z.string().nullable(),
  symptoms: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment_plan: z.string().nullable(),
  prescription: z.string().nullable(),
  follow_up_notes: z.string().nullable(),
  follow_up_date: z.coerce.date().nullable()
});
export type CreateConsultationInput = z.infer<typeof createConsultationInputSchema>;

export const createDocumentInputSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number().nullable(),
  consultation_id: z.number().nullable(),
  type: documentTypeSchema,
  title: z.string().min(1),
  description: z.string().nullable(),
  file_path: z.string(),
  file_size: z.number().int().positive(),
  mime_type: z.string(),
  uploaded_by: z.number()
});
export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

export const createDoctorScheduleInputSchema = z.object({
  doctor_id: z.number(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
});
export type CreateDoctorScheduleInput = z.infer<typeof createDoctorScheduleInputSchema>;

// Update schemas
export const updatePatientInputSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  date_of_birth: z.coerce.date().optional(),
  gender: genderSchema.optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  medical_history: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  current_medications: z.string().nullable().optional(),
  insurance_info: z.string().nullable().optional()
});
export type UpdatePatientInput = z.infer<typeof updatePatientInputSchema>;

export const updateAppointmentStatusInputSchema = z.object({
  id: z.number(),
  status: appointmentStatusSchema,
  notes: z.string().nullable().optional()
});
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusInputSchema>;

export const updateConsultationInputSchema = z.object({
  id: z.number(),
  chief_complaint: z.string().nullable().optional(),
  symptoms: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  treatment_plan: z.string().nullable().optional(),
  prescription: z.string().nullable().optional(),
  follow_up_notes: z.string().nullable().optional(),
  follow_up_date: z.coerce.date().nullable().optional()
});
export type UpdateConsultationInput = z.infer<typeof updateConsultationInputSchema>;

// Query schemas
export const getAppointmentsByDateRangeInputSchema = z.object({
  doctor_id: z.number().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});
export type GetAppointmentsByDateRangeInput = z.infer<typeof getAppointmentsByDateRangeInputSchema>;

export const getPatientsBySearchInputSchema = z.object({
  search_term: z.string().min(1),
  limit: z.number().int().positive().optional().default(10)
});
export type GetPatientsBySearchInput = z.infer<typeof getPatientsBySearchInputSchema>;
