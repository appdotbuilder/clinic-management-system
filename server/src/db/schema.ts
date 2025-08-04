
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum, time, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'doctor', 'secretary']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
export const documentTypeEnum = pgEnum('document_type', ['lab_result', 'prescription', 'medical_report', 'imaging', 'referral', 'other']);
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Specialties table
export const specialtiesTable = pgTable('specialties', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Doctors table
export const doctorsTable = pgTable('doctors', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  specialty_id: integer('specialty_id').notNull().references(() => specialtiesTable.id),
  license_number: text('license_number').notNull().unique(),
  phone: text('phone'),
  consultation_fee: numeric('consultation_fee', { precision: 10, scale: 2 }).notNull(),
  bio: text('bio'),
  is_available: boolean('is_available').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Patients table
export const patientsTable = pgTable('patients', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  date_of_birth: date('date_of_birth').notNull(),
  gender: genderEnum('gender').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  emergency_contact_name: text('emergency_contact_name'),
  emergency_contact_phone: text('emergency_contact_phone'),
  medical_history: text('medical_history'),
  allergies: text('allergies'),
  current_medications: text('current_medications'),
  insurance_info: text('insurance_info'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Appointments table
export const appointmentsTable = pgTable('appointments', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').notNull().references(() => patientsTable.id),
  doctor_id: integer('doctor_id').notNull().references(() => doctorsTable.id),
  appointment_date: timestamp('appointment_date').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  status: appointmentStatusEnum('status').notNull().default('scheduled'),
  reason: text('reason'),
  notes: text('notes'),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Consultations table
export const consultationsTable = pgTable('consultations', {
  id: serial('id').primaryKey(),
  appointment_id: integer('appointment_id').notNull().references(() => appointmentsTable.id),
  chief_complaint: text('chief_complaint'),
  symptoms: text('symptoms'),
  diagnosis: text('diagnosis'),
  treatment_plan: text('treatment_plan'),
  prescription: text('prescription'),
  follow_up_notes: text('follow_up_notes'),
  follow_up_date: date('follow_up_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Documents table
export const documentsTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').notNull().references(() => patientsTable.id),
  doctor_id: integer('doctor_id').references(() => doctorsTable.id),
  consultation_id: integer('consultation_id').references(() => consultationsTable.id),
  type: documentTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  uploaded_by: integer('uploaded_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Doctor schedules table
export const doctorSchedulesTable = pgTable('doctor_schedules', {
  id: serial('id').primaryKey(),
  doctor_id: integer('doctor_id').notNull().references(() => doctorsTable.id),
  day_of_week: integer('day_of_week').notNull(), // 0 = Sunday, 6 = Saturday
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  is_available: boolean('is_available').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  doctor: one(doctorsTable, {
    fields: [usersTable.id],
    references: [doctorsTable.user_id],
  }),
  createdAppointments: many(appointmentsTable),
  uploadedDocuments: many(documentsTable),
}));

export const specialtiesRelations = relations(specialtiesTable, ({ many }) => ({
  doctors: many(doctorsTable),
}));

export const doctorsRelations = relations(doctorsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [doctorsTable.user_id],
    references: [usersTable.id],
  }),
  specialty: one(specialtiesTable, {
    fields: [doctorsTable.specialty_id],
    references: [specialtiesTable.id],
  }),
  appointments: many(appointmentsTable),
  documents: many(documentsTable),
  schedules: many(doctorSchedulesTable),
}));

export const patientsRelations = relations(patientsTable, ({ many }) => ({
  appointments: many(appointmentsTable),
  documents: many(documentsTable),
}));

export const appointmentsRelations = relations(appointmentsTable, ({ one, many }) => ({
  patient: one(patientsTable, {
    fields: [appointmentsTable.patient_id],
    references: [patientsTable.id],
  }),
  doctor: one(doctorsTable, {
    fields: [appointmentsTable.doctor_id],
    references: [doctorsTable.id],
  }),
  createdBy: one(usersTable, {
    fields: [appointmentsTable.created_by],
    references: [usersTable.id],
  }),
  consultation: one(consultationsTable),
}));

export const consultationsRelations = relations(consultationsTable, ({ one, many }) => ({
  appointment: one(appointmentsTable, {
    fields: [consultationsTable.appointment_id],
    references: [appointmentsTable.id],
  }),
  documents: many(documentsTable),
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  patient: one(patientsTable, {
    fields: [documentsTable.patient_id],
    references: [patientsTable.id],
  }),
  doctor: one(doctorsTable, {
    fields: [documentsTable.doctor_id],
    references: [doctorsTable.id],
  }),
  consultation: one(consultationsTable, {
    fields: [documentsTable.consultation_id],
    references: [consultationsTable.id],
  }),
  uploadedBy: one(usersTable, {
    fields: [documentsTable.uploaded_by],
    references: [usersTable.id],
  }),
}));

export const doctorSchedulesRelations = relations(doctorSchedulesTable, ({ one }) => ({
  doctor: one(doctorsTable, {
    fields: [doctorSchedulesTable.doctor_id],
    references: [doctorsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  specialties: specialtiesTable,
  doctors: doctorsTable,
  patients: patientsTable,
  appointments: appointmentsTable,
  consultations: consultationsTable,
  documents: documentsTable,
  doctorSchedules: doctorSchedulesTable,
};

// TypeScript types for tables
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Specialty = typeof specialtiesTable.$inferSelect;
export type NewSpecialty = typeof specialtiesTable.$inferInsert;
export type Doctor = typeof doctorsTable.$inferSelect;
export type NewDoctor = typeof doctorsTable.$inferInsert;
export type Patient = typeof patientsTable.$inferSelect;
export type NewPatient = typeof patientsTable.$inferInsert;
export type Appointment = typeof appointmentsTable.$inferSelect;
export type NewAppointment = typeof appointmentsTable.$inferInsert;
export type Consultation = typeof consultationsTable.$inferSelect;
export type NewConsultation = typeof consultationsTable.$inferInsert;
export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;
export type DoctorSchedule = typeof doctorSchedulesTable.$inferSelect;
export type NewDoctorSchedule = typeof doctorSchedulesTable.$inferInsert;
