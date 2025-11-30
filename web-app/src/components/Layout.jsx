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
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          borderBottom: `1px solid ${colors.divider}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            py: 1.5,
            minHeight: { xs: 64, sm: 72 } !important,
          }}
        >
          <Box
            component="img"
            src="/1764232687647-removebg-preview.png"
            alt="Jain Silver Plaza"
            sx={{
              height: { xs: 50, sm: 60 },
              width: 'auto',
              mr: 2,
              cursor: 'pointer',
              objectFit: 'contain',
            }}
            onClick={() => navigate('/')}
          />
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.textPrimary,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  lineHeight: 1.2,
                  mb: 0.25,
                }}
              >
                Jain Silver Plaza
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: colors.textSecondary,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Premium Silver Products | Pure 'N' Sure
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                alignItems: 'flex-end',
                mr: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: colors.textPrimary,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {user?.name || 'User'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: colors.textSecondary,
                  fontSize: '0.7rem',
                }}
              >
                Welcome back
              </Typography>
            </Box>
            <Chip
              icon={
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.75rem',
                    display: 'inline-block',
                  }}
                >
                  📍
                </Box>
              }
              label={user?.location || 'Andhra Pradesh'}
              size="small"
              sx={{
                backgroundColor: colors.primaryVeryLight,
                color: colors.primary,
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 28, sm: 32 },
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />
          </Box>
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

