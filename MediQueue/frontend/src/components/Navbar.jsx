import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, FileText, User, LogOut, Menu, X, LayoutDashboard, CreditCard, AlertTriangle } from 'lucide-react';
import logo from '../assets/logo.png';
import './Navbar.css';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setSidebarOpen(false);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <>
            <nav>
                <div className="nav-left">
                    {user && (
                        <button className="menu-toggle" onClick={toggleSidebar}>
                            <Menu size={24} />
                        </button>
                    )}
                    <Link to="/" className="nav-logo">
                        <img src={logo} alt="MediQueue" className="nav-logo-img" />
                        <span>MediQueue</span>
                    </Link>
                </div>

                <div className="nav-links">
                    {!user ? (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="nav-link">Register</Link>
                        </>
                    ) : (
                        <>
                            <Link 
                                to={
                                    user.RoleName === 'Patient' ? '/patient/profile' :
                                    user.RoleName === 'Doctor' ? '/doctor/profile' :
                                    '/admin/profile'
                                }
                                className="profile-link"
                            >
                                <User size={18} /> {user.FullName || user.Email}
                            </Link>
                            <button onClick={handleLogout} className="logout-btn">
                                <LogOut size={18} /> Logout
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Sidebar */}
            {user && (
                <>
                    <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
                    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                        <div className="sidebar-header">
                            <h3>Menu</h3>
                            <button className="close-sidebar" onClick={closeSidebar}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="sidebar-content">
                            <Link 
                                to={
                                    user.RoleName === 'Patient' ? '/patient/dashboard' :
                                    user.RoleName === 'Doctor' ? '/doctor/dashboard' :
                                    '/admin/dashboard'
                                }
                                className="sidebar-link"
                                onClick={closeSidebar}
                            >
                                <LayoutDashboard size={20} />
                                <span>Dashboard</span>
                            </Link>
                            
                            {user.RoleName === 'Patient' && (
                                <>
                                    <Link to="/patient/book" className="sidebar-link" onClick={closeSidebar}>
                                        <Calendar size={20} />
                                        <span>Book Appointment</span>
                                    </Link>
                                    <Link to="/patient/appointments" className="sidebar-link" onClick={closeSidebar}>
                                        <FileText size={20} />
                                        <span>My Appointments</span>
                                    </Link>
                                    <Link to="/patient/bills" className="sidebar-link" onClick={closeSidebar}>
                                        <CreditCard size={20} />
                                        <span>My Bills</span>
                                    </Link>
                                    <Link to="/patient/profile" className="sidebar-link" onClick={closeSidebar}>
                                        <User size={20} />
                                        <span>Profile</span>
                                    </Link>
                                </>
                            )}

                            {user.RoleName === 'Doctor' && (
                                <>
                                    <Link to="/doctor/profile" className="sidebar-link" onClick={closeSidebar}>
                                        <User size={20} />
                                        <span>Profile</span>
                                    </Link>
                                </>
                            )}

                            {(user.RoleName === 'Admin' || user.RoleName === 'Reception') && (
                                <>
                                    <Link to="/admin/blacklist" className="sidebar-link" onClick={closeSidebar}>
                                        <AlertTriangle size={20} />
                                        <span>Blacklist</span>
                                    </Link>
                                    <Link to="/admin/profile" className="sidebar-link" onClick={closeSidebar}>
                                        <User size={20} />
                                        <span>Profile</span>
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="sidebar-footer">
                            <button onClick={handleLogout} className="sidebar-logout">
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default Navbar;
