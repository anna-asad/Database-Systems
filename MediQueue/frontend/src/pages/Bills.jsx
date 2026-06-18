import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AlertTriangle } from 'lucide-react';

function FeeSlip() {
    const { billId } = useParams();
    const navigate = useNavigate();
    const [slip, setSlip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSlip();
    }, [billId]);

    const fetchSlip = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/billing/${billId}`);
            setSlip(response.data);
        } catch (err) {
            setError('Failed to load fee slip.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
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

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>Loading fee slip...</p>
            </div>
        );
    }

    if (error || !slip) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', color: '#dc3545' }}>
                <AlertTriangle size={40} />
                <p>{error || 'Fee slip not found.'}</p>
                <button onClick={() => navigate('/patient/bills')}>Go Back</button>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh', background: '#f5f5f5',
            display: 'flex', justifyContent: 'center',
            alignItems: 'flex-start', padding: '40px 20px'
        }}>
            <div style={{
                background: 'white', maxWidth: '550px', width: '100%',
                padding: '40px', border: '2px solid #333', borderRadius: '4px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>

                {/* Clinic Header */}
                <div style={{ textAlign: 'center', borderBottom: '3px double #333', paddingBottom: '20px', marginBottom: '25px' }}>
                    <h1 style={{ margin: 0, color: '#2c7be5', fontSize: '2em' }}>🏥 MediQueue</h1>
                    <p style={{ margin: '5px 0', color: '#555' }}>Official Consultation Fee Slip</p>
                    <p style={{ margin: '5px 0', color: '#888', fontSize: '0.9em' }}>Slip #{slip.BillID}</p>
                </div>

                {/* Patient & Doctor Info */}
                {[
                    { label: 'Patient Name', value: slip.PatientName },
                    { label: 'CNIC', value: slip.CNIC },
                    { label: 'Doctor', value: `Dr. ${slip.DoctorName}` },
                    { label: 'Specialization', value: slip.Specialization },
                    { label: 'Appointment Date', value: formatDate(slip.AppointmentDate) },
                    { label: 'Time Slot', value: formatTime(slip.TimeSlot) },
                    { label: 'Token Number', value: `#${slip.TokenNumber}` },
                ].map((row) => (
                    <div key={row.label} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '8px 0', borderBottom: '1px dotted #ccc'
                    }}>
                        <span style={{ color: '#666' }}>{row.label}</span>
                        <span style={{ fontWeight: 'bold' }}>{row.value}</span>
                    </div>
                ))}

                {/* Total Amount */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '1.3em', fontWeight: 'bold',
                    background: '#f0f8ff', padding: '12px',
                    marginTop: '15px', borderRadius: '6px'
                }}>
                    <span>Consultation Fee</span>
                    <span style={{ color: '#2c7be5' }}>Rs. {Number(slip.Amount).toLocaleString()}</span>
                </div>

                {/* Payment Status */}
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    {slip.PaymentStatus === 'Paid' ? (
                        <>
                            <div style={{
                                color: 'green', fontSize: '1.5em', fontWeight: 'bold',
                                border: '3px solid green', display: 'inline-block',
                                padding: '5px 25px', transform: 'rotate(-10deg)'
                            }}>
                                ✔ PAID
                            </div>
                            <p style={{ marginTop: '10px', color: '#666', fontSize: '0.9em' }}>
                                Paid on: {formatDate(slip.PaymentDate)}
                            </p>
                        </>
                    ) : (
                        <div style={{ color: 'orange', fontSize: '1.3em', fontWeight: 'bold' }}>
                            ⏳ PAYMENT PENDING
                        </div>
                    )}
                </div>

                {/* Buttons - hidden when printing */}
                <div className="no-print" style={{
                    display: 'flex', gap: '10px',
                    justifyContent: 'center', marginTop: '25px'
                }}>
                    <button
                        onClick={() => window.print()}
                        style={{
                            background: '#2c7be5', color: 'white', border: 'none',
                            padding: '12px 25px', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '1em', fontWeight: 'bold'
                        }}
                    >
                        🖨️ Print Slip
                    </button>
                    <button
                        onClick={() => navigate('/patient/bills')}
                        style={{
                            background: '#6c757d', color: 'white', border: 'none',
                            padding: '12px 25px', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '1em'
                        }}
                    >
                        ← Go Back
                    </button>
                </div>

            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
}

export default FeeSlip;