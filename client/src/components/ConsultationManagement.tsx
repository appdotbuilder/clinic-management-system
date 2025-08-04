
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { Consultation, Appointment, CreateConsultationInput, UpdateConsultationInput } from '../../../server/src/schema';

export function ConsultationManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [createFormData, setCreateFormData] = useState<CreateConsultationInput>({
    appointment_id: 0,
    chief_complaint: null,
    symptoms: null,
    diagnosis: null,
    treatment_plan: null,
    prescription: null,
    follow_up_notes: null,
    follow_up_date: null
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateConsultationInput>>({});

  const loadTodaysAppointments = useCallback(async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = await trpc.getAppointmentsByDateRange.query({
        start_date: today,
        end_date: tomorrow
      });
      const eligibleAppointments = result.filter(apt => 
        ['in_progress', 'completed'].includes(apt.status)
      );
      setAppointments(eligibleAppointments);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  }, []);

  useEffect(() => {
    loadTodaysAppointments();
  }, [loadTodaysAppointments]);

  const loadConsultation = async (appointmentId: number) => {
    try {
      const result = await trpc.getConsultationByAppointment.query({ appointmentId });
      setConsultation(result);
    } catch (error) {
      console.error('Failed to load consultation:', error);
      setConsultation(null);
    }
  };

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newConsultation = await trpc.createConsultation.mutate(createFormData);
      setConsultation(newConsultation);
      setCreateFormData({
        appointment_id: 0,
        chief_complaint: null,
        symptoms: null,
        diagnosis: null,
        treatment_plan: null,
        prescription: null,
        follow_up_notes: null,
        follow_up_date: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create consultation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultation) return;
    
    setIsLoading(true);
    try {
      const updatedConsultation = await trpc.updateConsultation.mutate({
        id: consultation.id,
        ...editFormData
      });
      setConsultation(updatedConsultation);
      setIsEditDialogOpen(false);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update consultation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCreateFormData((prev: CreateConsultationInput) => ({ 
      ...prev, 
      appointment_id: appointment.id 
    }));
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (consultation: Consultation) => {
    setEditFormData({
      chief_complaint: consultation.chief_complaint,
      symptoms: consultation.symptoms,
      diagnosis: consultation.diagnosis,
      treatment_plan: consultation.treatment_plan,
      prescription: consultation.prescription,
      follow_up_notes: consultation.follow_up_notes,
      follow_up_date: consultation.follow_up_date
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🩺 Consultation Management
          </CardTitle>
          <CardDescription>
            Manage patient consultations, diagnoses, and treatment plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Select an appointment to view or create consultation notes
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📅 Today's Appointments</CardTitle>
            <CardDescription>Appointments ready for consultation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-2">📅</div>
                <p className="text-gray-500">No eligible appointments today</p>
                <p className="text-sm text-gray-400">Only in-progress or completed appointments show here</p>
              </div>
            ) : (
              appointments.map((appointment: Appointment) => (
                <div
                  key={appointment.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAppointment?.id === appointment.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    loadConsultation(appointment.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Patient #{appointment.patient_id}</p>
                      <p className="text-sm text-gray-600">
                        🕐 {appointment.appointment_date.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {appointment.reason && (
                        <p className="text-sm text-gray-500 mt-1">💬 {appointment.reason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        appointment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🩺 Consultation Details</CardTitle>
            <CardDescription>
              {selectedAppointment 
                ? `Consultation for appointment #${selectedAppointment.id}`
                : 'Select an appointment to view consultation'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedAppointment ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👈</div>
                <p className="text-gray-500">Select an appointment from the left</p>
              </div>
            ) : !consultation ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🩺</div>
                <p className="text-gray-500">No consultation recorded yet</p>
                <Button 
                  className="mt-4"
                  onClick={() => openCreateDialog(selectedAppointment)}
                >
                  ➕ Create Consultation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Consultation Notes</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(consultation)}
                  >
                    ✏️ Edit
                  </Button>
                </div>

                <div className="space-y-3">
                  {consultation.chief_complaint && (
                    <div>
                      <strong className="text-sm text-gray-600">Chief Complaint:</strong>
                      <p className="mt-1">{consultation.chief_complaint}</p>
                    </div>
                  )}

                  {consultation.symptoms && (
                    <div>
                      <strong className="text-sm text-gray-600">Symptoms:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{consultation.symptoms}</p>
                    </div>
                  )}

                  {consultation.diagnosis && (
                    <div>
                      <strong className="text-sm text-gray-600">Diagnosis:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{consultation.diagnosis}</p>
                    </div>
                  )}

                  {consultation.treatment_plan && (
                    <div>
                      <strong className="text-sm text-gray-600">Treatment Plan:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{consultation.treatment_plan}</p>
                    </div>
                  )}

                  {consultation.prescription && (
                    <div>
                      <strong className="text-sm text-gray-600">Prescription:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{consultation.prescription}</p>
                    </div>
                  )}

                  {consultation.follow_up_notes && (
                    <div>
                      <strong className="text-sm text-gray-600">Follow-up Notes:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{consultation.follow_up_notes}</p>
                    </div>
                  )}

                  {consultation.follow_up_date && (
                    <div>
                      <strong className="text-sm text-gray-600">Follow-up Date:</strong>
                      <p className="mt-1">📅 {consultation.follow_up_date.toLocaleDateString()}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Created: {consultation.created_at.toLocaleString()}
                    {consultation.updated_at.getTime() !== consultation.created_at.getTime() && (
                      <span> • Updated: {consultation.updated_at.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Consultation</DialogTitle>
            <DialogDescription>
              Record consultation details for appointment #{selectedAppointment?.id}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateConsultation} className="space-y-4">
            <div>
              <Label htmlFor="chief_complaint">Chief Complaint</Label>
              <Input
                id="chief_complaint"
                value={createFormData.chief_complaint || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateFormData((prev: CreateConsultationInput) => ({ 
                    ...prev, 
                    chief_complaint: e.target.value || null 
                  }))
                }
                placeholder="Main reason for the visit..."
              />
            </div>

            <div>
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                value={createFormData.symptoms || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCreateFormData((prev: CreateConsultationInput) => ({ 
                    ...prev, 
                    symptoms: e.target.value || null 
                  }))
                }
                placeholder="Describe patient's symptoms..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={createFormData.diagnosis || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCreateFormData((prev: CreateConsultationInput) => ({ 
                    ...prev, 
                    diagnosis: e.target.value || null 
                  }))
                }
                placeholder="Medical diagnosis..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="treatment_plan">Treatment Plan</Label>
              <Textarea
                id="treatment_plan"
                value={createFormData.treatment_plan || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCreateFormData((prev: CreateConsultationInput) => ({ 
                    ...prev, 
                    treatment_plan: e.target.value || null 
                  }))
                }
                placeholder="Recommended treatment..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="prescription">Prescription</Label>
              <Textarea
                id="prescription"
                value={createFormData.prescription || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCreateFormData((prev: CreateConsultationInput) => ({ 
                    ...prev, 
                    prescription: e.target.value || null 
                  }))
                }
                placeholder="Medications and dosages..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={createFormData.follow_up_date?.toISOString().split('T')[0] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateConsultationInput) => ({ 
                      ...prev, 
                      follow_up_date: e.target.value ? new Date(e.target.value) : null 
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="follow_up_notes">Follow-up Notes</Label>
                <Input
                  id="follow_up_notes"
                  value={createFormData.follow_up_notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateConsultationInput) => ({ 
                      ...prev, 
                      follow_up_notes: e.target.value || null 
                    }))
                  }
                  placeholder="Follow-up instructions..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Consultation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Consultation</DialogTitle>
            <DialogDescription>
              Update consultation details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateConsultation} className="space-y-4">
            <div>
              <Label htmlFor="edit_diagnosis">Diagnosis</Label>
              <Textarea
                id="edit_diagnosis"
                value={editFormData.diagnosis || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: Partial<UpdateConsultationInput>) => ({ 
                    ...prev, 
                    diagnosis: e.target.value || null 
                  }))
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit_treatment_plan">Treatment Plan</Label>
              <Textarea
                id="edit_treatment_plan"
                value={editFormData.treatment_plan || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: Partial<UpdateConsultationInput>) => ({ 
                    ...prev, 
                    treatment_plan: e.target.value || null 
                  }))
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit_prescription">Prescription</Label>
              <Textarea
                id="edit_prescription"
                value={editFormData.prescription || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: Partial<UpdateConsultationInput>) => ({ 
                    ...prev, 
                    prescription: e.target.value || null 
                  }))
                }
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Consultation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
