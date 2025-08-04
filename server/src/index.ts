
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createSpecialtyInputSchema,
  createDoctorInputSchema,
  createPatientInputSchema,
  updatePatientInputSchema,
  getPatientsBySearchInputSchema,
  createAppointmentInputSchema,
  getAppointmentsByDateRangeInputSchema,
  updateAppointmentStatusInputSchema,
  createConsultationInputSchema,
  updateConsultationInputSchema,
  createDocumentInputSchema,
  createDoctorScheduleInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createSpecialty } from './handlers/create_specialty';
import { getSpecialties } from './handlers/get_specialties';
import { createDoctor } from './handlers/create_doctor';
import { getDoctors } from './handlers/get_doctors';
import { createPatient } from './handlers/create_patient';
import { getPatients } from './handlers/get_patients';
import { getPatientById } from './handlers/get_patient_by_id';
import { updatePatient } from './handlers/update_patient';
import { searchPatients } from './handlers/search_patients';
import { createAppointment } from './handlers/create_appointment';
import { getAppointmentsByDateRange } from './handlers/get_appointments_by_date_range';
import { updateAppointmentStatus } from './handlers/update_appointment_status';
import { createConsultation } from './handlers/create_consultation';
import { getConsultationByAppointment } from './handlers/get_consultation_by_appointment';
import { updateConsultation } from './handlers/update_consultation';
import { createDocument } from './handlers/create_document';
import { getPatientDocuments } from './handlers/get_patient_documents';
import { createDoctorSchedule } from './handlers/create_doctor_schedule';
import { getDoctorSchedule } from './handlers/get_doctor_schedule';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Specialty management
  createSpecialty: publicProcedure
    .input(createSpecialtyInputSchema)
    .mutation(({ input }) => createSpecialty(input)),
  getSpecialties: publicProcedure
    .query(() => getSpecialties()),

  // Doctor management
  createDoctor: publicProcedure
    .input(createDoctorInputSchema)
    .mutation(({ input }) => createDoctor(input)),
  getDoctors: publicProcedure
    .query(() => getDoctors()),

  // Patient management
  createPatient: publicProcedure
    .input(createPatientInputSchema)
    .mutation(({ input }) => createPatient(input)),
  getPatients: publicProcedure
    .query(() => getPatients()),
  getPatientById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPatientById(input.id)),
  updatePatient: publicProcedure
    .input(updatePatientInputSchema)
    .mutation(({ input }) => updatePatient(input)),
  searchPatients: publicProcedure
    .input(getPatientsBySearchInputSchema)
    .query(({ input }) => searchPatients(input)),

  // Appointment management
  createAppointment: publicProcedure
    .input(createAppointmentInputSchema)
    .mutation(({ input }) => createAppointment(input)),
  getAppointmentsByDateRange: publicProcedure
    .input(getAppointmentsByDateRangeInputSchema)
    .query(({ input }) => getAppointmentsByDateRange(input)),
  updateAppointmentStatus: publicProcedure
    .input(updateAppointmentStatusInputSchema)
    .mutation(({ input }) => updateAppointmentStatus(input)),

  // Consultation management
  createConsultation: publicProcedure
    .input(createConsultationInputSchema)
    .mutation(({ input }) => createConsultation(input)),
  getConsultationByAppointment: publicProcedure
    .input(z.object({ appointmentId: z.number() }))
    .query(({ input }) => getConsultationByAppointment(input.appointmentId)),
  updateConsultation: publicProcedure
    .input(updateConsultationInputSchema)
    .mutation(({ input }) => updateConsultation(input)),

  // Document management
  createDocument: publicProcedure
    .input(createDocumentInputSchema)
    .mutation(({ input }) => createDocument(input)),
  getPatientDocuments: publicProcedure
    .input(z.object({ patientId: z.number() }))
    .query(({ input }) => getPatientDocuments(input.patientId)),

  // Doctor schedule management
  createDoctorSchedule: publicProcedure
    .input(createDoctorScheduleInputSchema)
    .mutation(({ input }) => createDoctorSchedule(input)),
  getDoctorSchedule: publicProcedure
    .input(z.object({ doctorId: z.number() }))
    .query(({ input }) => getDoctorSchedule(input.doctorId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Medical Management System TRPC server listening at port: ${port}`);
}

start();
