import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { FileText, Plus, Calendar, Clock, User, Stethoscope, BarChart3, BarChart, X, CheckCircle, XCircle, UserX, RotateCcw, Ban, AlertTriangle, ArrowRight, Bell, MailOpen } from 'lucide-react';
import './MyAppointments.css';

function MyAppointments() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'cancelled' | 'notifications'

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [notificationLoading, setNotificationLoading] = useState(false);

    // Reschedule modal state
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [timeSlots, setTimeSlots] = useState([]);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [rescheduleError, setRescheduleError] = useState('');

    useEffect(() => {
        fetchAppointments();
        fetchNotifications();
    }, []);
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await API.get('/patients/history');
            setAppointments(response.data);
        } catch (err) {
            setError('Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
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

    const getStatusBadge = (status) => {
        const statusConfig = {
            'Scheduled': { icon: <Calendar size={16} />, color: 'blue' },
            'Completed': { icon: <CheckCircle size={16} />, color: 'green' },
            'Missed': { icon: <XCircle size={16} />, color: 'red' },
            'Walk-In': { icon: <UserX size={16} />, color: 'orange' },
            'Cancelled': { icon: <Ban size={16} />, color: 'gray' },
            'Rescheduled': { icon: <RotateCcw size={16} />, color: 'purple' }
        };

        const config = statusConfig[status] || { icon: <Calendar size={16} />, color: 'gray' };
        return (
            <span className={`status-badge status-${config.color}`}>
                {config.icon} {status}
            </span>
        );
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        try {
            await API.put(`/appointments/${appointmentId}/cancel`);
            setError('');
            fetchAppointments(); // Refresh list
            alert('Appointment cancelled successfully.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel appointment.');
        }
    };

    // --- Reschedule handlers ---

    const openRescheduleModal = (appointment) => {
        setRescheduleAppointment(appointment);
        setNewDate('');
        setNewTime('');
        setTimeSlots([]);
        setRescheduleError('');
        setShowRescheduleModal(true);
    };

    const closeRescheduleModal = () => {
        setShowRescheduleModal(false);
        setRescheduleAppointment(null);
        setNewDate('');
        setNewTime('');
        setTimeSlots([]);
        setRescheduleError('');
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 9; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 17 && minute > 0) break;
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                const displayTime = formatTimeDisplay(timeString);
                slots.push({ value: timeString, display: displayTime });
            }
        }
        setTimeSlots(slots);
    };

    const formatTimeDisplay = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const handleRescheduleDateChange = (e) => {
        setNewDate(e.target.value);
        setNewTime('');
        setRescheduleError('');
        generateTimeSlots();
    };

    const handleRescheduleTimeSelect = (time) => {
        setNewTime(time);
        setRescheduleError('');
    };

    const handleConfirmReschedule = async () => {
        if (!newDate || !newTime) {
            setRescheduleError('Please select both a new date and time slot.');
            return;
        }

        setRescheduleLoading(true);
        setRescheduleError('');

        try {
            await API.put(`/appointments/${rescheduleAppointment.AppointmentID}/reschedule`, {
                newDate,
                newTimeSlot: newTime
            });
            setShowRescheduleModal(false);
            fetchAppointments();
            alert('Appointment rescheduled successfully.');
        } catch (err) {
            setRescheduleError(err.response?.data?.message || 'Failed to reschedule appointment.');
        } finally {
            setRescheduleLoading(false);
        }
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // --- Notification handlers ---

    const fetchNotifications = async () => {
        try {
            setNotificationLoading(true);
            const response = await API.get('/patients/notifications');
            setNotifications(response.data);
        } catch (err) {
            console.error('Failed to load notifications', err);
        } finally {
            setNotificationLoading(false);
        }
    };

    const markNotificationRead = async (notificationId) => {
        try {
            await API.put(`/patients/notifications/${notificationId}/read`);
            setNotifications(prev => prev.map(n => n.NotificationID === notificationId ? { ...n, IsRead: true } : n));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.IsRead).length;

    if (loading) {
        return (
            <div className="appointments-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="appointments-container">
            <div className="appointments-box">
                <div className="appointments-header">
                    <div>
                        <h1><FileText size={32} style={{display: 'inline', marginRight: '10px'}} />My Appointments</h1>
                        <p>View and manage your appointments</p>
                    </div>
                    <button className="btn-book" onClick={() => navigate('/patient/book')}>
                        <Plus size={18} style={{marginRight: '5px'}} /> Book New Appointment
                    </button>
                </div>

                {error && <div className="error-message"><X size={18} /> {error}</div>}

                {appointments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Calendar size={80} /></div>
                        <h3>No Appointments Yet</h3>
                        <p>You haven't booked any appointments. Start by booking your first consultation.</p>
                        <button className="btn-primary" onClick={() => navigate('/patient/book')}>
                            Book Your First Appointment
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="appointments-tabs">
                            <button 
                                className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                                onClick={() => setActiveTab('active')}
                            >
                                <Calendar size={18} style={{marginRight: '6px'}} /> Appointments
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
                                onClick={() => setActiveTab('cancelled')}
                            >
                                <Ban size={18} style={{marginRight: '6px'}} /> Cancelled
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notifications')}
                            >
                                <Bell size={18} style={{marginRight: '6px'}} /> 
                                Notifications
                                {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
                            </button>
                        </div>

                        {/* Active Tab Content */}
                        {activeTab === 'active' && (
                            <div className="appointments-list">
                                {appointments.filter(a => a.Status !== 'Cancelled').length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon"><Calendar size={60} /></div>
                                        <h3>No Active Appointments</h3>
                                        <p>You have no active appointments right now.</p>
                                        <button className="btn-primary" onClick={() => navigate('/patient/book')}>
                                            Book an Appointment
                                        </button>
                                    </div>
                                ) : (
                                    appointments.filter(a => a.Status !== 'Cancelled').map(appointment => (
                                        <div key={appointment.AppointmentID} className="appointment-card">
                                            <div className="appointment-header-row">
                                                <div className="token-display">
                                                    <span className="token-label">Token</span>
                                                    <span className="token-number">#{appointment.TokenNumber}</span>
                                                </div>
                                                {getStatusBadge(appointment.Status)}
                                            </div>

                                            <div className="appointment-body">
                                                <div className="appointment-info">
                                                    <div className="info-row">
                                                        <span className="info-icon"><User size={24} /></span>
                                                        <div>
                                                            <strong>{appointment.DoctorName}</strong>
                                                            <p>{appointment.Specialization}</p>
                                                        </div>
                                                    </div>

                                                    <div className="info-row">
                                                        <span className="info-icon"><Calendar size={24} /></span>
                                                        <div>
                                                            <strong>Date</strong>
                                                            <p>{formatDate(appointment.AppointmentDate)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="info-row">
                                                        <span className="info-icon"><Clock size={24} /></span>
                                                        <div>
                                                            <strong>Time</strong>
                                                            <p>{formatTime(appointment.TimeSlot)}</p>
                                                        </div>
                                                    </div>

                                                    {appointment.QueuePosition && (
                                                        <div className="info-row">
                                                            <span className="info-icon"><BarChart3 size={24} /></span>
                                                            <div>
                                                                <strong>Queue Position</strong>
                                                                <p>#{appointment.QueuePosition}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {appointment.DoctorRemarks && (
                                                        <div className="remarks-section">
                                                            <strong>Doctor's Remarks:</strong>
                                                            <p>{appointment.DoctorRemarks}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {(appointment.Status === 'Scheduled' || appointment.Status === 'Cancelled') && (
                                                    <div className="appointment-actions">
                                                        <button 
                                                            className="btn-queue"
                                                            onClick={() => navigate(`/patient/queue/${appointment.AppointmentID}`)}
                                                        >
                                                            <BarChart size={18} style={{marginRight: '5px'}} /> View Queue Status
                                                        </button>
                                                        <button 
                                                            className="btn-reschedule"
                                                            onClick={() => openRescheduleModal(appointment)}
                                                        >
                                                            <RotateCcw size={18} style={{marginRight: '5px'}} /> Reschedule
                                                        </button>
                                                        <button 
                                                            className="btn-cancel"
                                                            onClick={() => handleCancelAppointment(appointment.AppointmentID)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Cancelled Tab Content */}
                        {activeTab === 'cancelled' && (
                            <div className="appointments-list">
                                {appointments.filter(a => a.Status === 'Cancelled').length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon"><CheckCircle size={60} /></div>
                                        <h3>No Cancelled Appointments</h3>
                                        <p>You haven't cancelled any appointments.</p>
                                    </div>
                                ) : (
                                    appointments.filter(a => a.Status === 'Cancelled').map(appointment => (
                                        <div key={appointment.AppointmentID} className="appointment-card cancelled-card">
                                            <div className="appointment-header-row">
                                                <div className="token-display">
                                                    <span className="token-label">Token</span>
                                                    <span className="token-number">#{appointment.TokenNumber}</span>
                                                </div>
                                                {getStatusBadge(appointment.Status)}
                                            </div>

                                            <div className="appointment-body">
                                                <div className="appointment-info">
                                                    <div className="info-row">
                                                        <span className="info-icon"><User size={24} /></span>
                                                        <div>
                                                            <strong>{appointment.DoctorName}</strong>
                                                            <p>{appointment.Specialization}</p>
                                                        </div>
                                                    </div>

                                                    <div className="info-row">
                                                        <span className="info-icon"><Calendar size={24} /></span>
                                                        <div>
                                                            <strong>Date</strong>
                                                            <p>{formatDate(appointment.AppointmentDate)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="info-row">
                                                        <span className="info-icon"><Clock size={24} /></span>
                                                        <div>
                                                            <strong>Time</strong>
                                                            <p>{formatTime(appointment.TimeSlot)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="appointment-actions">
                                                <button 
                                                    className="btn-reschedule"
                                                    onClick={() => openRescheduleModal(appointment)}
                                                >
                                                    <RotateCcw size={18} style={{marginRight: '5px'}} /> Reschedule Now
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Notifications Tab Content */}
                        {activeTab === 'notifications' && (
                            <div className="appointments-list">
                                {notificationLoading ? (
                                    <div className="loading-state">
                                        <div className="spinner"></div>
                                        <p>Loading notifications...</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon"><Bell size={60} /></div>
                                        <h3>No Notifications</h3>
                                        <p>You have no notifications at this time.</p>
                                    </div>
                                ) : (
                                    <div className="notifications-list">
                                        {notifications.map(notification => (
                                            <div 
                                                key={notification.NotificationID} 
                                                className={`notification-card ${!notification.IsRead ? 'unread' : ''}`}
                                                onClick={() => markNotificationRead(notification.NotificationID)}
                                            >
                                                <div className="notification-card-header">
                                                    <div className="notification-card-title">
                                                        {!notification.IsRead && <span className="unread-indicator"></span>}
                                                        <Bell size={18} />
                                                        {notification.Title}
                                                    </div>
                                                    <span className="notification-time">
                                                        {new Date(notification.CreatedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="notification-card-message">
                                                    {notification.Message}
                                                </div>
                                                {notification.IsRead && (
                                                    <div className="notification-read-label">
                                                        <MailOpen size={14} /> Read
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && rescheduleAppointment && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2><RotateCcw size={24} style={{display: 'inline', marginRight: '10px'}} />Reschedule Appointment</h2>
                            <button className="modal-close" onClick={closeRescheduleModal}><X size={24} /></button>
                        </div>

                        <div className="modal-body">
                            <div className="reschedule-info">
                                <p><strong>Doctor:</strong> {rescheduleAppointment.DoctorName}</p>
                                <p><strong>Current Date:</strong> {formatDate(rescheduleAppointment.AppointmentDate)}</p>
                                <p><strong>Current Time:</strong> {formatTime(rescheduleAppointment.TimeSlot)}</p>
                            </div>

                            {rescheduleError && (
                                <div className="reschedule-error">
                                    <AlertTriangle size={18} style={{marginRight: '6px', verticalAlign: 'middle'}} />
                                    {rescheduleError}
                                </div>
                            )}

                            <div className="reschedule-form">
                                <div className="form-group">
                                    <label>Select New Date:</label>
                                    <input
                                        type="date"
                                        value={newDate}
                                        onChange={handleRescheduleDateChange}
                                        min={getTodayDate()}
                                        className="date-input"
                                    />
                                </div>

                                {newDate && (
                                    <div className="form-group">
                                        <label>Select New Time Slot:</label>
                                        <div className="time-slots-grid">
                                            {timeSlots.map(slot => (
                                                <button
                                                    key={slot.value}
                                                    className={`time-slot ${newTime === slot.value ? 'selected' : ''}`}
                                                    onClick={() => handleRescheduleTimeSelect(slot.value)}
                                                >
                                                    {slot.display}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeRescheduleModal} disabled={rescheduleLoading}>
                                Cancel
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={handleConfirmReschedule}
                                disabled={rescheduleLoading || !newDate || !newTime}
                            >
                                {rescheduleLoading ? 'Rescheduling...' : (
                                    <><RotateCcw size={18} style={{display: 'inline', marginRight: '5px'}} />Confirm Reschedule</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyAppointments;
