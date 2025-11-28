import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Divider, Chip } from '@mui/material';
import { LocationOn, Phone, Star } from '@mui/icons-material';
import api from '../config/api';
import colors from '../theme/colors';

function NewsPage() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const fetchStoreInfo = async () => {
    try {
      const response = await api.get('/store/info');
      setStoreInfo(response.data);
    } catch (error) {
      console.error('Error fetching store info:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            About Us
          </Typography>
          <Typography variant="h6" sx={{ mb: 1 }}>Jain Silver Plaza</Typography>
          <Typography variant="subtitle2" sx={{ mb: 2, color: colors.textSecondary }}>
            Silver Jewellery Manufacturers & Jewellery Showrooms
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Star sx={{ color: '#FFC107', mr: 1 }} />
            <Typography variant="h6" sx={{ mr: 1 }}>4.4</Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>(84 Ratings)</Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Jain Silver Plaza is a trusted name in silver jewellery manufacturing and retail.
            We specialize in premium quality silver coins, bars, and exquisite jewellery pieces.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            <LocationOn sx={{ mr: 1, color: colors.primary }} />
            Store Location
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>Jain Silver Plaza</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Governerpet, Vijayawada, Andhra Pradesh<br />
            Gopala Reddy Road, Governerpet<br />
            Vijayawada-520002, Andhra Pradesh
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
            Open until 9:00 PM • 4.4 ⭐ (84 Ratings)
          </Typography>
          <Button
            variant="contained"
            href="https://www.google.com/maps/place/16%C2%B030'41.3%22N+80%C2%B037'33.3%22E/@16.511483,80.62592,17z/data=!3m1!4b1!4m4!3m3!8m2!3d16.511483!4d80.62592?entry=ttu&g_ep=EgoyMDI1MTEyMy4xIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            sx={{ backgroundColor: colors.primary }}
          >
            Open in Google Maps
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default NewsPage;

