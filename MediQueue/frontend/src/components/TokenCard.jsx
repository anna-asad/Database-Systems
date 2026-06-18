import { useNavigate } from 'react-router-dom';
import { CheckCircle, User, Stethoscope, Calendar, Clock, BarChart3, DollarSign, Printer, AlertCircle, Smartphone } from 'lucide-react';
import './TokenCard.css';

function TokenCard({ appointment, doctor }) {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="token-card-container">
            <div className="token-card">
                <div className="token-header">
                    <h2><CheckCircle size={28} style={{display: 'inline', marginRight: '10px'}} />Appointment Confirmed!</h2>
                    <p>Your token has been generated</p>
                </div>

                <div className="token-number-section">
                    <span className="token-label">YOUR TOKEN NUMBER</span>
                    <div className="token-number">#{appointment.tokenNumber}</div>
                </div>

                <div className="appointment-details">
                    <div className="detail-row">
                        <span className="detail-icon"><User size={24} /></span>
                        <div className="detail-info">
                            <span className="detail-label">Doctor</span>
                            <span className="detail-value">{doctor.FullName}</span>
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="detail-icon"><Stethoscope size={24} /></span>
                        <div className="detail-info">
                            <span className="detail-label">Specialization</span>
                            <span className="detail-value">{doctor.Specialization}</span>
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="detail-icon"><Calendar size={24} /></span>
                        <div className="detail-info">
                            <span className="detail-label">Date</span>
                            <span className="detail-value">{formatDate(appointment.date)}</span>
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="detail-icon"><Clock size={24} /></span>
                        <div className="detail-info">
                            <span className="detail-label">Time</span>
                            <span className="detail-value">{formatTime(appointment.timeSlot)}</span>
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="detail-icon"><BarChart3 size={24} /></span>
                        <div className="detail-info">
                            <span className="detail-label">Queue Position</span>
                            <span className="detail-value">#{appointment.queuePosition}</span>
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="detail-icon"><DollarSign size={24} /></span>
                        <div className="detail-info">
                            <span className="detail-label">Consultation Fee</span>
                            <span className="detail-value">PKR {doctor.ConsultationFee}</span>
                        </div>
                    </div>
                </div>

                <div className="token-actions">
                    <button className="btn-secondary" onClick={handlePrint}>
                        <Printer size={18} style={{marginRight: '5px'}} /> Print Token
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/patient/appointments')}>
                        View My Appointments
                    </button>
                </div>

                <div className="token-footer">
                    <p><AlertCircle size={16} style={{display: 'inline', marginRight: '5px'}} />Please arrive 10 minutes before your scheduled time</p>
                    <p><Smartphone size={16} style={{display: 'inline', marginRight: '5px'}} />You will receive updates about your queue position</p>
                </div>
            </div>
        </div>
    );
}

export default TokenCard;
