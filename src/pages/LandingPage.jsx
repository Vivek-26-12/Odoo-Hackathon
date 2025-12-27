import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #4F46E5 0%, #0EA5E9 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: '800' }}>GearGuard</h1>
            <p style={{ fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '600px', opacity: 0.9 }}>
                The Ultimate Maintenance Tracker. Seamlessly connect Equipment, Teams, and Requests.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#4F46E5',
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                >
                    Login
                </button>
                <button
                    onClick={() => navigate('/signup')}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'white',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '2px solid white',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    Sign Up
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
