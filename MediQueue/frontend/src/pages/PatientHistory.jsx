import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { FileText, Calendar, Clock, User, CheckCircle, XCircle, Ban, RotateCcw, UserX, AlertTriangle, Stethoscope } from 'lucide-react';
import './MyAppointments.css';

function PatientHistory() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
        fetchHistory();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await API.get('/patients/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Failed to load stats');
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await API.get('/patients/history');
            setHistory(response.data);
        } catch (err) {
            setError('Failed to load visit history.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
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
        const statusConfig = {
            'Scheduled':   { icon: <Calendar size={16} />,    color: 'blue'   },
            'Completed':   { icon: <CheckCircle size={16} />, color: 'green'  },
            'Missed':      { icon: <XCircle size={16} />,     color: 'red'    },
            'Walk-In':     { icon: <UserX size={16} />,       color: 'orange' },
            'Cancelled':   { icon: <Ban size={16} />,         color: 'gray'   },
            'Rescheduled': { icon: <RotateCcw size={16} />,   color: 'purple' }
        };
        const config = statusConfig[status] || { icon: <Calendar size={16} />, color: 'gray' };
        return (
            <span className={`status-badge status-${config.color}`}>
                {config.icon} {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="appointments-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your visit history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="appointments-container">
            <div className="appointments-box">

                {/* Header */}
                <div className="appointments-header">
                    <div>
                        <h1>
                            <FileText size={32} style={{ display: 'inline', marginRight: '10px' }} />
                            My Visit History
                        </h1>
                        <p>Your complete appointment and medical record history</p>
                    </div>
                    <button className="btn-book" onClick={() => navigate('/patient/book')}>
                        Book New Appointment
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                {/* Blacklist Warning */}
                {stats?.IsBlacklisted === true && (
                    <div style={{
                        background: '#fff3cd', border: '1px solid #ffc107',
                        borderRadius: '10px', padding: '15px 20px',
                        marginBottom: '20px', display: 'flex',
                        alignItems: 'center', gap: '10px', color: '#856404'
                    }}>
                        <AlertTriangle size={22} />
                        <div>
                            <strong>Account Blacklisted</strong>
                            <p style={{ margin: 0, fontSize: '0.9em' }}>
                                You missed more than 3 appointments. Contact admin to restore access.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '15px',
                        marginBottom: '30px'
                    }}>
                        <div style={{ background: '#e8f4fd', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#2c7be5' }}>
                                {stats.TotalVisits}
                            </div>
                            <div style={{ color: '#666', marginTop: '5px' }}>Total Appointments</div>
                        </div>
                        <div style={{ background: '#d4edda', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#28a745' }}>
                                {stats.SuccessfulVisits}
                            </div>
                            <div style={{ color: '#666', marginTop: '5px' }}>Successful Visits</div>
                        </div>
                        <div style={{ background: '#f8d7da', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#dc3545' }}>
                                {stats.MissedVisits}
                            </div>
                            <div style={{ color: '#666', marginTop: '5px' }}>Missed Visits</div>
                        </div>
                    </div>
                )}

                {/* History List */}
                {history.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><FileText size={80} /></div>
                        <h3>No Visit History</h3>
                        <p>You have no appointment history yet.</p>
                        <button className="btn-primary" onClick={() => navigate('/patient/book')}>
                            Book Your First Appointment
                        </button>
                    </div>
                ) : (
                    <div className="appointments-list">
                        {history.map((record) => (
                            <div key={record.AppointmentID} className="appointment-card">
                                <div className="appointment-header-row">
                                    <div className="token-display">
                                        <span className="token-label">Token</span>
                                        <span className="token-number">#{record.TokenNumber}</span>
                                    </div>
                                    {getStatusBadge(record.Status)}
                                </div>
                                <div className="appointment-body">
                                    <div className="appointment-info">
                                        <div className="info-row">
                                            <span className="info-icon"><User size={24} /></span>
                                            <div>
                                                <strong>{record.DoctorName}</strong>
                                                <p>{record.Specialization}</p>
                                            </div>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-icon"><Calendar size={24} /></span>
                                            <div>
                                                <strong>Date</strong>
                                                <p>{formatDate(record.AppointmentDate)}</p>
                                            </div>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-icon"><Clock size={24} /></span>
                                            <div>
                                                <strong>Time</strong>
                                                <p>{formatTime(record.TimeSlot)}</p>
                                            </div>
                                        </div>
                                        {record.Diagnosis && (
                                            <div className="info-row">
                                                <span className="info-icon"><Stethoscope size={24} /></span>
                                                <div>
                                                    <strong>Diagnosis</strong>
                                                    <p>{record.Diagnosis}</p>
                                                </div>
                                            </div>
                                        )}
                                        {record.DoctorRemarks && (
                                            <div className="remarks-section">
                                                <strong>Doctor's Remarks:</strong>
                                                <p>{record.DoctorRemarks}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PatientHistory;