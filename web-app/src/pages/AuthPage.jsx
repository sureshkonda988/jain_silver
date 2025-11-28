import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Email, Phone, Lock } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';
import colors from '../theme/colors';

function AuthPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usePhone, setUsePhone] = useState(false);

  const handleSignIn = async () => {
    if ((!email && !phone) || !password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build request body - only include defined fields
      const signinData = { password };
      if (usePhone) {
        signinData.phone = phone.trim();
      } else {
        signinData.email = email.toLowerCase().trim();
      }
      
      const response = await api.post('/auth/signin', signinData);

      if (response.data.token && response.data.user) {
        await login(response.data.token, response.data.user);
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.message ||
        'Sign in failed. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar
              src="/jain_logo.png"
              alt="Jain Silver Plaza"
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary }}>
              Sign In
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 1 }}>
              Sign in to continue
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <ToggleButtonGroup
            value={usePhone ? 'phone' : 'email'}
            exclusive
            onChange={(e, value) => setUsePhone(value === 'phone')}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="email">Email</ToggleButton>
            <ToggleButton value="phone">Phone</ToggleButton>
          </ToggleButtonGroup>

          {usePhone ? (
            <TextField
              fullWidth
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              margin="normal"
              InputProps={{
                startAdornment: <Phone sx={{ mr: 1, color: colors.textHint }} />,
              }}
            />
          ) : (
            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              margin="normal"
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, color: colors.textHint }} />,
              }}
            />
          )}

          <TextField
            fullWidth
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            margin="normal"
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: colors.textHint }} />,
            }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleSignIn}
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              backgroundColor: colors.primary,
              '&:hover': { backgroundColor: colors.primaryDark },
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="text"
              onClick={() => navigate('/forgot-password')}
              sx={{ color: colors.primary }}
            >
              Forgot Password?
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/register')}
              sx={{ color: colors.primary }}
            >
              New User? Register Here
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/admin/login')}
              sx={{ color: colors.primary }}
            >
              Admin Login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AuthPage;

