import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { Store, LocationOn } from '@mui/icons-material';
import colors from '../theme/colors';

function PromotionalBanner() {
  const handleVisitStore = () => {
    window.open(
      'https://www.google.com/maps/place/16%C2%B030\'41.3%22N+80%C2%B037\'33.3%22E/@16.511483,80.62592,17z/data=!3m1!4b1!4m4!3m3!8m2!3d16.511483!4d80.62592?entry=ttu&g_ep=EgoyMDI1MTEyMy4xIKXMDSoASAFQAw%3D%3D',
      '_blank'
    );
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        color: 'white',
        borderRadius: 3,
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Visit Our Store
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Experience premium silver jewelry at our showroom in Vijayawada
            </Typography>
            <Button
              variant="contained"
              onClick={handleVisitStore}
              startIcon={<LocationOn />}
              sx={{
                backgroundColor: 'white',
                color: colors.primary,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              View Location
            </Button>
          </Box>
          <Box
            sx={{
              ml: 3,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <img
              src="https://png.pngtree.com/png-clipart/20230916/original/pngtree-visit-ourstore-vector-png-image_12249551.png"
              alt="Visit Our Store"
              style={{
                width: 150,
                height: 'auto',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default PromotionalBanner;

