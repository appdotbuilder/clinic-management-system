
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
import type { Doctor, Specialty, CreateDoctorInput } from '../../../server/src/schema';

export function DoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [createFormData, setCreateFormData] = useState<CreateDoctorInput>({
    user_id: 0,
    specialty_id: 0,
    license_number: '',
    phone: null,
    consultation_fee: 0,
    bio: null
  });

  const loadDoctors = useCallback(async () => {
    try {
      const result = await trpc.getDoctors.query();
      setDoctors(result);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  }, []);

  const loadSpecialties = useCallback(async () => {
    try {
      const result = await trpc.getSpecialties.query();
      setSpecialties(result);
    } catch (error) {
      console.error('Failed to load specialties:', error);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
    loadSpecialties();
  }, [loadDoctors, loadSpecialties]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newDoctor = await trpc.createDoctor.mutate(createFormData);
      setDoctors((prev: Doctor[]) => [newDoctor, ...prev]);
      setCreateFormData({
        user_id: 0,
        specialty_id: 0,
        license_number: '',
        phone: null,
        consultation_fee: 0,
        bio: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create doctor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSpecialtyName = (specialtyId: number) => {
    const specialty = specialties.find(s => s.id === specialtyId);
    return specialty ? specialty.name : 'Unknown Specialty';
  };

  const getSpecialtyIcon = (specialtyId: number) => {
    const specialty = specialties.find(s => s.id === specialtyId);
    if (!specialty) return '🏥';
    
    const lowerName = specialty.name.toLowerCase();
    if (lowerName.includes('cardio')) return '❤️';
    if (lowerName.includes('neuro')) return '🧠';
    if (lowerName.includes('ortho')) return '🦴';
    if (lowerName.includes('pediatr')) return '👶';
    if (lowerName.includes('gynec') || lowerName.includes('obstet')) return '👩‍⚕️';
    if (lowerName.includes('dermato')) return '🌟';
    if (lowerName.includes('ophthal')) return '👁️';
    if (lowerName.includes('ent') || lowerName.includes('otol')) return '👂';
    if (lowerName.includes('psychiat')) return '🧘';
    if (lowerName.includes('general')) return '🩺';
    return '🏥';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👨‍⚕️ Doctor Management
          </CardTitle>
          <CardDescription>
            Manage doctors and their specialties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Add and manage doctors in the system
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>➕ Add Doctor</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Doctor</DialogTitle>
                  <DialogDescription>
                    Add a new doctor to the system
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDoctor} className="space-y-4">
                  <div>
                    <Label htmlFor="user_id">User ID</Label>
                    <Input
                      id="user_id"
                      type="number"
                      value={createFormData.user_id || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateDoctorInput) => ({ 
                          ...prev, 
                          user_id: parseInt(e.target.value) || 0 
                        }))
                      }
                      placeholder="Enter user ID..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialty_id">Specialty</Label>
                    <Select 
                      value={createFormData.specialty_id ? createFormData.specialty_id.toString() : ''} 
                      onValueChange={(value: string) =>
                        setCreateFormData((prev: CreateDoctorInput) => ({ 
                          ...prev, 
                          specialty_id: parseInt(value) || 0
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty: Specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id.toString()}>
                            🏥 {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={createFormData.license_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateDoctorInput) => ({ 
                          ...prev, 
                          license_number: e.target.value 
                        }))
                      }
                      placeholder="Medical license number..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="consultation_fee">Consultation Fee</Label>
                      <Input
                        id="consultation_fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={createFormData.consultation_fee || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateDoctorInput) => ({ 
                            ...prev, 
                            consultation_fee: parseFloat(e.target.value) || 0 
                          }))
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={createFormData.phone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateDoctorInput) => ({ 
                            ...prev, 
                            phone: e.target.value || null 
                          }))
                        }
                        placeholder="Phone number..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Biography</Label>
                    <Textarea
                      id="bio"
                      value={createFormData.bio || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateDoctorInput) => ({ 
                          ...prev, 
                          bio: e.target.value || null 
                        }))
                      }
                      placeholder="Doctor's biography and qualifications..."
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Doctor'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {doctors.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl mb-2">👨‍⚕️</div>
                <p className="text-gray-500">No doctors found</p>
                <p className="text-sm text-gray-400">Add your first doctor to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          doctors.map((doctor: Doctor) => (
            <Card key={doctor.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {getSpecialtyIcon(doctor.specialty_id)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Dr. User #{doctor.user_id}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Badge className="bg-blue-100 text-blue-800">
                          {getSpecialtyName(doctor.specialty_id)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>🏥 License: {doctor.license_number}</span>
                        {doctor.phone && <span>📱 {doctor.phone}</span>}
                        <span>💰 ${doctor.consultation_fee.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={doctor.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {doctor.is_available ? '🟢 Available' : '🔴 Unavailable'}
                    </Badge>
                  </div>
                </div>
                
                {doctor.bio && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{doctor.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
