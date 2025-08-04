
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
import type { Document, Patient, CreateDocumentInput, DocumentType } from '../../../server/src/schema';

export function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [createFormData, setCreateFormData] = useState<CreateDocumentInput>({
    patient_id: 0,
    doctor_id: null,
    consultation_id: null,
    type: 'other' as DocumentType,
    title: '',
    description: null,
    file_path: '',
    file_size: 0,
    mime_type: '',
    uploaded_by: 1 // Default system user
  });

  const loadPatients = useCallback(async () => {
    try {
      const result = await trpc.getPatients.query();
      setPatients(result);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  }, []);

  const loadPatientDocuments = useCallback(async (patientId: number) => {
    try {
      const result = await trpc.getPatientDocuments.query({ patientId });
      setDocuments(result);
    } catch (error) {
      console.error('Failed to load patient documents:', error);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientDocuments(selectedPatientId);
    } else {
      setDocuments([]);
    }
  }, [selectedPatientId, loadPatientDocuments]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newDocument = await trpc.createDocument.mutate(createFormData);
      setDocuments((prev: Document[]) => [newDocument, ...prev]);
      setCreateFormData({
        patient_id: selectedPatientId || 0,
        doctor_id: null,
        consultation_id: null,
        type: 'other' as DocumentType,
        title: '',
        description: null,
        file_path: '',
        file_size: 0,
        mime_type: '',
        uploaded_by: 1
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    if (selectedPatientId) {
      setCreateFormData((prev: CreateDocumentInput) => ({ 
        ...prev, 
        patient_id: selectedPatientId 
      }));
      setIsCreateDialogOpen(true);
    }
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
  };

  const getDocumentTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'lab_result': return '🧪';
      case 'prescription': return '💊';
      case 'medical_report': return '📋';
      case 'imaging': return '🩻';
      case 'referral': return '📤';
      default: return '📄';
    }
  };

  const getDocumentTypeColor = (type: DocumentType) => {
    switch (type) {
      case 'lab_result': return 'bg-blue-100 text-blue-800';
      case 'prescription': return 'bg-green-100 text-green-800';
      case 'medical_report': return 'bg-purple-100 text-purple-800';
      case 'imaging': return 'bg-orange-100 text-orange-800';
      case 'referral': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📄 Document Management
          </CardTitle>
          <CardDescription>
            Manage patient documents and medical records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="patient_select">Select Patient</Label>
              <Select 
                value={selectedPatientId ? selectedPatientId.toString() : ''} 
                onValueChange={(value: string) => setSelectedPatientId(parseInt(value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient to view documents" />
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
            {selectedPatientId && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>📎 Upload Document</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Add a new document for {selectedPatientId && getPatientName(selectedPatientId)}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateDocument} className="space-y-4">
                    <div>
                      <Label htmlFor="type">Document Type</Label>
                      <Select 
                        value={createFormData.type} 
                        onValueChange={(value: DocumentType) =>
                          setCreateFormData((prev: CreateDocumentInput) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lab_result">🧪 Lab Result</SelectItem>
                          <SelectItem value="prescription">💊 Prescription</SelectItem>
                          <SelectItem value="medical_report">📋 Medical Report</SelectItem>
                          <SelectItem value="imaging">🩻 Imaging</SelectItem>
                          <SelectItem value="referral">📤 Referral</SelectItem>
                          <SelectItem value="other">📄 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="title">Document Title</Label>
                      <Input
                        id="title"
                        value={createFormData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateDocumentInput) => ({ 
                            ...prev, 
                            title: e.target.value 
                          }))
                        }
                        placeholder="e.g., Blood Test Results, X-Ray Report..."
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={createFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setCreateFormData((prev: CreateDocumentInput) => ({ 
                            ...prev, 
                            description: e.target.value || null 
                          }))
                        }
                        placeholder="Additional notes about this document..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="file_path">File Path</Label>
                      <Input
                        id="file_path"
                        value={createFormData.file_path}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateDocumentInput) => ({ 
                            ...prev, 
                            file_path: e.target.value 
                          }))
                        }
                        placeholder="/documents/patient_123/report.pdf"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="file_size">File Size (bytes)</Label>
                        <Input
                          id="file_size"
                          type="number"
                          min="0"
                          value={createFormData.file_size || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateDocumentInput) => ({ 
                              ...prev, 
                              file_size: parseInt(e.target.value) || 0 
                            }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="mime_type">MIME Type</Label>
                        <Input
                          id="mime_type"
                          value={createFormData.mime_type}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateDocumentInput) => ({ 
                              ...prev, 
                              mime_type: e.target.value 
                            }))
                          }
                          placeholder="application/pdf, image/jpeg..."
                          required
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Uploading...' : 'Upload Document'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPatientId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📁 Documents for {getPatientName(selectedPatientId)}
            </CardTitle>
            <CardDescription>
              All documents and medical records for this patient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-500">No documents found</p>
                  <p className="text-sm text-gray-400">Upload the first document for this patient</p>
                </div>
              ) : (
                documents.map((document: Document) => (
                  <div key={document.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getDocumentTypeIcon(document.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{document.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getDocumentTypeColor(document.type)}>
                            {document.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            📁 {formatFileSize(document.file_size)}
                          </span>
                          <span className="text-sm text-gray-500">
                            🗓️ {document.created_at.toLocaleDateString()}
                          </span>
                        </div>
                        {document.description && (
                          <p className="text-sm text-gray-600 mt-2">{document.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          📂 {document.file_path}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        👁️ View
                      </Button>
                      <Button variant="outline" size="sm">
                        ⬇️ Download
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-gray-500">Select a patient to view their documents</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
