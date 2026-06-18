import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
    Stethoscope,
    Users,
    CheckCircle,
    Clock,
    Phone,
    BarChart3,
    Calendar,
    X,
    Volume2,
    AlertTriangle,
    FileText,
    ClipboardCheck,
    XCircle,
    CalendarDays,
    Ban,
    Briefcase,
    Bell,
    Send,
    Eye,
    MailOpen
} from 'lucide-react';
import './DoctorDashboard.css';

function DoctorDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [futureAppointments, setFutureAppointments] = useState([]);
    const [cancelledAppointments, setCancelledAppointments] = useState([]);
    const [viewMode, setViewMode] = useState('today');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [calledAppointment, setCalledAppointment] = useState(null);
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [completingAppointment, setCompletingAppointment] = useState(null);
    const [completeForm, setCompleteForm] = useState({
        remarks: '',
        diagnosis: '',
        prescription: '',
        notes: ''
    });
    const [actionLoading, setActionLoading] = useState(false);

    // Leave management state
    const [leaves, setLeaves] = useState([]);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [leaveSummary, setLeaveSummary] = useState([]);

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchAppointments();
        fetchLeaves();
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (viewMode === 'future' && futureAppointments.length === 0) {
            fetchFutureAppointments();
        }
        if (viewMode === 'cancelled' && cancelledAppointments.length === 0) {
            fetchCancelledAppointments();
        }
    }, [viewMode]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await API.get('/doctors/dashboard');
            setAppointments(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFutureAppointments = async () => {
        try {
            setLoading(true);
            const response = await API.get('/doctors/appointments/future');
            setFutureAppointments(response.data);
            setError('');
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message;
            if (status === 404) {
                setError('Future appointments endpoint not found. Please restart the backend server.');
            } else {
                setError(msg || `Failed to load future appointments${status ? ` (HTTP ${status})` : ''}.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCancelledAppointments = async () => {
        try {
            setLoading(true);
            const response = await API.get('/doctors/appointments/cancelled');
            setCancelledAppointments(response.data);
            setError('');
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message;
            if (status === 404) {
                setError('Cancelled appointments endpoint not found. Please restart the backend server.');
            } else {
                setError(msg || `Failed to load cancelled appointments${status ? ` (HTTP ${status})` : ''}.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaves = async () => {
        try {
            const response = await API.get('/doctors/leaves');
            setLeaves(response.data);
        } catch (err) {
            console.error('Failed to load leaves', err);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await API.get('/doctors/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.IsRead).length);
        } catch (err) {
            console.error('Failed to load notifications', err);
        }
    };

    const markNotificationRead = async (notificationId) => {
        try {
            await API.put(`/doctors/notifications/${notificationId}/read`);
            setNotifications(prev => prev.map(n => n.NotificationID === notificationId ? { ...n, IsRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await API.post('/doctors/leaves', leaveForm);
            setLeaveModalOpen(false);
            setLeaveForm({ startDate: '', endDate: '', reason: '' });
            fetchLeaves();
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply for leave.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewSummary = async (leave) => {
        if (leave.Status !== 'Approved') return;
        try {
            setActionLoading(true);
            const response = await API.get(`/doctors/leaves/${leave.LeaveID}/summary`);
            setLeaveSummary(response.data);
            setSelectedLeave(leave);
            setSummaryModalOpen(true);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load leave summary.');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
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

    const activeAppointments = appointments.filter(
        (a) => a.Status === 'Scheduled' || a.Status === 'Walk-In'
    );

    const completedAppointments = appointments.filter(
        (a) => a.Status === 'Completed'
    );

    const nextAppointment = activeAppointments.length > 0
        ? activeAppointments.reduce((prev, curr) =>
            (curr.QueuePosition || 999) < (prev.QueuePosition || 999) ? curr : prev
        )
        : null;

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

    const handleCallNext = async () => {
        if (!nextAppointment) return;
        try {
            setActionLoading(true);
            await API.put(`/doctors/appointments/${nextAppointment.AppointmentID}/call`);
            setCalledAppointment(nextAppointment);
            setCallModalOpen(true);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to call next patient.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkMissed = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to mark this appointment as missed?')) return;
        try {
            setActionLoading(true);
            await API.put(`/appointments/${appointmentId}/miss`);
            fetchAppointments();
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark as missed.');
        } finally {
            setActionLoading(false);
        }
    };

    const openCompleteModal = (appointment) => {
        setCompletingAppointment(appointment);
        setCompleteForm({ remarks: '', diagnosis: '', prescription: '', notes: '' });
        setCompleteModalOpen(true);
    };

    const handleComplete = async (e) => {
        e.preventDefault();
        if (!completingAppointment) return;
        try {
            setActionLoading(true);
            await API.put(`/doctors/appointments/${completingAppointment.AppointmentID}/complete`, {
                remarks: completeForm.remarks,
                diagnosis: completeForm.diagnosis,
                prescription: completeForm.prescription,
                notes: completeForm.notes
            });
            setCompleteModalOpen(false);
            setCompletingAppointment(null);
            fetchAppointments();
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete appointment.');
        } finally {
            setActionLoading(false);
        }
    };

    const currentAppointments =
        viewMode === 'today' ? appointments :
        viewMode === 'future' ? futureAppointments :
        viewMode === 'cancelled' ? cancelledAppointments :
        viewMode === 'leaves' ? [] : appointments;
    const isTodayView = viewMode === 'today';
    const isCancelledView = viewMode === 'cancelled';
    const isLeavesView = viewMode === 'leaves';

    if (loading && currentAppointments.length === 0 && !isLeavesView) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-box">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading appointments...</p>
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
                            <Stethoscope size={32} style={{ display: 'inline', marginRight: '10px' }} />
                            Doctor Dashboard
                        </h1>
                        <p>Manage your daily appointments and queue</p>
                    </div>
                    <div className="header-actions">
                        <div className="notification-wrapper">
                            <button 
                                className="btn-icon notification-btn"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={22} />
                                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                            </button>
                            {showNotifications && (
                                <div className="notification-dropdown">
                                    <div className="notification-header">
                                        <strong>Notifications</strong>
                                        <button className="close-dropdown" onClick={() => setShowNotifications(false)}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="notification-empty">No notifications</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div 
                                                key={n.NotificationID} 
                                                className={`notification-item ${!n.IsRead ? 'unread' : ''}`}
                                                onClick={() => markNotificationRead(n.NotificationID)}
                                            >
                                                <div className="notification-title">{n.Title}</div>
                                                <div className="notification-message">{n.Message}</div>
                                                <div className="notification-time">{new Date(n.CreatedAt).toLocaleString()}</div>
                                                {!n.IsRead && <span className="unread-dot"></span>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="header-date">
                            <Calendar size={20} />
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                <div className="stats-bar">
                    <div className="stat-card">
                        <Users size={24} />
                        <span className="stat-value">{appointments.length}</span>
                        <span className="stat-label">Total Today</span>
                    </div>
                    <div className="stat-card">
                        <CheckCircle size={24} />
                        <span className="stat-value">{completedAppointments.length}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                    <div className="stat-card">
                        <Clock size={24} />
                        <span className="stat-value">{activeAppointments.length}</span>
                        <span className="stat-label">In Queue</span>
                    </div>
                    <div className="stat-card">
                        <Briefcase size={24} />
                        <span className="stat-value">{leaves.filter(l => l.Status === 'Pending').length}</span>
                        <span className="stat-label">Pending Leaves</span>
                    </div>
                </div>

                {isTodayView && nextAppointment && (
                    <div className="call-next-section">
                        <button
                            className="btn-call-next"
                            onClick={handleCallNext}
                            disabled={actionLoading}
                        >
                            <Volume2 size={24} />
                            {actionLoading ? 'Calling...' : 'Call Next Patient'}
                        </button>
                        <span className="next-patient-preview">
                            Next: <strong>Token #{nextAppointment.TokenNumber}</strong> — {nextAppointment.PatientName}
                        </span>
                    </div>
                )}

                <div className="view-tabs">
                    <button
                        className={`view-tab ${isTodayView ? 'active' : ''}`}
                        onClick={() => setViewMode('today')}
                    >
                        <Calendar size={18} style={{ marginRight: '6px' }} />
                        Today&apos;s Appointments
                    </button>
                    <button
                        className={`view-tab ${viewMode === 'future' ? 'active' : ''}`}
                        onClick={() => setViewMode('future')}
                    >
                        <CalendarDays size={18} style={{ marginRight: '6px' }} />
                        Future Appointments
                    </button>
                    <button
                        className={`view-tab ${isCancelledView ? 'active' : ''}`}
                        onClick={() => setViewMode('cancelled')}
                    >
                        <Ban size={18} style={{ marginRight: '6px' }} />
                        Cancelled
                    </button>
                    <button
                        className={`view-tab ${isLeavesView ? 'active' : ''}`}
                        onClick={() => setViewMode('leaves')}
                    >
                        <Briefcase size={18} style={{ marginRight: '6px' }} />
                        My Leaves
                    </button>
                </div>

                {isLeavesView ? (
                    <div className="appointments-list">
                        <div className="list-title-with-action">
                            <h2 className="list-title">
                                <Briefcase size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                My Leave Requests
                            </h2>
                            <button className="btn-apply-leave" onClick={() => setLeaveModalOpen(true)}>
                                <Send size={16} style={{ marginRight: '5px' }} />
                                Apply for Leave
                            </button>
                        </div>
                        {leaves.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon"><Briefcase size={80} /></div>
                                <h3>No Leave Requests</h3>
                                <p>You haven&apos;t applied for any leave yet.</p>
                                <button className="btn-primary" onClick={() => setLeaveModalOpen(true)}>
                                    Apply for Leave
                                </button>
                            </div>
                        ) : (
                            <div className="leaves-list">
                                {leaves.map(leave => (
                                    <div key={leave.LeaveID} className="leave-card">
                                        <div className="leave-header">
                                            <div>
                                                <h4>Leave Request #{leave.LeaveID}</h4>
                                                <p className="leave-dates">
                                                    {formatDate(leave.StartDate)} — {formatDate(leave.EndDate)}
                                                </p>
                                            </div>
                                            {getStatusBadge(leave.Status)}
                                        </div>
                                        <div className="leave-body">
                                            <div className="leave-reason">
                                                <FileText size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                <strong>Reason:</strong> {leave.Reason || 'N/A'}
                                            </div>
                                            {leave.Status === 'Approved' && (
                                                <button 
                                                    className="btn-view-summary"
                                                    onClick={() => handleViewSummary(leave)}
                                                    disabled={actionLoading}
                                                >
                                                    <Eye size={16} style={{ marginRight: '5px' }} />
                                                    View Cancelled Appointments
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : currentAppointments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            {isTodayView ? <Calendar size={80} /> : isCancelledView ? <Ban size={80} /> : <CalendarDays size={80} />}
                        </div>
                        <h3>
                            {isTodayView ? 'No Appointments Today' : isCancelledView ? 'No Cancelled Appointments' : 'No Future Appointments'}
                        </h3>
                        <p>
                            {isTodayView
                                ? 'There are no appointments scheduled for you today.'
                                : isCancelledView
                                ? 'You have no cancelled appointments.'
                                : 'There are no upcoming appointments scheduled.'}
                        </p>
                    </div>
                ) : (
                    <div className="appointments-list">
                        <h2 className="list-title">
                            <ClipboardCheck size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            {isTodayView ? "Today's Appointments" : isCancelledView ? 'Cancelled Appointments' : 'Future Appointments'}
                        </h2>
                        {currentAppointments.map((appointment) => (
                            <div key={appointment.AppointmentID} className={`appointment-card ${isCancelledView ? 'cancelled-card' : ''}`}>
                                <div className="appointment-header-row">
                                    <div className="token-display">
                                        <span className="token-label">Token</span>
                                        <span className="token-number">
                                            #{appointment.TokenNumber}
                                        </span>
                                    </div>
                                    {getStatusBadge(appointment.Status)}
                                </div>

                                <div className="appointment-body">
                                    <div className="appointment-info-grid">
                                        <div className="info-item">
                                            <span className="info-icon">
                                                <Users size={20} />
                                            </span>
                                            <div>
                                                <strong>Patient</strong>
                                                <p>{appointment.PatientName}</p>
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <span className="info-icon">
                                                <Phone size={20} />
                                            </span>
                                            <div>
                                                <strong>Contact</strong>
                                                <p>{appointment.ContactNumber || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {!isTodayView && (
                                            <div className="info-item">
                                                <span className="info-icon">
                                                    <Calendar size={20} />
                                                </span>
                                                <div>
                                                    <strong>Date</strong>
                                                    <p>{formatDate(appointment.AppointmentDate)}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="info-item">
                                            <span className="info-icon">
                                                <Clock size={20} />
                                            </span>
                                            <div>
                                                <strong>Time Slot</strong>
                                                <p>{formatTime(appointment.TimeSlot)}</p>
                                            </div>
                                        </div>

                                        {isTodayView && appointment.QueuePosition && (
                                            <div className="info-item">
                                                <span className="info-icon">
                                                    <BarChart3 size={20} />
                                                </span>
                                                <div>
                                                    <strong>Queue Position</strong>
                                                    <p>#{appointment.QueuePosition}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {appointment.DoctorRemarks && (
                                        <div className="remarks-box">
                                            <FileText size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                            <strong>Remarks:</strong> {appointment.DoctorRemarks}
                                        </div>
                                    )}

                                    {isTodayView &&
                                        (appointment.Status === 'Scheduled' ||
                                            appointment.Status === 'Walk-In') && (
                                        <div className="appointment-actions">
                                            <button
                                                className="btn-complete"
                                                onClick={() => openCompleteModal(appointment)}
                                                disabled={actionLoading}
                                            >
                                                <CheckCircle size={16} style={{ marginRight: '5px' }} />
                                                Mark Completed
                                            </button>
                                            <button
                                                className="btn-miss"
                                                onClick={() => handleMarkMissed(appointment.AppointmentID)}
                                                disabled={actionLoading}
                                            >
                                                <XCircle size={16} style={{ marginRight: '5px' }} />
                                                Mark Missed
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Call Next Patient Modal */}
            {callModalOpen && calledAppointment && (
                <div className="modal-overlay" onClick={() => setCallModalOpen(false)}>
                    <div className="modal-content call-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setCallModalOpen(false)}>
                            <X size={22} />
                        </button>
                        <div className="call-modal-body">
                            <div className="call-icon">
                                <Volume2 size={48} />
                            </div>
                            <h2>Now Calling</h2>
                            <div className="call-token">
                                Token <span>#{calledAppointment.TokenNumber}</span>
                            </div>
                            <div className="call-patient-name">{calledAppointment.PatientName}</div>
                            <div className="call-details">
                                <span>
                                    <Clock size={16} /> {formatTime(calledAppointment.TimeSlot)}
                                </span>
                                <span>
                                    <Phone size={16} /> {calledAppointment.ContactNumber || 'N/A'}
                                </span>
                            </div>
                            <button
                                className="btn-primary"
                                onClick={() => setCallModalOpen(false)}
                            >
                                <CheckCircle size={18} style={{ marginRight: '6px' }} />
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Appointment Modal */}
            {completeModalOpen && completingAppointment && (
                <div className="modal-overlay" onClick={() => setCompleteModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <ClipboardCheck size={22} style={{ marginRight: '8px' }} />
                                Complete Appointment
                            </h2>
                            <button className="modal-close" onClick={() => setCompleteModalOpen(false)}>
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleComplete} className="complete-form">
                            <div className="form-row-info">
                                <span>
                                    <strong>Token:</strong> #{completingAppointment.TokenNumber}
                                </span>
                                <span>
                                    <strong>Patient:</strong> {completingAppointment.PatientName}
                                </span>
                            </div>
                            <div className="form-group">
                                <label>Doctor Remarks</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter general remarks..."
                                    value={completeForm.remarks}
                                    onChange={(e) =>
                                        setCompleteForm({ ...completeForm, remarks: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Diagnosis</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter diagnosis..."
                                    value={completeForm.diagnosis}
                                    onChange={(e) =>
                                        setCompleteForm({ ...completeForm, diagnosis: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Prescription</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter prescription..."
                                    value={completeForm.prescription}
                                    onChange={(e) =>
                                        setCompleteForm({ ...completeForm, prescription: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Additional Notes</label>
                                <textarea
                                    rows={2}
                                    placeholder="Any additional notes..."
                                    value={completeForm.notes}
                                    onChange={(e) =>
                                        setCompleteForm({ ...completeForm, notes: e.target.value })
                                    }
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setCompleteModalOpen(false)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Saving...' : 'Complete Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Apply for Leave Modal */}
            {leaveModalOpen && (
                <div className="modal-overlay" onClick={() => setLeaveModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <Briefcase size={22} style={{ marginRight: '8px' }} />
                                Apply for Leave
                            </h2>
                            <button className="modal-close" onClick={() => setLeaveModalOpen(false)}>
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleApplyLeave} className="complete-form">
                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    className="date-input"
                                    value={leaveForm.startDate}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    className="date-input"
                                    value={leaveForm.endDate}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter reason for leave (e.g., out of city, personal, sick leave)..."
                                    value={leaveForm.reason}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setLeaveModalOpen(false)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Submitting...' : 'Apply for Leave'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Leave Summary Modal */}
            {summaryModalOpen && selectedLeave && (
                <div className="modal-overlay" onClick={() => setSummaryModalOpen(false)}>
                    <div className="modal-content summary-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <Eye size={22} style={{ marginRight: '8px' }} />
                                Cancelled Appointments Summary
                            </h2>
                            <button className="modal-close" onClick={() => setSummaryModalOpen(false)}>
                                <X size={22} />
                            </button>
                        </div>
                        <div className="summary-body">
                            <div className="summary-info">
                                <p><strong>Leave Period:</strong> {formatDate(selectedLeave.StartDate)} — {formatDate(selectedLeave.EndDate)}</p>
                                <p><strong>Total Cancelled:</strong> {leaveSummary.length} appointment(s)</p>
                            </div>
                            {leaveSummary.length === 0 ? (
                                <div className="empty-state small">
                                    <p>No appointments were cancelled for this leave period.</p>
                                </div>
                            ) : (
                                <div className="summary-list">
                                    {leaveSummary.map(appt => (
                                        <div key={appt.AppointmentID} className="summary-item">
                                            <div className="summary-item-header">
                                                <span className="summary-token">Token #{appt.TokenNumber}</span>
                                                <span className="summary-date">{formatDate(appt.AppointmentDate)}</span>
                                            </div>
                                            <div className="summary-item-details">
                                                <span><Users size={14} /> {appt.PatientName}</span>
                                                <span><Clock size={14} /> {formatTime(appt.TimeSlot)}</span>
                                                <span><Phone size={14} /> {appt.ContactNumber || 'N/A'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={() => setSummaryModalOpen(false)}>
                                <CheckCircle size={16} style={{ marginRight: '5px' }} />
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DoctorDashboard;

