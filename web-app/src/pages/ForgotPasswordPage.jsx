import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import api from '../config/api';
import colors from '../theme/colors';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(response.data.message || 'OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, backgroundColor: colors.background }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            Forgot Password
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" />
          <Button fullWidth variant="contained" onClick={handleSubmit} disabled={loading} sx={{ mt: 3 }}>
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>
          <Button fullWidth variant="text" onClick={() => navigate('/')} sx={{ mt: 1 }}>
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ForgotPasswordPage;

