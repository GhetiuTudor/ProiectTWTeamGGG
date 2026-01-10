import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Autentificare esuata');
            }

            login(data);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center' }}>Autentificare</h2>
                {error && <div className="error-msg">{error}</div>}
                <form onSubmit={handleSubmit}>
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
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Intra in cont
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '15px' }}>
                    Nu ai cont? <Link to="/register">Inregistreaza-te</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
