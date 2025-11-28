import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Divider, Chip, Alert } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';
import colors from '../theme/colors';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            Profile
          </Typography>
          {profile && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>Name</Typography>
                <Typography variant="h6">{profile.name || user?.name}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>Email</Typography>
                <Typography variant="body1">{profile.email || user?.email}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>Phone</Typography>
                <Typography variant="body1">{profile.phone || user?.phone}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>Status</Typography>
                <Chip
                  label={profile.status || 'pending'}
                  color={profile.status === 'approved' ? 'success' : profile.status === 'rejected' ? 'error' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </>
          )}
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ mt: 3 }}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfilePage;

