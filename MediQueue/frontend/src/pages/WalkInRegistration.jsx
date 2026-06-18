import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { UserPlus, Search, User, Stethoscope, Calendar, DollarSign, CheckCircle, Printer, Plus, X, AlertTriangle } from 'lucide-react';
import './WalkInRegistration.css';

function WalkInRegistration() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('cnic'); // 'cnic' or 'name'
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tokenInfo, setTokenInfo] = useState(null);

    useEffect(() => {
        generateTimeSlots(); // Generate time slots on component mount
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await API.get('/doctors');
            setDoctors(response.data.filter(d => d.IsAvailable));
        } catch (err) {
            setError('Failed to load doctors.');
        }
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

    // Helper to format time for display
    const formatTimeDisplay = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setError('Please enter a search term.');
            return;
        }

        setLoading(true);
        setError('');
        setPatients([]);
        setSelectedPatient(null);

        try {
            // Search patients by CNIC or name
            const response = await API.get('/admin/patients');
            const allPatients = response.data;

            const filtered = allPatients.filter(p => {
                if (searchType === 'cnic') {
                    // Normalize by stripping non-digits to allow flexible searching
                    const searchDigits = searchTerm.replace(/\D/g, '');
                    const patientDigits = (p.CNIC || '').replace(/\D/g, '');
                    return patientDigits.includes(searchDigits);
                } else {
                    return p.FullName && p.FullName.toLowerCase().includes(searchTerm.toLowerCase());
                }
            });

            if (filtered.length === 0) {
                setError('No patients found matching your search.');
            } else {
                setPatients(filtered);
            }
        } catch (err) {
            setError('Failed to search patients.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setError('');
        setSelectedDoctor(null); // Reset doctor selection when patient changes
    };

    const handleCreateWalkIn = async () => {
        if (!selectedPatient) {
            setError('Please select a patient.');
            return;
        }

        if (!selectedDoctor) {
            setError('Please select a doctor.');
            return;
        }

        if (!selectedDoctor.selectedTime) { // Ensure a time slot is selected
            setError('Please select a time slot for the walk-in.');
            return;
        }

        if (selectedPatient.IsBlacklisted) {
            setError('This patient is blacklisted and cannot be registered for walk-in.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await API.post('/appointments/walkin', {
                patientID: selectedPatient.PatientID,
                doctorID: selectedDoctor.DoctorID,
                timeSlot: selectedDoctor.selectedTime // Use the selected time
            });

            setTokenInfo({
                tokenNumber: response.data.tokenNumber,
                queuePosition: response.data.queuePosition,
                patientName: selectedPatient.FullName,
                doctorName: selectedDoctor.FullName
            });

            setSuccess('Walk-in appointment created successfully!');
            
            // Reset form after 3 seconds
            setTimeout(() => {
                setSearchTerm('');
                setPatients([]);
                setSelectedPatient(null);
                setSelectedDoctor(null);
                setSelectedDoctor(prev => ({ ...prev, selectedTime: '' })); // Clear selected time
                setSuccess('');
                setTokenInfo(null);
            }, 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create walk-in appointment.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintToken = () => {
        window.print();
    };

    if (tokenInfo) {
        return (
            <div className="walkin-container">
                <div className="walkin-box">
                    <div className="success-screen">
                        <div className="success-icon"><CheckCircle size={60} /></div>
                        <h2 style={{ color: '#2c3e50' }}>Walk-In Registered Successfully!</h2>
                        
                        <div className="token-display">
                            <span className="token-label" style={{ color: '#555' }}>TOKEN NUMBER</span>
                            <div className="token-number" style={{ color: '#2c3e50' }}>#{tokenInfo.tokenNumber}</div>
                            <span className="queue-label" style={{ color: '#666' }}>Queue Position: #{tokenInfo.queuePosition}</span>
                        </div>

                        <div className="patient-info">
                            <p><strong>Patient:</strong> {tokenInfo.patientName}</p>
                            <p><strong>Doctor:</strong> {tokenInfo.doctorName}</p>
                            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                        </div>

                        <div className="success-actions">
                            <button className="btn-print" onClick={handlePrintToken}>
                                <Printer size={18} style={{marginRight: '5px'}} /> Print Token
                            </button>
                            <button className="btn-new" onClick={() => setTokenInfo(null)}>
                                <Plus size={18} style={{marginRight: '5px'}} /> Register Another Walk-In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="walkin-container">
            <div className="walkin-box">
                <div className="walkin-header">
                    <h1 style={{ color: '#333' }}><UserPlus size={32} style={{display: 'inline', marginRight: '10px'}} />Walk-In Registration</h1>
                    <p style={{ color: '#666' }}>Register patients who arrive without appointment</p>
                </div>

                {error && <div className="error-message"><X size={18} /> {error}</div>}
                {success && <div className="success-message"><CheckCircle size={18} /> {success}</div>}

                {/* Step 1: Search Patient */}
                <div className="walkin-section">
                    <h3 style={{ color: '#444' }}>Step 1: Search Patient</h3>
                    
                    <div className="search-controls">
                        <div className="search-type">
                            <label style={{ color: '#333' }}>
                                <input
                                    type="radio"
                                    value="cnic"
                                    checked={searchType === 'cnic'}
                                    onChange={(e) => setSearchType(e.target.value)}
                                />
                                Search by CNIC
                            </label>
                            <label style={{ color: '#333' }}>
                                <input
                                    type="radio"
                                    value="name"
                                    checked={searchType === 'name'}
                                    onChange={(e) => setSearchType(e.target.value)}
                                />
                                Search by Name
                            </label>
                        </div>

                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder={searchType === 'cnic' ? 'Enter CNIC (e.g., 12345-1234567-1)' : 'Enter patient name'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button onClick={handleSearch} disabled={loading}>
                                {loading ? 'Searching...' : <><Search size={18} style={{marginRight: '5px'}} />Search</>}
                            </button>
                        </div>
                    </div>

                    {patients.length > 0 && (
                        <div className="patients-list">
                            <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>Search Results:</h4>
                            {patients.map(patient => (
                                <div
                                    key={patient.PatientID}
                                    className={`patient-card ${selectedPatient?.PatientID === patient.PatientID ? 'selected' : ''} ${patient.IsBlacklisted ? 'blacklisted' : ''}`}
                                    onClick={() => !patient.IsBlacklisted && handleSelectPatient(patient)}
                                >
                                    <div className="patient-info-card">
                                        <h4 style={{ color: '#2c3e50' }}>{patient.FullName}</h4>
                                        <p style={{ color: '#555' }}>CNIC: {patient.CNIC}</p>
                                        <p style={{ color: '#555' }}>Contact: {patient.ContactNumber}</p>
                                        <div className="patient-stats">
                                            <span style={{ color: '#777' }}>Total Visits: {patient.TotalVisits}</span>
                                            <span style={{ color: '#777' }}>Missed: {patient.MissedVisits}</span>
                                            {patient.IsBlacklisted && (
                                                <span className="blacklist-badge"><AlertTriangle size={14} /> BLACKLISTED</span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedPatient?.PatientID === patient.PatientID && (
                                        <div className="selected-badge"><CheckCircle size={16} /></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Step 2: Select Doctor */}
                {selectedPatient && (
                    <div className="walkin-section">
                        <h3 style={{ color: '#444' }}>Step 2: Select Doctor</h3>
                        
                        <div className="doctors-grid">
                            {doctors.map(doctor => (
                                <div
                                    key={doctor.DoctorID}
                                    className={`doctor-card-small ${selectedDoctor?.DoctorID === doctor.DoctorID ? 'selected' : ''}`}
                                    onClick={() => setSelectedDoctor(doctor)}
                                >
                                    <div className="doctor-icon"><Stethoscope size={24} /></div>
                                    <div style={{ color: '#333' }}>
                                        <strong>{doctor.FullName}</strong>
                                        <p>{doctor.Specialization}</p>
                                        <span className="fee">PKR {doctor.ConsultationFee}</span>
                                    </div>
                                    {selectedDoctor?.DoctorID === doctor.DoctorID && (
                                        <div className="selected-badge"><CheckCircle size={16} /></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2.5: Select Time Slot for Doctor */}
                {selectedPatient && selectedDoctor && (
                    <div className="walkin-section">
                        <h3 style={{ color: '#444' }}>Step 2.5: Select Time Slot</h3>
                        <div className="time-selection">
                            <label style={{ color: '#333' }}>Available Time Slots:</label>
                            <div className="time-slots-grid">
                                {timeSlots.map(slot => (
                                    <button
                                        key={slot.value}
                                        className={`time-slot ${selectedDoctor.selectedTime === slot.value ? 'selected' : ''}`}
                                        onClick={() => setSelectedDoctor(prev => ({ ...prev, selectedTime: slot.value }))}
                                    >
                                        {slot.display}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirm */}
                {selectedPatient && selectedDoctor && selectedDoctor.selectedTime && (
                    <div className="walkin-section">
                        <h3 style={{ color: '#444' }}>Step 3: Confirm Walk-In</h3>
                        
                        <div className="confirmation-summary">
                            <div className="summary-item" style={{ color: '#333' }}>
                                <strong>Patient:</strong> {selectedPatient.FullName}
                            </div>
                            <div className="summary-item" style={{ color: '#333' }}>
                                <strong>Doctor:</strong> {selectedDoctor.FullName} ({selectedDoctor.Specialization})
                            </div>
                            <div className="summary-item" style={{ color: '#333' }}>
                                <strong>Date:</strong> {new Date().toLocaleDateString()}
                            </div>
                            <div className="summary-item" style={{ color: '#333' }}>
                                <strong>Time:</strong> {formatTimeDisplay(selectedDoctor.selectedTime)}
                            </div>
                            <div className="summary-item" style={{ color: '#333' }}>
                                <strong>Fee:</strong> PKR {selectedDoctor.ConsultationFee}
                            </div>
                        </div>

                        <button
                            className="btn-confirm"
                            onClick={handleCreateWalkIn}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : <><CheckCircle size={18} style={{display: 'inline', marginRight: '5px'}} />Confirm Walk-In Registration</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WalkInRegistration;
