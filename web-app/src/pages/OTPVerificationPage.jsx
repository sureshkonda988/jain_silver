import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import api from '../config/api';
import colors from '../theme/colors';

function OTPVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, demoOTP } = location.state || {};
  const [otp, setOtp] = useState(demoOTP || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-otp', { userId, otp });
      if (response.data.message) {
        alert('OTP verified successfully. Your account is pending admin approval.');
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, backgroundColor: colors.background }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            Verify OTP
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} margin="normal" />
          <Button fullWidth variant="contained" onClick={handleVerifyOTP} disabled={loading} sx={{ mt: 3 }}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default OTPVerificationPage;

