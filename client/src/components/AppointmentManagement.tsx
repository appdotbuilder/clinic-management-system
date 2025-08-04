
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { Appointment, Patient, Doctor, CreateAppointmentInput, AppointmentStatus } from '../../../server/src/schema';

export function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [createFormData, setCreateFormData] = useState<CreateAppointmentInput>({
    patient_id: 0,
    doctor_id: 0,
    appointment_date: new Date(),
    duration_minutes: 30,
    reason: null,
    created_by: 1 // Default system user
  });

  const loadAppointments = useCallback(async () => {
    try {
      const result = await trpc.getAppointmentsByDateRange.query({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });
      setAppointments(result);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  }, [dateRange]);

  const loadPatients = useCallback(async () => {
    try {
      const result = await trpc.getPatients.query();
      setPatients(result);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    try {
      const result = await trpc.getDoctors.query();
      setDoctors(result);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    loadPatients();
    loadDoctors();
  }, [loadAppointments, loadPatients, loadDoctors]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newAppointment = await trpc.createAppointment.mutate(createFormData);
      setAppointments((prev: Appointment[]) => [newAppointment, ...prev]);
      setCreateFormData({
        patient_id: 0,
        doctor_id: 0,
        appointment_date: new Date(),
        duration_minutes: 30,
        reason: null,
        created_by: 1
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: number, status: AppointmentStatus, notes?: string) => {
    try {
      const updatedAppointment = await trpc.updateAppointmentStatus.mutate({
        id: appointmentId,
        status,
        notes: notes || null
      });
      setAppointments((prev: Appointment[]) => 
        prev.map((apt: Appointment) => apt.id === appointmentId ? updatedAppointment : apt)
      );
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'confirmed': return '✅';
      case 'in_progress': return '🩺';
      case 'completed': return '✨';
      case 'cancelled': return '❌';
      case 'no_show': return '👻';
      default: return '❓';
    }
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
  };

  const getDoctorName = (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.user_id}` : 'Unknown Doctor';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Appointment Management
          </CardTitle>
          <CardDescription>
            Schedule and manage patient appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange((prev) => ({ ...prev, start_date: new Date(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange((prev) => ({ ...prev, end_date: new Date(e.target.value) }))
                }
              />
            </div>
            <Button onClick={loadAppointments}>🔍 Search</Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>➕ Schedule Appointment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Schedule New Appointment</DialogTitle>
                  <DialogDescription>
                    Create a new appointment for a patient
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                  <div>
                    <Label htmlFor="patient_id">Patient</Label>
                    <Select 
                      value={createFormData.patient_id ? createFormData.patient_id.toString() : ''} 
                      onValueChange={(value: string) =>
                        setCreateFormData((prev: CreateAppointmentInput) => ({ 
                          ...prev, 
                          patient_id: parseInt(value) || 0
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient: Patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            👤 {patient.first_name} {patient.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="doctor_id">Doctor</Label>
                    <Select 
                      value={createFormData.doctor_id ? createFormData.doctor_id.toString() : ''} 
                      onValueChange={(value: string) =>
                        setCreateFormData((prev: CreateAppointmentInput) => ({ 
                          ...prev, 
                          doctor_id: parseInt(value) || 0
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor: Doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            👨‍⚕️ {getDoctorName(doctor.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="appointment_date">Date & Time</Label>
                      <Input
                        id="appointment_date"
                        type="datetime-local"
                        value={createFormData.appointment_date.toISOString().slice(0, 16)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateAppointmentInput) => ({ 
                            ...prev, 
                            appointment_date: new Date(e.target.value) 
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                      <Input
                        id="duration_minutes"
                        type="number"
                        value={createFormData.duration_minutes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateAppointmentInput) => ({ 
                            ...prev, 
                            duration_minutes: parseInt(e.target.value) || 30 
                          }))
                        }
                        min="15"
                        step="15"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason for Visit</Label>
                    <Textarea
                      id="reason"
                      value={createFormData.reason || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateAppointmentInput) => ({ 
                          ...prev, 
                          reason: e.target.value || null 
                        }))
                      }
                      placeholder="Describe the reason for this appointment..."
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Scheduling...' : 'Schedule Appointment'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-500">No appointments found</p>
                <p className="text-sm text-gray-400">Schedule your first appointment to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment: Appointment) => (
            <Card key={appointment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {getStatusIcon(appointment.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {getPatientName(appointment.patient_id)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        with {getDoctorName(appointment.doctor_id)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          📅 {appointment.appointment_date.toLocaleDateString()} 
                          🕐 {appointment.appointment_date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          ⏱️ {appointment.duration_minutes}min
                        </span>
                      </div>
                      {appointment.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          💬 {appointment.reason}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          📋 {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {appointment.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                      >
                        ✅ Confirm
                      </Button>
                    )}
                    {appointment.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(appointment.id, 'in_progress')}
                      >
                        🩺 Start
                      </Button>
                    )}
                    {appointment.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                      >
                        ✨ Complete
                      </Button>
                    )}
                    {['scheduled', 'confirmed'].includes(appointment.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(appointment.id, 'cancelled', 'Cancelled by staff')}
                      >
                        ❌ Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
