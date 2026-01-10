import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'PARTICIPANT'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Inregistrare esuata');
            }

            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center' }}>Inregistrare</h2>
                {error && <div className="error-msg">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nume si Prenume</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label>Parola</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label>Tip Cont</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="PARTICIPANT">Participant</option>
                            <option value="ORGANIZER">Organizator</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Creeaza cont
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '15px' }}>
                    Ai deja cont? <Link to="/login">Autentifica-te</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
