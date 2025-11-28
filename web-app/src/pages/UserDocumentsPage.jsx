import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, ImageList, ImageListItem, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '../config/api';
import colors from '../theme/colors';

function UserDocumentsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDocuments();
  }, [userId]);

  const fetchUserDocuments = async () => {
    try {
      const response = await api.get(`/admin/user/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/dashboard')} sx={{ mb: 2 }}>
        Back
      </Button>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            {user?.name}'s Documents
          </Typography>
          {user?.documents && (
            <ImageList cols={3} gap={16}>
              {user.documents.aadhar?.front && (
                <ImageListItem>
                  <img src={user.documents.aadhar.front} alt="Aadhar Front" style={{ width: '100%', height: 'auto' }} />
                  <Typography variant="caption">Aadhar Front</Typography>
                </ImageListItem>
              )}
              {user.documents.aadhar?.back && (
                <ImageListItem>
                  <img src={user.documents.aadhar.back} alt="Aadhar Back" style={{ width: '100%', height: 'auto' }} />
                  <Typography variant="caption">Aadhar Back</Typography>
                </ImageListItem>
              )}
              {user.documents.pan?.image && (
                <ImageListItem>
                  <img src={user.documents.pan.image} alt="PAN" style={{ width: '100%', height: 'auto' }} />
                  <Typography variant="caption">PAN</Typography>
                </ImageListItem>
              )}
            </ImageList>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default UserDocumentsPage;

