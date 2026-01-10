import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for token on mount
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const name = localStorage.getItem('name');

        if (token && role) {
            setUser({ token, role, name });
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('name', userData.name);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        setUser(null);
    };

    // Helper for authenticated fetch
    const authFetch = async (url, options = {}) => {
        const headers = options.headers || {};
        if (user?.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
        }

        // Default to JSON content type if body is present and not FormData
        if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            // logout(); // Optional: auto-logout
        }

        return response;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, authFetch }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
