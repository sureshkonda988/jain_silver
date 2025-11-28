import React, { useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Newspaper as NewsIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import colors from '../theme/colors';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const getTabValue = () => {
    if (location.pathname === '/') return 0;
    if (location.pathname === '/news') return 1;
    if (location.pathname === '/profile') return 2;
    return 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: colors.primaryDark,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Toolbar>
          <Avatar
            src="/jain_logo.png"
            alt="Jain Silver Plaza"
            sx={{ width: 48, height: 48, mr: 2 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
              Jain Silver Plaza
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Welcome, {user?.name || 'User'}
            </Typography>
          </Box>
          <Chip
            label={user?.location || 'Andhra Pradesh'}
            size="small"
            sx={{
              backgroundColor: colors.primary,
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, pb: 8, backgroundColor: colors.background }}>
        <Outlet />
      </Box>

      <BottomNavigation
        value={getTabValue()}
        onChange={(event, newValue) => {
          if (newValue === 0) navigate('/');
          else if (newValue === 1) navigate('/news');
          else if (newValue === 2) navigate('/profile');
        }}
        showLabels
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: `1px solid ${colors.divider}`,
          backgroundColor: 'white',
          zIndex: 1000,
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={<HomeIcon />}
          sx={{
            color: getTabValue() === 0 ? colors.primary : colors.textHint,
          }}
        />
        <BottomNavigationAction
          label="News"
          icon={<NewsIcon />}
          sx={{
            color: getTabValue() === 1 ? colors.primary : colors.textHint,
          }}
        />
        <BottomNavigationAction
          label="Profile"
          icon={<ProfileIcon />}
          sx={{
            color: getTabValue() === 2 ? colors.primary : colors.textHint,
          }}
        />
      </BottomNavigation>
    </Box>
  );
}

export default Layout;

