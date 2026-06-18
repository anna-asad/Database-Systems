import { useState, useEffect } from 'react';
import API from '../api/axios';
import { AlertTriangle, UserX, CheckCircle, User, Phone, CreditCard, X } from 'lucide-react';
import './AdminDashboard.css';

function AdminBlacklist() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchBlacklist();
    }, []);

    const fetchBlacklist = async () => {
        try {
            setLoading(true);
            const response = await API.get('/admin/blacklist');
            setPatients(response.data);
        } catch (err) {
            setError('Failed to load blacklisted patients.');
        } finally {
            setLoading(false);
        }
    };

    const removeBlacklist = async (patientId, patientName) => {
        if (!window.confirm(`Remove blacklist for ${patientName}? They will be able to book appointments again.`)) return;

        try {
            await API.put(`/admin/blacklist/${patientId}/remove`);
            setSuccessMsg(`${patientName} has been removed from blacklist.`);
            fetchBlacklist();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError('Failed to remove blacklist.');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading blacklisted patients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-box">

                {/* Header */}
                <div className="admin-header">
                    <div>
                        <h1>
                            <AlertTriangle size={32} style={{ display: 'inline', marginRight: '10px', color: '#dc3545' }} />
                            Blacklisted Patients
                        </h1>
                        <p>Patients are auto-blacklisted after missing more than 3 appointments</p>
                    </div>
                </div>

                {/* Success Message */}
                {successMsg && (
                    <div style={{
                        background: '#d4edda', border: '1px solid #28a745',
                        borderRadius: '10px', padding: '12px 20px',
                        marginBottom: '20px', display: 'flex',
                        alignItems: 'center', gap: '10px', color: '#155724'
                    }}>
                        <CheckCircle size={20} /> {successMsg}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#f8d7da', border: '1px solid #dc3545',
                        borderRadius: '10px', padding: '12px 20px',
                        marginBottom: '20px', display: 'flex',
                        alignItems: 'center', gap: '10px', color: '#721c24'
                    }}>
                        <X size={20} /> {error}
                    </div>
                )}

                {/* Empty State */}
                {patients.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><CheckCircle size={80} color="#28a745" /></div>
                        <h3>No Blacklisted Patients</h3>
                        <p>All patients are in good standing.</p>
                    </div>
                ) : (
                    <>
                        {/* Count Badge */}
                        <div style={{
                            background: '#f8d7da', borderRadius: '10px',
                            padding: '12px 20px', marginBottom: '20px',
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <AlertTriangle size={20} color="#dc3545" />
                            <span style={{ color: '#721c24', fontWeight: 'bold' }}>
                                {patients.length} patient{patients.length > 1 ? 's' : ''} currently blacklisted
                            </span>
                        </div>

                        {/* Patient Cards */}
                        <div className="appointments-list">
                            {patients.map((patient) => (
                                <div key={patient.PatientID} className="appointment-card" style={{ borderLeft: '4px solid #dc3545' }}>
                                    <div className="appointment-body">
                                        <div className="appointment-info">

                                            <div className="info-row">
                                                <span className="info-icon"><User size={24} /></span>
                                                <div>
                                                    <strong>{patient.FullName}</strong>
                                                    <p>Patient ID: #{patient.PatientID}</p>
                                                </div>
                                            </div>

                                            <div className="info-row">
                                                <span className="info-icon"><CreditCard size={24} /></span>
                                                <div>
                                                    <strong>CNIC</strong>
                                                    <p>{patient.CNIC}</p>
                                                </div>
                                            </div>

                                            <div className="info-row">
                                                <span className="info-icon"><Phone size={24} /></span>
                                                <div>
                                                    <strong>Contact</strong>
                                                    <p>{patient.ContactNumber || '—'}</p>
                                                </div>
                                            </div>

                                            {/* Visit Stats */}
                                            <div style={{
                                                display: 'flex', gap: '15px',
                                                marginTop: '10px', flexWrap: 'wrap'
                                            }}>
                                                <div style={{ background: '#e8f4fd', borderRadius: '8px', padding: '8px 15px', textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#2c7be5' }}>{patient.TotalVisits}</div>
                                                    <div style={{ fontSize: '0.8em', color: '#666' }}>Total</div>
                                                </div>
                                                <div style={{ background: '#d4edda', borderRadius: '8px', padding: '8px 15px', textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#28a745' }}>{patient.SuccessfulVisits}</div>
                                                    <div style={{ fontSize: '0.8em', color: '#666' }}>Successful</div>
                                                </div>
                                                <div style={{ background: '#f8d7da', borderRadius: '8px', padding: '8px 15px', textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#dc3545' }}>{patient.MissedVisits}</div>
                                                    <div style={{ fontSize: '0.8em', color: '#666' }}>Missed</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <div className="appointment-actions">
                                            <button
                                                onClick={() => removeBlacklist(patient.PatientID, patient.FullName)}
                                                style={{
                                                    background: '#28a745', color: 'white',
                                                    border: 'none', padding: '10px 20px',
                                                    borderRadius: '8px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    fontSize: '0.95em', fontWeight: 'bold'
                                                }}
                                            >
                                                <CheckCircle size={18} /> Remove Blacklist
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminBlacklist;