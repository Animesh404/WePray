/* eslint-disable no-useless-catch */
// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check auth status on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await api.get('/auth/me');
                setUser(response.data.data);
                if(response.data.data.role !== 'admin'){
                    const subscriptionResponse = await api.get('/subscription/status');
                    const subscriptionStatus = subscriptionResponse.data.subscription.status;
                    if (subscriptionStatus === 'active') {
                        setIsSubscribed(true);
                    }
                }
                // console.log(subscriptionStatus);
                // setIsSubscribed(subscriptionStatus);
            }
        } catch (error) {
            console.log(error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            const returnUrl = localStorage.getItem("returnTo") || "/dashboard";
            if(user.role !== 'admin'){
                const subscriptionResponse = await api.get('/subscription/status');
                const subscriptionStatus = subscriptionResponse.data.subscription.status;
                if (subscriptionStatus === 'active') {
                    setIsSubscribed(true);
                }
            }
                
            
      localStorage.removeItem("returnTo");
      navigate(returnUrl)
            return true;
        } catch (error) {
            throw error;
        }
    };

    const loginWithGoogle = async (token) => {
        try {
            console.log('LoginWithGoogle called with token:', token);

            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Fetch user data using the token
            const response = await api.get('/auth/me');
            const userData = response.data.data;
            console.log('User data from API:', userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            if(userData.role !== 'admin'){
                const subscriptionResponse = await api.get('/subscription/status');
                const subscriptionStatus = subscriptionResponse.data.subscription.status;
                if (subscriptionStatus === 'active') {
                    setIsSubscribed(true);
                }
            }
            
            

            return true;
        } catch (error) {
            console.error('Google login error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        navigate('/login');
        setIsSubscribed(false);
    };

    useEffect(() => {
        // Handle Google login callback
        const handleGoogleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const googleToken = urlParams.get('token');
            if (googleToken) {
                try {
                    await loginWithGoogle(googleToken);
                    navigate('/dashboard'); // Redirect after successful login
                } catch (error) {
                    console.error('Error handling Google login callback:', error);
                }
            }
        };
    
        handleGoogleCallback();
    }, [navigate]);

    return (
        <AuthContext.Provider value={{ user, isSubscribed, loading, login, loginWithGoogle, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useAuth = () => useContext(AuthContext);