import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
    Shield,
    Users,
    Stethoscope,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    BarChart3,
    LayoutDashboard,
    UserCog,
    Settings,
    FileText,
    Ban,
    RotateCcw,
    Phone,
    Mail,
    X,
    Check,
    RefreshCw,
    Zap
} from 'lucide-react';
import './AdminDashboard.css';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedDoctorForQueue, setSelectedDoctorForQueue] = useState('');
    const [doctorQueue, setDoctorQueue] = useState([]);
    const [queueLoading, setQueueLoading] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchDoctors();
        fetchPatients();
        fetchAppointments();
        fetchLeaves();
    }, []);

    useEffect(() => {
        let interval;
        if (activeTab === 'live-queue' && selectedDoctorForQueue) {
            fetchDoctorQueue(selectedDoctorForQueue);
            interval = setInterval(() => fetchDoctorQueue(selectedDoctorForQueue), 10000); // refresh every 10s
        }
        return () => clearInterval(interval);
    }, [activeTab, selectedDoctorForQueue]);

    const fetchDoctorQueue = async (doctorId) => {
        try {
            setQueueLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const response = await API.get(`/appointments/queue/${doctorId}/${today}`);
            setDoctorQueue(response.data);
        } catch (err) {
            console.error('Failed to load queue', err);
        } finally {
            setQueueLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await API.get('/admin/stats');
            setStats(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load stats.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await API.get('/admin/doctors');
            setDoctors(response.data);
        } catch (err) {
            console.error('Failed to load doctors', err);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await API.get('/admin/patients');
            setPatients(response.data);
        } catch (err) {
            console.error('Failed to load patients', err);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await API.get('/admin/appointments');
            setAppointments(response.data);
        } catch (err) {
            console.error('Failed to load appointments', err);
        }
    };

    const fetchLeaves = async () => {
        try {
            const response = await API.get('/admin/leaves');
            setLeaves(response.data);
        } catch (err) {
            console.error('Failed to load leaves', err);
        }
    };

    const handleToggleBlacklist = async (patientId, currentStatus) => {
        try {
            setActionLoading(true);
            await API.put(`/admin/patients/${patientId}/blacklist`, { blacklist: !currentStatus });
            fetchPatients();
            fetchStats();
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update blacklist status.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleAvailability = async (doctorId, currentStatus) => {
        try {
            setActionLoading(true);
            await API.put(`/admin/doctors/${doctorId}/availability`, { isAvailable: !currentStatus });
            fetchDoctors();
            fetchStats();
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update availability.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveAction = async (leaveId, status) => {
        try {
            setActionLoading(true);
            await API.put(`/admin/leaves/${leaveId}`, { status });
            fetchLeaves();
            fetchStats();
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update leave status.');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusBadge = (status) => {
        const config = {
            Scheduled: { color: 'blue', label: 'Scheduled' },
            Completed: { color: 'green', label: 'Completed' },
            Missed: { color: 'red', label: 'Missed' },
            'Walk-In': { color: 'orange', label: 'Walk-In' },
            Cancelled: { color: 'gray', label: 'Cancelled' },
            Pending: { color: 'yellow', label: 'Pending' },
            Approved: { color: 'green', label: 'Approved' },
            Rejected: { color: 'red', label: 'Rejected' }
        };
        const c = config[status] || { color: 'gray', label: status };
        return <span className={`status-badge status-${c.color}`}>{c.label}</span>;
    };

    const pendingLeavesCount = leaves.filter(l => l.Status === 'Pending').length;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
        { id: 'doctors', label: 'Doctors', icon: <Stethoscope size={18} /> },
        { id: 'patients', label: 'Patients', icon: <Users size={18} /> },
        { id: 'appointments', label: 'Appointments', icon: <Calendar size={18} /> },
        { id: 'leaves', label: 'Leave Requests', icon: <FileText size={18} /> },
        { id: 'live-queue', label: 'Live Queue', icon: <BarChart3 size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
    ];

    if (loading && !stats) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-box">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-box">
                <div className="dashboard-header">
                    <div>
                        <h1>
                            <Shield size={32} style={{ display: 'inline', marginRight: '10px' }} />
                            Admin Dashboard
                        </h1>
                        <p>Manage doctors, patients, appointments and system settings</p>
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                <div className="admin-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.id === 'leaves' && pendingLeavesCount > 0 && (
                                <span className="tab-badge">{pendingLeavesCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="tab-content">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <Users size={24} />
                                <span className="stat-value">{stats?.totalPatients || 0}</span>
                                <span className="stat-label">Total Patients</span>
                            </div>
                            <div className="stat-card">
                                <Stethoscope size={24} />
                                <span className="stat-value">{stats?.totalDoctors || 0}</span>
                                <span className="stat-label">Total Doctors</span>
                            </div>
                            <div className="stat-card">
                                <Calendar size={24} />
                                <span className="stat-value">{stats?.totalAppointments || 0}</span>
                                <span className="stat-label">Total Appointments</span>
                            </div>
                            <div className="stat-card">
                                <Clock size={24} />
                                <span className="stat-value">{stats?.todayAppointments || 0}</span>
                                <span className="stat-label">Today&apos;s Appointments</span>
                            </div>
                            <div className="stat-card alert">
                                <FileText size={24} />
                                <span className="stat-value">{stats?.pendingLeaves || 0}</span>
                                <span className="stat-label">Pending Leaves</span>
                            </div>
                            <div className="stat-card danger">
                                <Ban size={24} />
                                <span className="stat-value">{stats?.blacklistedPatients || 0}</span>
                                <span className="stat-label">Blacklisted Patients</span>
                            </div>
                        </div>

                        <div className="overview-sections">
                            <div className="overview-section">
                                <h3><Stethoscope size={20} style={{ marginRight: '8px' }} />Doctors Overview</h3>
                                <div className="overview-list">
                                    {doctors.slice(0, 5).map(doc => (
                                        <div key={doc.DoctorID} className="overview-item">
                                            <span className="overview-name">{doc.FullName}</span>
                                            <span className="overview-meta">{doc.Specialization}</span>
                                            <span className={`overview-status ${doc.IsAvailable ? 'active' : 'inactive'}`}>
                                                {doc.IsAvailable ? 'Available' : 'Unavailable'}
                                            </span>
                                        </div>
                                    ))}
                                    {doctors.length === 0 && <p className="no-data">No doctors found.</p>}
                                </div>
                            </div>

                            <div className="overview-section">
                                <h3><FileText size={20} style={{ marginRight: '8px' }} />Recent Leave Requests</h3>
                                <div className="overview-list">
                                    {leaves.slice(0, 5).map(leave => (
                                        <div key={leave.LeaveID} className="overview-item">
                                            <span className="overview-name">{leave.DoctorName}</span>
                                            <span className="overview-meta">{formatDate(leave.StartDate)} - {formatDate(leave.EndDate)}</span>
                                            {getStatusBadge(leave.Status)}
                                        </div>
                                    ))}
                                    {leaves.length === 0 && <p className="no-data">No leave requests found.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* DOCTORS TAB */}
                {activeTab === 'doctors' && (
                    <div className="tab-content">
                        <h2 className="section-title">Manage Doctors</h2>
                        {doctors.length === 0 ? (
                            <div className="empty-state">
                                <Stethoscope size={60} />
                                <h3>No Doctors Found</h3>
                            </div>
                        ) : (
                            <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Specialization</th>
                                            <th>Fee</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {doctors.map(doc => (
                                            <tr key={doc.DoctorID}>
                                                <td><strong>{doc.FullName}</strong></td>
                                                <td>{doc.Email}</td>
                                                <td>{doc.Specialization}</td>
                                                <td>PKR {doc.ConsultationFee}</td>
                                                <td>
                                                    <span className={`availability-badge ${doc.IsAvailable ? 'available' : 'unavailable'}`}>
                                                        {doc.IsAvailable ? 'Available' : 'Unavailable'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className={`btn-toggle ${doc.IsAvailable ? 'btn-disable' : 'btn-enable'}`}
                                                        onClick={() => handleToggleAvailability(doc.DoctorID, doc.IsAvailable)}
                                                        disabled={actionLoading}
                                                    >
                                                        {doc.IsAvailable ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                        {doc.IsAvailable ? 'Disable' : 'Enable'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* PATIENTS TAB */}
                {activeTab === 'patients' && (
                    <div className="tab-content">
                        <h2 className="section-title">Manage Patients</h2>
                        {patients.length === 0 ? (
                            <div className="empty-state">
                                <Users size={60} />
                                <h3>No Patients Found</h3>
                            </div>
                        ) : (
                            <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Contact</th>
                                            <th>CNIC</th>
                                            <th>Visits</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map(patient => (
                                            <tr key={patient.PatientID} className={patient.IsBlacklisted ? 'blacklisted-row' : ''}>
                                                <td><strong>{patient.FullName}</strong></td>
                                                <td>{patient.Email}</td>
                                                <td>{patient.ContactNumber}</td>
                                                <td>{patient.CNIC}</td>
                                                <td>{patient.TotalVisits}</td>
                                                <td>
                                                    {patient.IsBlacklisted ? (
                                                        <span className="status-badge status-red">Blacklisted</span>
                                                    ) : (
                                                        <span className="status-badge status-green">Active</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className={`btn-toggle ${patient.IsBlacklisted ? 'btn-enable' : 'btn-disable'}`}
                                                        onClick={() => handleToggleBlacklist(patient.PatientID, patient.IsBlacklisted)}
                                                        disabled={actionLoading}
                                                    >
                                                        {patient.IsBlacklisted ? <RotateCcw size={16} /> : <Ban size={16} />}
                                                        {patient.IsBlacklisted ? 'Unblacklist' : 'Blacklist'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* APPOINTMENTS TAB */}
                {activeTab === 'appointments' && (
                    <div className="tab-content">
                        <h2 className="section-title">All Appointments</h2>
                        {appointments.length === 0 ? (
                            <div className="empty-state">
                                <Calendar size={60} />
                                <h3>No Appointments Found</h3>
                            </div>
                        ) : (
                            <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Token</th>
                                            <th>Patient</th>
                                            <th>Doctor</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map(appt => (
                                            <tr key={appt.AppointmentID}>
                                                <td><span className="token-pill">#{appt.TokenNumber}</span></td>
                                                <td>{appt.PatientName}</td>
                                                <td>{appt.DoctorName} <small>({appt.Specialization})</small></td>
                                                <td>{formatDate(appt.AppointmentDate)}</td>
                                                <td>{formatTime(appt.TimeSlot)}</td>
                                                <td>{getStatusBadge(appt.Status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* LEAVES TAB */}
                {activeTab === 'leaves' && (
                    <div className="tab-content">
                        <h2 className="section-title">Leave Requests</h2>
                        {leaves.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={60} />
                                <h3>No Leave Requests Found</h3>
                            </div>
                        ) : (
                            <div className="leaves-list">
                                {leaves.map(leave => (
                                    <div key={leave.LeaveID} className="leave-card">
                                        <div className="leave-header">
                                            <div>
                                                <h4>{leave.DoctorName}</h4>
                                                <p>{leave.Specialization}</p>
                                            </div>
                                            {getStatusBadge(leave.Status)}
                                        </div>
                                        <div className="leave-details">
                                            <div className="leave-detail">
                                                <Calendar size={16} />
                                                <span><strong>From:</strong> {formatDate(leave.StartDate)}</span>
                                            </div>
                                            <div className="leave-detail">
                                                <Calendar size={16} />
                                                <span><strong>To:</strong> {formatDate(leave.EndDate)}</span>
                                            </div>
                                            <div className="leave-detail">
                                                <FileText size={16} />
                                                <span><strong>Reason:</strong> {leave.Reason || 'N/A'}</span>
                                            </div>
                                        </div>
                                        {leave.Status === 'Pending' && (
                                            <div className="leave-actions">
                                                <button
                                                    className="btn-approve"
                                                    onClick={() => handleLeaveAction(leave.LeaveID, 'Approved')}
                                                    disabled={actionLoading}
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button
                                                    className="btn-reject"
                                                    onClick={() => handleLeaveAction(leave.LeaveID, 'Rejected')}
                                                    disabled={actionLoading}
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* LIVE QUEUE TAB */}
                {activeTab === 'live-queue' && (
                    <div className="tab-content">
                        <h2 className="section-title">Real-Time Patient Queue</h2>
                        <div className="queue-filter" style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <label>Select Doctor:</label>
                            <select 
                                value={selectedDoctorForQueue} 
                                onChange={(e) => setSelectedDoctorForQueue(e.target.value)}
                                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '200px' }}
                            >
                                <option value="">-- Choose a Doctor --</option>
                                {doctors.map(doc => (
                                    <option key={doc.DoctorID} value={doc.DoctorID}>
                                        {doc.FullName} ({doc.Specialization})
                                    </option>
                                ))}
                            </select>
                            {selectedDoctorForQueue && (
                                <button className="btn-refresh" onClick={() => fetchDoctorQueue(selectedDoctorForQueue)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <RefreshCw size={16} className={queueLoading ? 'spin' : ''} /> Refresh
                                </button>
                            )}
                        </div>

                        {!selectedDoctorForQueue ? (
                            <div className="empty-state">
                                <BarChart3 size={60} />
                                <h3>Select a doctor to view their current live queue</h3>
                            </div>
                        ) : queueLoading && doctorQueue.length === 0 ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading queue data...</p>
                            </div>
                        ) : doctorQueue.length === 0 ? (
                            <div className="empty-state">
                                <CheckCircle size={60} color="#28a745" />
                                <h3>No patients currently in queue for this doctor.</h3>
                                <p>All scheduled patients have been served or the queue hasn't started yet.</p>
                            </div>
                        ) : (
                            <div className="queue-live-view">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', marginBottom: '15px', fontSize: '0.9em' }}>
                                    <Zap size={14} color="#f1c40f" /> Live: Auto-refreshing every 10 seconds
                                </div>
                                <div className="data-table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Order</th>
                                                <th>Token</th>
                                                <th>Patient Name</th>
                                                <th>Scheduled Time</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {doctorQueue.map((item, index) => (
                                                <tr key={item.AppointmentID} style={index === 0 ? { backgroundColor: '#f0f9ff', borderLeft: '4px solid #2c7be5' } : {}}>
                                                    <td>
                                                        {index === 0 ? (
                                                            <span style={{ color: '#2c7be5', fontWeight: 'bold' }}>Now Serving</span>
                                                        ) : (
                                                            `#${item.QueuePosition}`
                                                        )}
                                                    </td>
                                                    <td><span className="token-pill">#{item.TokenNumber}</span></td>
                                                    <td><strong>{item.PatientName}</strong></td>
                                                    <td>{formatTime(item.TimeSlot)}</td>
                                                    <td>{getStatusBadge(item.Status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="tab-content">
                        <h2 className="section-title">System Settings</h2>
                        <div className="settings-grid">
                            <div className="setting-card">
                                <div className="setting-icon"><Shield size={28} /></div>
                                <h3>Admin Profile</h3>
                                <p>Update your personal information and contact details.</p>
                                <button className="btn-primary" onClick={() => window.location.href = '/admin/profile'}>
                                    Go to Profile
                                </button>
                            </div>
                            <div className="setting-card">
                                <div className="setting-icon"><Users size={28} /></div>
                                <h3>Walk-in Registration</h3>
                                <p>Register walk-in patients directly at the reception desk.</p>
                                <button className="btn-primary" onClick={() => window.location.href = '/admin/walkin'}>
                                    Register Walk-in
                                </button>
                            </div>
                            <div className="setting-card">
                                <div className="setting-icon"><BarChart3 size={28} /></div>
                                <h3>Queue Screen</h3>
                                <p>View and manage the live patient queue display.</p>
                                <button className="btn-primary" onClick={() => setActiveTab('live-queue')}>
                                    Open Queue
                                </button>
                            </div>
                            <div className="setting-card">
                                <div className="setting-icon"><Stethoscope size={28} /></div>
                                <h3>Manage Doctors</h3>
                                <p>View all registered doctors and their availability status.</p>
                                <button className="btn-primary" onClick={() => setActiveTab('doctors')}>
                                    View Doctors
                                </button>
                            </div>
                            <div className="setting-card">
                                <div className="setting-icon"><Ban size={28} /></div>
                                <h3>Blacklisted Patients</h3>
                                <p>View and manage patients who have been blacklisted.</p>
                                <button className="btn-primary" onClick={() => window.location.href = '/admin/blacklist'}>
                                    View Blacklist
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
