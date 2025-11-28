import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';
import colors from '../theme/colors';

function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminSignIn = async () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/admin/signin', {
        email: email.toLowerCase().trim(),
        password,
      });

      if (response.data.token && response.data.user) {
        await login(response.data.token, response.data.user);
        navigate('/admin/dashboard');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Admin sign in failed. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, backgroundColor: colors.background }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
            Admin Login
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" />
          <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" />
          <Button fullWidth variant="contained" onClick={handleAdminSignIn} disabled={loading} sx={{ mt: 3 }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <Button fullWidth variant="text" onClick={() => navigate('/')} sx={{ mt: 1 }}>
            Back to User Login
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminLoginPage;

