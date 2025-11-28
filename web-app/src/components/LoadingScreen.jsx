import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingScreen() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F5F7FA',
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3, color: '#757575' }}>
        Loading...
      </Typography>
    </Box>
  );
}

export default LoadingScreen;

