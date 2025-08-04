
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { DoctorSchedule, Doctor, CreateDoctorScheduleInput } from '../../../server/src/schema';

export function DoctorScheduleManagement() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [createFormData, setCreateFormData] = useState<CreateDoctorScheduleInput>({
    doctor_id: 0,
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00'
  });

  const loadDoctors = useCallback(async () => {
    try {
      const result = await trpc.getDoctors.query();
      setDoctors(result);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  }, []);

  const loadDoctorSchedule = useCallback(async (doctorId: number) => {
    try {
      const result = await trpc.getDoctorSchedule.query({ doctorId });
      setSchedules(result);
    } catch (error) {
      console.error('Failed to load doctor schedule:', error);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorSchedule(selectedDoctorId);
    } else {
      setSchedules([]);
    }
  }, [selectedDoctorId, loadDoctorSchedule]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newSchedule = await trpc.createDoctorSchedule.mutate(createFormData);
      setSchedules((prev: DoctorSchedule[]) => [...prev, newSchedule]);
      setCreateFormData({
        doctor_id: selectedDoctorId || 0,
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    if (selectedDoctorId) {
      setCreateFormData((prev: CreateDoctorScheduleInput) => ({ 
        ...prev, 
        doctor_id: selectedDoctorId 
      }));
      setIsCreateDialogOpen(true);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  const getDayIcon = (dayOfWeek: number) => {
    const icons = ['☀️', '🌙', '🔥', '🌊', '⚡', '🌟', '🎉'];
    return icons[dayOfWeek] || '📅';
  };

  const getDoctorName = (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. User #${doctor.user_id}` : 'Unknown Doctor';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⏰ Doctor Schedule Management
          </CardTitle>
          <CardDescription>
            Manage doctor working hours and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="doctor_select">Select Doctor</Label>
              <Select 
                value={selectedDoctorId ? selectedDoctorId.toString() : ''} 
                onValueChange={(value: string) => setSelectedDoctorId(parseInt(value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a doctor to manage schedule" />
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
            {selectedDoctorId && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>➕ Add Schedule</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Schedule</DialogTitle>
                    <DialogDescription>
                      Add working hours for {selectedDoctorId && getDoctorName(selectedDoctorId)}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSchedule} className="space-y-4">
                    <div>
                      <Label htmlFor="day_of_week">Day of Week</Label>
                      <Select 
                        value={createFormData.day_of_week.toString()} 
                        onValueChange={(value: string) =>
                          setCreateFormData((prev: CreateDoctorScheduleInput) => ({ 
                            ...prev, 
                            day_of_week: parseInt(value) 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">☀️ Sunday</SelectItem>
                          <SelectItem value="1">🌙 Monday</SelectItem>
                          <SelectItem value="2">🔥 Tuesday</SelectItem>
                          <SelectItem value="3">🌊 Wednesday</SelectItem>
                          <SelectItem value="4">⚡ Thursday</SelectItem>
                          <SelectItem value="5">🌟 Friday</SelectItem>
                          <SelectItem value="6">🎉 Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_time">Start Time</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={createFormData.start_time}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateDoctorScheduleInput) => ({ 
                              ...prev, 
                              start_time: e.target.value 
                            }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={createFormData.end_time}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateDoctorScheduleInput) => ({ 
                              ...prev, 
                              end_time: e.target.value 
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Adding...' : 'Add Schedule'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedDoctorId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📅 Weekly Schedule for {getDoctorName(selectedDoctorId)}
            </CardTitle>
            <CardDescription>
              Working hours and availability throughout the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏰</div>
                  <p className="text-gray-500">No schedule found</p>
                  <p className="text-sm text-gray-400">Add working hours for this doctor</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {schedules
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((schedule: DoctorSchedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getDayIcon(schedule.day_of_week)}
                          </div>
                          <div>
                            <h4 className="font-medium">{getDayName(schedule.day_of_week)}</h4>
                            <p className="text-sm text-gray-600">
                              🕐 {schedule.start_time} - {schedule.end_time}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={schedule.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {schedule.is_available ? '🟢 Available' : '🔴 Unavailable'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            ✏️ Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-2">⏰</div>
              <p className="text-gray-500">Select a doctor to manage their schedule</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
