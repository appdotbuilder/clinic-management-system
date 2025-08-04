
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { Specialty, CreateSpecialtyInput } from '../../../server/src/schema';

export function SpecialtyManagement() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [createFormData, setCreateFormData] = useState<CreateSpecialtyInput>({
    name: '',
    description: null
  });

  const loadSpecialties = useCallback(async () => {
    try {
      const result = await trpc.getSpecialties.query();
      setSpecialties(result);
    } catch (error) {
      console.error('Failed to load specialties:', error);
    }
  }, []);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  const handleCreateSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newSpecialty = await trpc.createSpecialty.mutate(createFormData);
      setSpecialties((prev: Specialty[]) => [newSpecialty, ...prev]);
      setCreateFormData({
        name: '',
        description: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create specialty:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSpecialtyIcon = (name: string) => {
    const lowerName = name.toLowerCase();
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏥 Specialty Management
        </CardTitle>
        <CardDescription>
          Manage medical specialties in the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Add and manage medical specialties for doctors
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>➕ Add Specialty</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Specialty</DialogTitle>
                <DialogDescription>
                  Add a new medical specialty to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSpecialty} className="space-y-4">
                <div>
                  <Label htmlFor="name">Specialty Name</Label>
                  <Input
                    id="name"
                    value={createFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateSpecialtyInput) => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))
                    }
                    placeholder="e.g., Cardiology, Neurology..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateSpecialtyInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Brief description of this specialty..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Specialty'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {specialties.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🏥</div>
              <p className="text-gray-500">No specialties found</p>
              <p className="text-sm text-gray-400">Add your first specialty to get started</p>
            </div>
          ) : (
            specialties.map((specialty: Specialty) => (
              <div key={specialty.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {getSpecialtyIcon(specialty.name)}
                  </div>
                  <div>
                    <h4 className="font-medium">{specialty.name}</h4>
                    {specialty.description && (
                      <p className="text-sm text-gray-600 mt-1">{specialty.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {specialty.created_at.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className={specialty.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {specialty.is_active ? '🟢 Active' : '🔴 Inactive'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
