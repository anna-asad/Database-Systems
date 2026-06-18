import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import DoctorCard from '../components/DoctorCard';
import TokenCard from '../components/TokenCard';
import { Calendar, Clock, CheckCircle, ArrowRight, ArrowLeft, X, Stethoscope, Building2, DollarSign, AlertTriangle, Smartphone } from 'lucide-react';
import './BookAppointment.css';

function BookAppointment() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Select Doctor, 2: Select Date/Time, 3: Confirm, 4: Success
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appointment, setAppointment] = useState(null);
    const [filterSpecialization, setFilterSpecialization] = useState('');

    const specializations = [
        'All Specializations',
        'General Practitioner',
        'Cardiologist',
        'Dermatologist',
        'Neurologist',
        'Pediatrician',
        'Orthopedic',
        'Gynecologist',
        'ENT Specialist',
        'Psychiatrist',
        'Dentist'
    ];

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const response = await API.get('/doctors');
            setDoctors(response.data);
        } catch (err) {
            setError('Failed to load doctors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDoctorSelect = (doctor) => {
        setSelectedDoctor(doctor);
        setError('');
    };

    const handleNextToDateTime = () => {
        if (!selectedDoctor) {
            setError('Please select a doctor first.');
            return;
        }
        setStep(2);
        generateTimeSlots();
    };

    const generateTimeSlots = () => {
        // Generate time slots from 9 AM to 5 PM in 30-minute intervals
        const slots = [];
        for (let hour = 9; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 17 && minute > 0) break; // Stop at 5:00 PM
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

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
        setSelectedTime(''); // Reset time when date changes
        setError('');
    };

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        setError('');
    };

    const isTimeSlotPast = (timeSlot) => {
        if (!selectedDate) return false;
        
        const selectedDateObj = new Date(selectedDate);
        const today = new Date();
        
        // Reset time parts for date comparison
        selectedDateObj.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        // If selected date is in the future, no slots are past
        if (selectedDateObj > today) return false;
        
        // If selected date is today, check the time
        if (selectedDateObj.getTime() === today.getTime()) {
            const now = new Date();
            const [hours, minutes] = timeSlot.split(':');
            const slotTime = new Date();
            slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Return true if slot time is in the past
            return slotTime <= now;
        }
        
        return false;
    };

    const handleNextToConfirm = () => {
        if (!selectedDate) {
            setError('Please select a date.');
            return;
        }
        if (!selectedTime) {
            setError('Please select a time slot.');
            return;
        }
        setStep(3);
    };

    const handleBookAppointment = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await API.post('/appointments', {
                doctorID: selectedDoctor.DoctorID,
                appointmentDate: selectedDate,
                timeSlot: selectedTime
            });

            setAppointment({
                appointmentID: response.data.appointmentID,
                tokenNumber: response.data.tokenNumber,
                queuePosition: response.data.queuePosition,
                date: selectedDate,
                timeSlot: selectedTime
            });

            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setError('');
        if (step === 2) {
            setSelectedDate('');
            setSelectedTime('');
        }
        setStep(step - 1);
    };

    const filteredDoctors = filterSpecialization && filterSpecialization !== 'All Specializations'
        ? doctors.filter(d => d.Specialization === filterSpecialization)
        : doctors;

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Step 4: Success - Show Token Card
    if (step === 4 && appointment) {
        return <TokenCard appointment={appointment} doctor={selectedDoctor} />;
    }

    return (
        <div className="book-appointment-container">
            <div className="book-appointment-box">
                {/* Header */}
                <div className="booking-header">
                    <h1><Calendar size={32} style={{display: 'inline', marginRight: '10px', color: '#1a1a1a'}} />Book Appointment</h1>
                    <p>Schedule your consultation in 3 easy steps</p>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                        <div className="step-number">1</div>
                        <span>Select Doctor</span>
                    </div>
                    <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <span>Date & Time</span>
                    </div>
                    <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
                    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                        <div className="step-number">3</div>
                        <span>Confirm</span>
                    </div>
                </div>

                {error && <div className="error-message"><X size={18} /> {error}</div>}

                {/* Step 1: Select Doctor */}
                {step === 1 && (
                    <div className="step-content">
                        <div className="filter-section">
                            <label>Filter by Specialization:</label>
                            <select 
                                value={filterSpecialization} 
                                onChange={(e) => setFilterSpecialization(e.target.value)}
                                className="filter-select"
                            >
                                {specializations.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                        </div>

                        <div className="doctors-grid">
                            {loading ? (
                                <div className="loading">Loading doctors...</div>
                            ) : filteredDoctors.length === 0 ? (
                                <div className="no-data">No doctors available for this specialization.</div>
                            ) : (
                                filteredDoctors.map(doctor => (
                                    <DoctorCard
                                        key={doctor.DoctorID}
                                        doctor={doctor}
                                        onSelect={handleDoctorSelect}
                                        isSelected={selectedDoctor?.DoctorID === doctor.DoctorID}
                                    />
                                ))
                            )}
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>
                                Cancel
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={handleNextToDateTime}
                                disabled={!selectedDoctor}
                            >
                                Next: Select Date & Time <ArrowRight size={18} style={{display: 'inline', marginLeft: '5px'}} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Select Date & Time */}
                {step === 2 && (
                    <div className="step-content">
                        <div className="selected-doctor-summary">
                            <h3>Selected Doctor</h3>
                            <div className="doctor-summary-card">
                                <span className="doctor-icon"><Stethoscope size={24} /></span>
                                <div>
                                    <strong>{selectedDoctor.FullName}</strong>
                                    <p>{selectedDoctor.Specialization}</p>
                                </div>
                            </div>
                        </div>

                        <div className="datetime-section">
                            <div className="date-selection">
                                <label>Select Date:</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    min={getTodayDate()}
                                    className="date-input"
                                />
                            </div>

                            {selectedDate && (
                                <div className="time-selection">
                                    <label>Select Time Slot:</label>
                                    <div className="time-slots-grid">
                                        {timeSlots.map(slot => {
                                            const isPast = isTimeSlotPast(slot.value);
                                            return (
                                                <button
                                                    key={slot.value}
                                                    className={`time-slot ${selectedTime === slot.value ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}
                                                    onClick={() => !isPast && handleTimeSelect(slot.value)}
                                                    disabled={isPast}
                                                    title={isPast ? 'This time slot has passed' : ''}
                                                >
                                                    {slot.display}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={handleBack}>
                                <ArrowLeft size={18} style={{display: 'inline', marginRight: '5px'}} /> Back
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={handleNextToConfirm}
                                disabled={!selectedDate || !selectedTime}
                            >
                                Next: Confirm Booking <ArrowRight size={18} style={{display: 'inline', marginLeft: '5px'}} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <div className="step-content">
                        <div className="confirmation-section">
                            <h3><CheckCircle size={24} style={{display: 'inline', marginRight: '10px'}} />Confirm Your Appointment</h3>
                            
                            <div className="confirmation-details">
                                <div className="confirm-row">
                                    <span className="confirm-icon"><Stethoscope size={20} /></span>
                                    <div>
                                        <strong>Doctor</strong>
                                        <p>{selectedDoctor.FullName}</p>
                                    </div>
                                </div>

                                <div className="confirm-row">
                                    <span className="confirm-icon"><Building2 size={20} /></span>
                                    <div>
                                        <strong>Specialization</strong>
                                        <p>{selectedDoctor.Specialization}</p>
                                    </div>
                                </div>

                                <div className="confirm-row">
                                    <span className="confirm-icon"><Calendar size={20} /></span>
                                    <div>
                                        <strong>Date</strong>
                                        <p>{new Date(selectedDate).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}</p>
                                    </div>
                                </div>

                                <div className="confirm-row">
                                    <span className="confirm-icon"><Clock size={20} /></span>
                                    <div>
                                        <strong>Time</strong>
                                        <p>{formatTimeDisplay(selectedTime)}</p>
                                    </div>
                                </div>

                                <div className="confirm-row fee-row">
                                    <span className="confirm-icon"><DollarSign size={20} /></span>
                                    <div>
                                        <strong>Consultation Fee</strong>
                                        <p className="fee-amount">PKR {selectedDoctor.ConsultationFee}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="confirmation-note">
                                <p><AlertTriangle size={16} style={{display: 'inline', marginRight: '6px', verticalAlign: 'middle'}} /> Please arrive 10 minutes before your scheduled time.</p>
                                <p><Smartphone size={16} style={{display: 'inline', marginRight: '6px', verticalAlign: 'middle'}} /> You will receive a token number after confirmation.</p>
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={handleBack} disabled={loading}>
                                <ArrowLeft size={18} style={{display: 'inline', marginRight: '5px'}} /> Back
                            </button>
                            <button 
                                className="btn-primary btn-confirm" 
                                onClick={handleBookAppointment}
                                disabled={loading}
                            >
                                {loading ? 'Booking...' : <><CheckCircle size={18} style={{display: 'inline', marginRight: '5px'}} />Confirm Appointment</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookAppointment;
