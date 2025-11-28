import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { Store, LocationOn, Phone } from '@mui/icons-material';
import colors from '../theme/colors';

function SidePromotionalBanner() {
  const handleVisitStore = () => {
    window.open(
      'https://www.google.com/maps/place/16%C2%B030\'41.3%22N+80%C2%B037\'33.3%22E/@16.511483,80.62592,17z/data=!3m1!4b1!4m4!3m3!8m2!3d16.511483!4d80.62592?entry=ttu&g_ep=EgoyMDI1MTEyMy4xIKXMDSoASAFQAw%3D%3D',
      '_blank'
    );
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
        color: 'white',
        borderRadius: 3,
        p: 2,
        textAlign: 'center',
        position: 'sticky',
        top: 20,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Store sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Visit Our Store
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, fontSize: '0.85rem' }}>
          Governerpet, Vijayawada
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={handleVisitStore}
          startIcon={<LocationOn />}
          sx={{
            backgroundColor: 'white',
            color: colors.primary,
            mb: 1,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.9)',
            },
          }}
        >
          View Location
        </Button>
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <img
            src="https://png.pngtree.com/png-clipart/20230916/original/pngtree-visit-ourstore-vector-png-image_12249551.png"
            alt="Visit Our Store"
            style={{
              width: '100%',
              maxWidth: 120,
              height: 'auto',
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default SidePromotionalBanner;

