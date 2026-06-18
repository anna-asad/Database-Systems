import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { BarChart3, User, Stethoscope, Calendar, Clock, Users, Timer, RefreshCw, ArrowLeft, Zap } from 'lucide-react';
import './QueueStatus.css';

function QueueStatus() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [queueData, setQueueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (appointmentId) {
            fetchQueueStatus();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchQueueStatus, 30000);
            return () => clearInterval(interval);
        }
    }, [appointmentId]);

    const fetchQueueStatus = async () => {
        try {
            const response = await API.get(`/appointments/${appointmentId}/status`);
            setQueueData(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load queue status.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getStatusColor = () => {
        if (!queueData) return 'blue';
        if (queueData.patientsAhead === 0) return 'green';
        if (queueData.patientsAhead <= 2) return 'yellow';
        return 'blue';
    };

    const getStatusMessage = () => {
        if (!queueData) return '';
        if (queueData.status === 'Completed') return 'Your appointment is completed';
        if (queueData.status === 'Cancelled') return 'Your appointment was cancelled';
        if (queueData.patientsAhead === 0) return "It's your turn! Please proceed to the doctor.";
        if (queueData.patientsAhead === 1) return 'You are next! Please be ready.';
        return `Please wait. ${queueData.patientsAhead} patients ahead of you.`;
    };

    if (loading) {
        return (
            <div className="queue-status-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading queue status...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="queue-status-container">
                <div className="error-state">
                    <h2><X size={32} /> Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/patient/appointments')}>
                        Back to Appointments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="queue-status-container">
            <div className="queue-status-box">
                <div className="queue-header">
                    <h1><BarChart3 size={32} style={{display: 'inline', marginRight: '10px'}} />Queue Status</h1>
                    <p>Real-time appointment tracking</p>
                </div>

                <div className={`status-alert status-${getStatusColor()}`}>
                    {getStatusMessage()}
                </div>

                <div className="token-display-section">
                    <div className="current-token">
                        <span className="label">Currently Serving</span>
                        <div className="token-big">#{queueData.currentToken || 0}</div>
                    </div>

                    <div className="arrow">→</div>

                    <div className="your-token">
                        <span className="label">Your Token</span>
                        <div className="token-big token-highlight">#{queueData.tokenNumber}</div>
                    </div>
                </div>

                <div className="queue-stats">
                    <div className="stat-card">
                        <div className="stat-icon"><BarChart3 size={36} /></div>
                        <div className="stat-content">
                            <span className="stat-label">Queue Position</span>
                            <span className="stat-value">#{queueData.queuePosition || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"><Users size={36} /></div>
                        <div className="stat-content">
                            <span className="stat-label">Patients Ahead</span>
                            <span className="stat-value">{queueData.patientsAhead}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"><Timer size={36} /></div>
                        <div className="stat-content">
                            <span className="stat-label">Estimated Wait</span>
                            <span className="stat-value">~{queueData.estimatedWaitTime} min</span>
                        </div>
                    </div>
                </div>

                <div className="appointment-info">
                    <h3>Appointment Details</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-icon"><User size={28} /></span>
                            <div>
                                <strong>Doctor</strong>
                                <p>{queueData.doctorName}</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon"><Stethoscope size={28} /></span>
                            <div>
                                <strong>Specialization</strong>
                                <p>{queueData.specialization}</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon"><Calendar size={28} /></span>
                            <div>
                                <strong>Date</strong>
                                <p>{formatDate(queueData.appointmentDate)}</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon"><Clock size={28} /></span>
                            <div>
                                <strong>Time</strong>
                                <p>{formatTime(queueData.timeSlot)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="queue-actions">
                    <button className="btn-refresh" onClick={fetchQueueStatus}>
                        <RefreshCw size={18} style={{marginRight: '5px'}} /> Refresh Status
                    </button>
                    <button className="btn-back" onClick={() => navigate('/patient/appointments')}>
                        <ArrowLeft size={18} style={{marginRight: '5px'}} /> Back to Appointments
                    </button>
                </div>

                <div className="auto-refresh-note">
                    <p><Zap size={16} style={{display: 'inline', marginRight: '5px'}} />Auto-refreshing every 30 seconds</p>
                </div>
            </div>
        </div>
    );
}

export default QueueStatus;
