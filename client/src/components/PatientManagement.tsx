
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Patient, CreatePatientInput, UpdatePatientInput, Gender } from '../../../server/src/schema';

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [createFormData, setCreateFormData] = useState<CreatePatientInput>({
    first_name: '',
    last_name: '',
    date_of_birth: new Date(),
    gender: 'other' as Gender,
    phone: null,
    email: null,
    address: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    medical_history: null,
    allergies: null,
    current_medications: null,
    insurance_info: null
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdatePatientInput>>({});

  const loadPatients = useCallback(async () => {
    try {
      const result = await trpc.getPatients.query();
      setPatients(result);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  }, []);

  const searchPatients = useCallback(async () => {
    if (!searchTerm.trim()) {
      loadPatients();
      return;
    }
    
    try {
      const result = await trpc.searchPatients.query({
        search_term: searchTerm,
        limit: 50
      });
      setPatients(result);
    } catch (error) {
      console.error('Failed to search patients:', error);
    }
  }, [searchTerm, loadPatients]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchPatients();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchPatients]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newPatient = await trpc.createPatient.mutate(createFormData);
      setPatients((prev: Patient[]) => [newPatient, ...prev]);
      setCreateFormData({
        first_name: '',
        last_name: '',
        date_of_birth: new Date(),
        gender: 'other' as Gender,
        phone: null,
        email: null,
        address: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        medical_history: null,
        allergies: null,
        current_medications: null,
        insurance_info: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    setIsLoading(true);
    try {
      const updatedPatient = await trpc.updatePatient.mutate({
        id: selectedPatient.id,
        ...editFormData
      });
      setPatients((prev: Patient[]) => 
        prev.map((p: Patient) => p.id === selectedPatient.id ? updatedPatient : p)
      );
      setIsEditDialogOpen(false);
      setSelectedPatient(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone,
      medical_history: patient.medical_history,
      allergies: patient.allergies,
      current_medications: patient.current_medications,
      insurance_info: patient.insurance_info
    });
    setIsEditDialogOpen(true);
  };

  const getGenderIcon = (gender: Gender) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '👤';
    }
  };

  const getGenderColor = (gender: Gender) => {
    switch (gender) {
      case 'male': return 'bg-blue-100 text-blue-800';
      case 'female': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👥 Patient Management
          </CardTitle>
          <CardDescription>
            Manage patient demographics and medical information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="🔍 Search patients by name, email, or phone..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>➕ Add New Patient</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Patient</DialogTitle>
                  <DialogDescription>
                    Enter patient information to create a new record
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePatient} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={createFormData.first_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreatePatientInput) => ({ ...prev, first_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={createFormData.last_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreatePatientInput) => ({ ...prev, last_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={createFormData.date_of_birth.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreatePatientInput) => ({ 
                            ...prev, 
                            date_of_birth: new Date(e.target.value) 
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={createFormData.gender || 'other'} 
                        onValueChange={(value: Gender) =>
                          setCreateFormData((prev: CreatePatientInput) => ({ ...prev, gender: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">👨 Male</SelectItem>
                          <SelectItem value="female">👩 Female</SelectItem>
                          <SelectItem value="other">👤 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={createFormData.phone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreatePatientInput) => ({ 
                            ...prev, 
                            phone: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={createFormData.email || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreatePatientInput) => ({ 
                            ...prev, 
                            email: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={createFormData.address || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreatePatientInput) => ({ 
                          ...prev, 
                          address: e.target.value || null 
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                      <Input
                        id="emergency_contact_name"
                        value={createFormData.emergency_contact_name || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreatePatientInput) => ({ 
                            ...prev, 
                            emergency_contact_name: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                      <Input
                        id="emergency_contact_phone"
                        value={createFormData.emergency_contact_phone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreatePatientInput) => ({ 
                            ...prev, 
                            emergency_contact_phone: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Patient'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {patients.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-gray-500">No patients found</p>
                <p className="text-sm text-gray-400">Add your first patient to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          patients.map((patient: Patient) => (
            <Card key={patient.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {getGenderIcon(patient.gender)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Age: {calculateAge(patient.date_of_birth)}</span>
                        <Badge className={getGenderColor(patient.gender)}>
                          {patient.gender}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {patient.phone && <span>📱 {patient.phone}</span>}
                        {patient.email && <span>✉️ {patient.email}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(patient)}
                    >
                      ✏️ Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          👁️ View Details
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Patient Details: {patient.first_name} {patient.last_name}
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Date of Birth:</strong>
                                  <p>{patient.date_of_birth.toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <strong>Age:</strong>
                                  <p>{calculateAge(patient.date_of_birth)} years</p>
                                </div>
                              </div>
                              
                              {patient.address && (
                                <div>
                                  <strong>Address:</strong>
                                  <p>{patient.address}</p>
                                </div>
                              )}
                              
                              {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
                                <div>
                                  <strong>Emergency Contact:</strong>
                                  <p>
                                    {patient.emergency_contact_name}
                                    {patient.emergency_contact_phone && ` - ${patient.emergency_contact_phone}`}
                                  </p>
                                </div>
                              )}
                              
                              {patient.medical_history && (
                                <div>
                                  <strong>Medical History:</strong>
                                  <p className="whitespace-pre-wrap">{patient.medical_history}</p>
                                </div>
                              )}
                              
                              {patient.allergies && (
                                <div>
                                  <strong>Allergies:</strong>
                                  <p className="whitespace-pre-wrap">{patient.allergies}</p>
                                </div>
                              )}
                              
                              {patient.current_medications && (
                                <div>
                                  <strong>Current Medications:</strong>
                                  <p className="whitespace-pre-wrap">{patient.current_medications}</p>
                                </div>
                              )}
                              
                              {patient.insurance_info && (
                                <div>
                                  <strong>Insurance Information:</strong>
                                  <p className="whitespace-pre-wrap">{patient.insurance_info}</p>
                                </div>
                              )}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogAction>Close</AlertDialogAction>
                        </AlertDialogFooter>
                
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update patient information
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <form onSubmit={handleEditPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={editFormData.first_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdatePatientInput>) => ({ 
                        ...prev, 
                        first_name: e.target.value 
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={editFormData.last_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdatePatientInput>) => ({ 
                        ...prev, 
                        last_name: e.target.value 
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_phone">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={editFormData.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdatePatientInput>) => ({ 
                        ...prev, 
                        phone: e.target.value || null 
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdatePatientInput>) => ({ 
                        ...prev, 
                        email: e.target.value || null 
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_medical_history">Medical History</Label>
                <Textarea
                  id="edit_medical_history"
                  value={editFormData.medical_history || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: Partial<UpdatePatientInput>) => ({ 
                      ...prev, 
                      medical_history: e.target.value || null 
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit_allergies">Allergies</Label>
                <Textarea
                  id="edit_allergies"
                  value={editFormData.allergies || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: Partial<UpdatePatientInput>) => ({ 
                      ...prev, 
                      allergies: e.target.value || null 
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit_current_medications">Current Medications</Label>
                <Textarea
                  id="edit_current_medications"
                  value={editFormData.current_medications || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: Partial<UpdatePatientInput>) => ({ 
                      ...prev, 
                      current_medications: e.target.value || null 
                    }))
                  }
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Patient'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
