import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Avatar,
} from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';
import colors from '../theme/colors';
import PromotionalBanner from '../components/PromotionalBanner';
import SidePromotionalBanner from '../components/SidePromotionalBanner';

const POLLING_INTERVAL = 1000;

function HomePage() {
  const { user } = useContext(AuthContext);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [previousRates, setPreviousRates] = useState({});
  const pollingIntervalRef = React.useRef(null);

  useEffect(() => {
    fetchRates();
    startPolling();
    return () => stopPolling();
  }, []);

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollRates();
    pollingIntervalRef.current = setInterval(() => {
      pollRates();
    }, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const pollRates = async () => {
    try {
      // Add cache-busting timestamp to ensure fresh data
      const response = await api.get('/rates', { 
        timeout: 10000,
        params: { _t: Date.now() } // Cache busting
      });
      const newRates = response.data;
      const updateTime = new Date();

      if (newRates && Array.isArray(newRates) && newRates.length > 0) {
        setLastUpdateTime(updateTime);
        setLoading(false);

        setRates((prevRates) => {
          const updatedRates = newRates.map((newRate) => {
            const prevRate = prevRates.find(
              (rate) =>
                rate._id?.toString() === newRate._id?.toString() ||
                (rate.name === newRate.name &&
                  rate.weight?.value === newRate.weight?.value &&
                  rate.purity === newRate.purity)
            );

            const rateKey = newRate._id?.toString() || `${newRate.name}-${newRate.weight?.value}`;

            // Check if rate changed (use smaller threshold for more sensitive updates)
            if (prevRate) {
              const rateChanged = Math.abs((prevRate.ratePerGram || 0) - (newRate.ratePerGram || 0)) > 0.0001;

              if (rateChanged) {
                setPreviousRates((prev) => ({
                  ...prev,
                  [rateKey]: {
                    oldRate: prevRate.ratePerGram,
                    newRate: newRate.ratePerGram,
                    isUp: (newRate.ratePerGram || 0) > (prevRate.ratePerGram || 0),
                    timestamp: Date.now(),
                  },
                }));

                setTimeout(() => {
                  setPreviousRates((prev) => {
                    const newPrev = { ...prev };
                    delete newPrev[rateKey];
                    return newPrev;
                  });
                }, 1500);
              }
            } else {
              // New rate, show as updated
              setPreviousRates((prev) => ({
                ...prev,
                [rateKey]: {
                  oldRate: 0,
                  newRate: newRate.ratePerGram,
                  isUp: true,
                  timestamp: Date.now(),
                },
              }));
            }

            return {
              ...newRate,
              lastUpdated: newRate.lastUpdated || updateTime,
            };
          });
          
          return updatedRates;
        });
      } else {
        console.warn('No rates received from API');
      }
    } catch (error) {
      // Log error occasionally to avoid spam
      if (Math.random() < 0.1) {
        console.warn('Polling error:', error.message, error.response?.status);
      }
      // Don't stop polling on error - continue trying
    }
  };

  const fetchRates = async () => {
    try {
      const response = await api.get('/rates');
      if (response.data && Array.isArray(response.data)) {
        setRates(response.data);
        setLastUpdateTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatWeight = (weight) => {
    return `${weight.value} ${weight.unit}`;
  };

  const getRateColor = (rateKey) => {
    const prevRate = previousRates[rateKey];
    if (!prevRate) return colors.textPrimary;
    return prevRate.isUp ? colors.success : colors.error;
  };

  const getTypeIcon = (type, name) => {
    if (type === 'coin') {
      return 'coin-image';
    }
    if (type === 'bar' && name) {
      const nameLower = name.toLowerCase();
      if (nameLower.includes('1 kg') || nameLower.includes('1kg') || 
          nameLower.includes('100 grams') || nameLower.includes('100g') ||
          nameLower.includes('500 grams') || nameLower.includes('500g')) {
        return 'bar-image';
      }
    }
    switch (type) {
      case 'bar': return '📦';
      case 'jewelry': return '💍';
      default: return '✨';
    }
  };

  const getProductImage = (type, name) => {
    const iconType = getTypeIcon(type, name);
    if (iconType === 'coin-image') {
      return 'https://thumbs.dreamstime.com/b/silver-coin-isolated-white-background-366350738.jpg';
    }
    if (iconType === 'bar-image') {
      return 'https://thumbs.dreamstime.com/b/four-cast-silver-bars-isolated-white-background-366350738.jpg';
    }
    return null;
  };

  if (loading && rates.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <PromotionalBanner />
      
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: 28,
            mb: 1,
            color: '#000000',
            fontFamily: 'serif',
          }}
        >
          Silver Rates (Live)
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
          Andhra Pradesh Market • Updates every second
        </Typography>
        {lastUpdateTime && (
          <Typography variant="caption" sx={{ color: colors.primary }}>
            Last update: {lastUpdateTime.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      {rates.length === 0 ? (
        <Alert severity="info">No rates available</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={9}>
            <Grid container spacing={2}>
              {rates.map((rate) => {
                const rateKey = rate._id?.toString() || `${rate.name}-${rate.weight?.value}`;
                const prevRate = previousRates[rateKey];
                const rateColor = getRateColor(rateKey);
                const productImage = getProductImage(rate.type, rate.name);
                const iconType = getTypeIcon(rate.type, rate.name);

                return (
                  <Grid item xs={12} sm={6} md={4} key={rate._id || rateKey}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        borderLeft: `4px solid ${colors.primary}`,
                        backgroundColor: prevRate
                          ? prevRate.isUp
                            ? '#E8F5E9'
                            : '#FFEBEE'
                          : 'white',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          {productImage ? (
                            <Avatar
                              src={productImage}
                              alt={rate.name}
                              variant="rounded"
                              sx={{
                                width: 56,
                                height: 56,
                                mr: 2,
                                flexShrink: 0,
                                backgroundColor: colors.primaryVeryLight,
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Avatar
                              sx={{
                                width: 56,
                                height: 56,
                                mr: 2,
                                flexShrink: 0,
                                backgroundColor: colors.primaryVeryLight,
                                fontSize: 24,
                              }}
                            >
                              {iconType}
                            </Avatar>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                              {rate.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip
                                label={rate.purity}
                                size="small"
                                sx={{
                                  backgroundColor: colors.primaryVeryLight,
                                  color: colors.primaryDark,
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                }}
                              />
                              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: '0.75rem' }}>
                                {formatWeight(rate.weight)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            backgroundColor: colors.primaryVeryLight,
                            p: 2,
                            borderRadius: 2,
                            textAlign: 'right',
                          }}
                        >
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 600,
                              color: rateColor,
                              mb: 0.5,
                              fontSize: '1.5rem',
                            }}
                          >
                            {formatPrice(rate.rate)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: rateColor,
                              fontWeight: 500,
                            }}
                          >
                            ₹{rate.ratePerGram?.toFixed(2)}/gram
                          </Typography>
                          {prevRate && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 1 }}>
                              {prevRate.isUp ? (
                                <TrendingUp sx={{ color: colors.success, fontSize: 20 }} />
                              ) : (
                                <TrendingDown sx={{ color: colors.error, fontSize: 20 }} />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: rateColor,
                                  ml: 0.5,
                                  fontWeight: 600,
                                }}
                              >
                                ₹{Math.abs(prevRate.newRate - prevRate.oldRate).toFixed(2)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                            Updated: {new Date(rate.lastUpdated).toLocaleTimeString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                            {rate.location || 'Andhra Pradesh'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
          <Grid item xs={12} lg={3}>
            <SidePromotionalBanner />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default HomePage;

