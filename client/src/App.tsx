
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { PatientManagement } from '@/components/PatientManagement';
import { AppointmentManagement } from '@/components/AppointmentManagement';
import { ConsultationManagement } from '@/components/ConsultationManagement';
import { UserManagement } from '@/components/UserManagement';
import { SpecialtyManagement } from '@/components/SpecialtyManagement';
import { DoctorManagement } from '@/components/DoctorManagement';
import { DocumentManagement } from '@/components/DocumentManagement';
import { DoctorScheduleManagement } from '@/components/DoctorScheduleManagement';
import type { User, UserRole } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalPatients: 0,
    todaysAppointments: 0,
    totalDoctors: 0,
    totalSpecialties: 0
  });

  // Initialize with system admin user for demonstration
  useEffect(() => {
    setCurrentUser({
      id: 1,
      email: 'admin@clinic.com',
      password_hash: '',
      first_name: 'System',
      last_name: 'Administrator',
      role: 'super_admin' as UserRole,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [patients, doctors, specialties, appointments] = await Promise.all([
        trpc.getPatients.query(),
        trpc.getDoctors.query(),
        trpc.getSpecialties.query(),
        trpc.getAppointmentsByDateRange.query({
          start_date: new Date(),
          end_date: new Date()
        })
      ]);

      setStats({
        totalPatients: patients.length,
        todaysAppointments: appointments.length,
        totalDoctors: doctors.length,
        totalSpecialties: specialties.length
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser, loadStats]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🏥 MediClinic System</CardTitle>
            <CardDescription>Loading your session...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const canAccess = (requiredRole: UserRole) => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'doctor' && (requiredRole === 'doctor' || requiredRole === 'secretary')) return true;
    if (currentUser.role === 'secretary' && requiredRole === 'secretary') return true;
    return false;
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'secretary': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🏥</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MediClinic System</h1>
                <p className="text-sm text-gray-500">Comprehensive Healthcare Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getRoleColor(currentUser.role)}>
                {currentUser.role.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.first_name} {currentUser.last_name}
                </p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="patients">👥 Patients</TabsTrigger>
            <TabsTrigger value="appointments">📅 Appointments</TabsTrigger>
            <TabsTrigger value="consultations">🩺 Consultations</TabsTrigger>
            <TabsTrigger value="documents">📄 Documents</TabsTrigger>
            {canAccess('super_admin') && (
              <TabsTrigger value="doctors">👨‍⚕️ Doctors</TabsTrigger>
            )}
            {canAccess('super_admin') && (
              <TabsTrigger value="schedules">⏰ Schedules</TabsTrigger>
            )}
            {canAccess('super_admin') && (
              <TabsTrigger value="admin">⚙️ Admin</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <div className="text-2xl">👥</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPatients}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered in system
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <div className="text-2xl">📅</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todaysAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled for today
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
                  <div className="text-2xl">👨‍⚕️</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                  <p className="text-xs text-muted-foreground">
                    Available practitioners
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Specialties</CardTitle>
                  <div className="text-2xl">🏥</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSpecialties}</div>
                  <p className="text-xs text-muted-foreground">
                    Medical specialties
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Quick Actions</CardTitle>
                  <CardDescription>Common tasks for your role</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={() => setActiveTab('patients')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    👥 Manage Patients
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('appointments')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    📅 Schedule Appointment
                  </Button>
                  {canAccess('doctor') && (
                    <Button 
                      onClick={() => setActiveTab('consultations')} 
                      className="w-full justify-start"
                      variant="outline"
                    >
                      🩺 New Consultation
                    </Button>
                  )}
                  {canAccess('super_admin') && (
                    <Button 
                      onClick={() => setActiveTab('admin')} 
                      className="w-full justify-start"
                      variant="outline"
                    >
                      ⚙️ System Administration
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ℹ️ System Information</CardTitle>
                  <CardDescription>Current system status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Status</span>
                    <Badge className="bg-green-100 text-green-800">🟢 Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Your Access Level</span>
                    <Badge className={getRoleColor(currentUser.role)}>
                      {currentUser.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Login</span>
                    <span className="text-sm text-gray-500">Just now</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients">
            <PatientManagement />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentManagement />
          </TabsContent>

          <TabsContent value="consultations">
            <ConsultationManagement />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManagement />
          </TabsContent>

          {canAccess('super_admin') && (
            <TabsContent value="doctors">
              <DoctorManagement />
            </TabsContent>
          )}

          {canAccess('super_admin') && (
            <TabsContent value="schedules">
              <DoctorScheduleManagement />
            </TabsContent>
          )}

          {canAccess('super_admin') && (
            <TabsContent value="admin">
              <div className="grid gap-6 md:grid-cols-2">
                <UserManagement />
                <SpecialtyManagement />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

export default App;
