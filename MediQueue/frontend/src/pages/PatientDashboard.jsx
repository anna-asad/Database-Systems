import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
    User,
    Calendar,
    CheckCircle,
    XCircle,
    AlertTriangle,
    FileText,
    Clock,
    RefreshCw,
    Heart,
    Activity,
    BarChart3,
    Edit2,
    Save,
    X
} from 'lucide-react';
import './PatientDashboard.css';

function PatientDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [profile, setProfile] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            await Promise.all([
                fetchStats(),
                fetchProfile(),
                fetchAppointmentHistory()
            ]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await API.get('/patients/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Failed to load stats', err);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await API.get('/patients/profile');
            setProfile(response.data);
            setEditFormData({
                fullName: response.data.FullName || '',
                contactNumber: response.data.ContactNumber || '',
                cnic: response.data.CNIC || ''
            });
        } catch (err) {
            console.error('Failed to load profile', err);
        }
    };

    const fetchAppointmentHistory = async () => {
        try {
            const response = await API.get('/patients/history');
            setAppointments(response.data);
        } catch (err) {
            console.error('Failed to load appointment history', err);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async () => {
        try {
            setSaveLoading(true);
            await API.put('/patients/profile', {
                fullName: editFormData.fullName,
                contactNumber: editFormData.contactNumber
            });
            setProfile(prev => ({
                ...prev,
                FullName: editFormData.fullName,
                ContactNumber: editFormData.contactNumber
            }));
            setEditMode(false);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save profile.');
        } finally {
            setSaveLoading(false);
        }
    };

    const getStatistics = () => {
        if (!appointments || appointments.length === 0) {
            return {
                totalAppointments: 0,
                successful: 0,
                missed: 0,
                upcoming: 0
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalAppointments = 0;
        let successful = 0;
        let missed = 0;
        let upcoming = 0;

        appointments.forEach(appt => {
            const appointmentDate = new Date(appt.AppointmentDate);
            appointmentDate.setHours(0, 0, 0, 0);

            totalAppointments++;

            if (appt.Status === 'Completed') {
                successful++;
            } else if (appt.Status === 'No-show' || appt.Status === 'Cancelled') {
                missed++;
            } else if (appointmentDate >= today) {
                upcoming++;
            }
        });

        return {
            totalAppointments,
            successful,
            missed,
            upcoming
        };
    };

    const calculatedStats = getStatistics();

    const getStatusColor = (status) => {
        const statusMap = {
            'Completed': '#4CAF50',
            'Scheduled': '#2196F3',
            'Cancelled': '#f44336',
            'No-show': '#ff9800',
            'Pending': '#FFC107'
        };
        return statusMap[status] || '#757575';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeSlot) => {
        if (!timeSlot) return 'N/A';
        const [hours, minutes] = timeSlot.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-box">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1>Patient Dashboard</h1>
                        <p>Welcome to your health management portal</p>
                    </div>
                    <div className="header-actions">
                        <button
                            className={`btn-refresh ${refreshing ? 'refreshing' : ''}`}
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="error-banner">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading your dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="patient-tabs">
                            <button
                                className={`patient-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <BarChart3 size={18} />
                                Overview
                            </button>
                            <button
                                className={`patient-tab ${activeTab === 'history' ? 'active' : ''}`}
                                onClick={() => setActiveTab('history')}
                            >
                                <Calendar size={18} />
                                Visit History
                            </button>
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="tab-content">
                                {/* Statistics Cards - At Top */}
                                <div className="stats-section">
                                    <h2 className="section-title">
                                        <Activity size={24} style={{ marginRight: '8px', display: 'inline-block' }} /> Visit Statistics
                                    </h2>
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <Calendar size={28} />
                                            <p className="stat-value">{calculatedStats.totalAppointments}</p>
                                            <p className="stat-label">Total Appointments</p>
                                        </div>

                                        <div className="stat-card">
                                            <CheckCircle size={28} />
                                            <p className="stat-value">{calculatedStats.successful}</p>
                                            <p className="stat-label">Completed Visits</p>
                                        </div>

                                        <div className="stat-card alert">
                                            <XCircle size={28} />
                                            <p className="stat-value">{calculatedStats.missed}</p>
                                            <p className="stat-label">Missed/Cancelled</p>
                                        </div>

                                        <div className="stat-card">
                                            <Clock size={28} />
                                            <p className="stat-value">{calculatedStats.upcoming}</p>
                                            <p className="stat-label">Upcoming</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Success Rate */}
                                {calculatedStats.totalAppointments > 0 && (
                                    <div className="success-rate-section">
                                        <h3 className="section-title">
                                            <Heart size={24} style={{ marginRight: '8px', display: 'inline-block' }} /> Visit Success Rate
                                        </h3>
                                        <div className="success-rate-card">
                                            <div className="progress-container">
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{
                                                            width: `${(calculatedStats.successful / calculatedStats.totalAppointments) * 100}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <p className="success-rate-text">
                                                    {((calculatedStats.successful / calculatedStats.totalAppointments) * 100).toFixed(1)}% Success Rate
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Patient Info Card - Below Statistics */}
                                <div className="patient-info-section">
                                    <h3 className="section-title">
                                        <User size={24} style={{ marginRight: '8px', display: 'inline-block' }} /> Personal Information
                                    </h3>
                                    {editMode ? (
                                        <div className="edit-form">
                                            <div className="form-group">
                                                <label>Full Name</label>
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={editFormData.fullName}
                                                    onChange={handleEditChange}
                                                    placeholder="Enter full name"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Contact Number</label>
                                                <input
                                                    type="text"
                                                    name="contactNumber"
                                                    value={editFormData.contactNumber}
                                                    onChange={handleEditChange}
                                                    placeholder="Enter contact number"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>CNIC</label>
                                                <input
                                                    type="text"
                                                    name="cnic"
                                                    value={editFormData.cnic}
                                                    disabled
                                                    placeholder="CNIC (cannot be edited)"
                                                />
                                            </div>
                                            <div className="form-actions">
                                                <button
                                                    className="btn-save"
                                                    onClick={handleSaveProfile}
                                                    disabled={saveLoading}
                                                >
                                                    <Save size={18} />
                                                    {saveLoading ? 'Saving...' : 'Save Changes'}
                                                </button>
                                                <button
                                                    className="btn-cancel"
                                                    onClick={handleCancelEdit}
                                                    disabled={saveLoading}
                                                >
                                                    <X size={18} />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {profile && (
                                                <div className="info-grid">
                                                    <div className="info-item">
                                                        <label>Full Name</label>
                                                        <p>{profile.FullName || 'N/A'}</p>
                                                    </div>
                                                    <div className="info-item">
                                                        <label>CNIC</label>
                                                        <p>{profile.CNIC || 'N/A'}</p>
                                                    </div>
                                                    <div className="info-item">
                                                        <label>Email</label>
                                                        <p>{profile.Email || 'N/A'}</p>
                                                    </div>
                                                    <div className="info-item">
                                                        <label>Contact Number</label>
                                                        <p>{profile.ContactNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                className="btn-edit"
                                                onClick={() => setEditMode(true)}
                                            >
                                                <Edit2 size={18} />
                                                Edit Information
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className="tab-content">
                                <div className="history-section">
                                    <h2>
                                        <FileText size={24} /> Complete Appointment History
                                    </h2>
                                    {appointments.length === 0 ? (
                                        <div className="empty-state">
                                            <Calendar size={48} />
                                            <h3>No Appointment History</h3>
                                            <p>You haven't had any appointments yet.</p>
                                        </div>
                                    ) : (
                                        <div className="appointments-table-wrapper">
                                            <table className="appointments-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Time</th>
                                                        <th>Doctor</th>
                                                        <th>Specialization</th>
                                                        <th>Token #</th>
                                                        <th>Status</th>
                                                        <th>Doctor Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {appointments.map((appointment) => (
                                                        <tr key={appointment.AppointmentID}>
                                                            <td>{formatDate(appointment.AppointmentDate)}</td>
                                                            <td>{formatTime(appointment.TimeSlot)}</td>
                                                            <td className="doctor-name">{appointment.DoctorName}</td>
                                                            <td>{appointment.Specialization}</td>
                                                            <td className="token">#{appointment.TokenNumber}</td>
                                                            <td>
                                                                <span
                                                                    className="status-badge"
                                                                    style={{
                                                                        backgroundColor: getStatusColor(appointment.Status),
                                                                        color: 'white'
                                                                    }}
                                                                >
                                                                    {appointment.Status}
                                                                </span>
                                                            </td>
                                                            <td className="remarks">
                                                                {appointment.DoctorRemarks ? (
                                                                    <span title={appointment.DoctorRemarks}>
                                                                        {appointment.DoctorRemarks.length > 50
                                                                            ? `${appointment.DoctorRemarks.substring(0, 50)}...`
                                                                            : appointment.DoctorRemarks}
                                                                    </span>
                                                                ) : (
                                                                    <span className="no-remarks">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default PatientDashboard;
