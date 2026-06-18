import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import PatientRegister from './pages/PatientRegister';
import DoctorRegister from './pages/DoctorRegister';
import AdminRegister from './pages/AdminRegister';
import PatientProfile from './pages/PatientProfile';
import DoctorProfile from './pages/DoctorProfile';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfile from './pages/AdminProfile';
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import QueueStatus from './pages/QueueStatus';
import WalkInRegistration from './pages/WalkInRegistration';
import Home from './pages/Home';
import AdminBlacklist from './pages/AdminBlacklist';
import Bills from './pages/Bills';
import FeeSlip from './pages/FeeSlip';
import PatientDashboard from './pages/PatientDashboard';

// placeholder pages — team will replace these with real ones
function Placeholder({ title }) {
    return (
        <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            minHeight: '100vh', 
            backgroundColor: '#ffffff', 
            color: '#1a1a1a' 
        }}>
            <h2 style={{ color: '#1a1a1a' }}>{title}</h2>
            <p style={{ color: '#666' }}>This page is under construction.</p>
        </div>
    );
}

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />

                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<RoleSelection />} />
                <Route path="/register/patient" element={<PatientRegister />} />
                <Route path="/register/doctor" element={<DoctorRegister />} />
                <Route path="/register/admin" element={<AdminRegister />} />

                {/* Patient routes */}
                <Route path="/patient/dashboard" element={
                    <ProtectedRoute allowedRoles={['Patient']}><PatientDashboard /></ProtectedRoute>
                } />
                <Route path="/patient/book" element={
                    <ProtectedRoute allowedRoles={['Patient']}><BookAppointment /></ProtectedRoute>
                } />
                <Route path="/patient/appointments" element={
                    <ProtectedRoute allowedRoles={['Patient']}><MyAppointments /></ProtectedRoute>
                } />
                <Route path="/patient/queue/:appointmentId" element={
                    <ProtectedRoute allowedRoles={['Patient']}><QueueStatus /></ProtectedRoute>
                } />
              <Route path="/patient/bills" element={
    <ProtectedRoute allowedRoles={['Patient']}><Bills /></ProtectedRoute>
} />
                <Route path="/patient/bills/:billId" element={
                    <ProtectedRoute allowedRoles={['Patient']}><FeeSlip /></ProtectedRoute>
                } />
                <Route path="/patient/profile" element={
                    <ProtectedRoute allowedRoles={['Patient']}><PatientProfile /></ProtectedRoute>
                } />

                {/* Doctor routes */}
                <Route path="/doctor/dashboard" element={
                    <ProtectedRoute allowedRoles={['Doctor']}><DoctorDashboard /></ProtectedRoute>
                } />
                <Route path="/doctor/leaves" element={
                    <ProtectedRoute allowedRoles={['Doctor']}><DoctorDashboard /></ProtectedRoute>
                } />
                <Route path="/doctor/profile" element={
                    <ProtectedRoute allowedRoles={['Doctor']}><DoctorProfile /></ProtectedRoute>
                } />

                {/* Admin routes */}
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Reception']}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="/admin/profile" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Reception']}><AdminProfile /></ProtectedRoute>
                } />
                <Route path="/admin/patients" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Reception']}><Placeholder title="Manage Patients" /></ProtectedRoute>
                } />
                <Route path="/admin/doctors" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Reception']}><Placeholder title="Manage Doctors" /></ProtectedRoute>
                } />
                <Route path="/admin/appointments" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Reception']}><Placeholder title="Manage Appointments" /></ProtectedRoute>
                } />
                <Route path="/admin/leaves" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Reception']}><Placeholder title="Manage Leaves" /></ProtectedRoute>
                } />
                <Route path="/admin/queue" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Reception']}><Placeholder title="Queue Screen" /></ProtectedRoute>
                } />
                <Route path="/admin/walkin" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Reception']}><WalkInRegistration /></ProtectedRoute>
                } />
                <Route path="/admin/blacklist" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Reception']}><AdminBlacklist /></ProtectedRoute>
                } />
            </Routes>
        </>
    );
}

export default App;