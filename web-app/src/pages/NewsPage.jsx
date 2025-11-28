import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Divider, Chip, Grid } from '@mui/material';
import { LocationOn, Phone, Star, AccessTime, Share, CheckCircle, Instagram, Facebook, YouTube } from '@mui/icons-material';
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

  const handleSocialMediaClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handlePhoneCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Welcome Card */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${colors.primaryVeryLight} 0%, ${colors.white} 100%)`, border: `2px solid ${colors.primary}` }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primaryDark, mr: 2 }}>
              👋
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primaryDark }}>
              Welcome to Jain Silver Plaza
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: colors.textPrimary, lineHeight: 1.8 }}>
            {storeInfo?.welcomeMessage ||
              'Your trusted partner for premium silver products. We offer the best quality silver coins, bars, and jewelry with transparent pricing and excellent customer service.'}
          </Typography>
        </CardContent>
      </Card>

      {/* About Us Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mr: 1 }}>
              ℹ️
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              About Us
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Jain Silver Plaza</Typography>
          <Typography variant="subtitle2" sx={{ mb: 2, color: colors.textSecondary, fontWeight: 600 }}>
            Silver Jewellery Manufacturers & Jewellery Showrooms
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1.5, backgroundColor: colors.primaryVeryLight, borderRadius: 2, width: 'fit-content' }}>
            <Star sx={{ color: '#FFC107', mr: 1 }} />
            <Typography variant="h6" sx={{ mr: 1, fontWeight: 700 }}>4.4</Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>(84 Ratings)</Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
            Jain Silver Plaza is a trusted name in silver jewellery manufacturing and retail. 
            We specialize in premium quality silver coins, bars, and exquisite jewellery pieces. 
            Located in the heart of Vijayawada, we have been serving customers with authentic 
            silver products and transparent pricing for years.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
            Our showroom offers a wide range of silver products including coins, bars, and 
            custom jewellery designs. We maintain the highest standards of quality and 
            provide excellent customer service to ensure your complete satisfaction.
          </Typography>
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${colors.divider}` }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: colors.success, mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Authentic Silver Products</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: colors.success, mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Transparent Pricing</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: colors.success, mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Expert Craftsmanship</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: colors.success, mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Customer Satisfaction</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Store Timings Card */}
      {storeInfo?.storeTimings && storeInfo.storeTimings.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccessTime sx={{ mr: 1, color: colors.primary }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Store Timings
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {storeInfo.storeTimings.map((timing, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{timing.day}:</Typography>
                <Typography variant="body1" sx={{ color: colors.textSecondary }}>
                  {timing.isClosed ? 'Closed' : `${timing.openTime} - ${timing.closeTime}`}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Store Location Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationOn sx={{ mr: 1, color: colors.primary }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Store Location
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Jain Silver Plaza</Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
            Governerpet, Vijayawada, Andhra Pradesh<br />
            Gopala Reddy Road, Governerpet<br />
            Vijayawada-520002, Andhra Pradesh
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary, fontWeight: 500 }}>
            Open until 9:00 PM • 4.4 ⭐ (84 Ratings) • Claim this business
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.open('https://www.google.com/maps/place/16%C2%B030\'41.3%22N+80%C2%B037\'33.3%22E/@16.511483,80.62592,17z/data=!3m1!4b1!4m4!3m3!8m2!3d16.511483!4d80.62592?entry=ttu&g_ep=EgoyMDI1MTEyMy4xIKXMDSoASAFQAw%3D%3D', '_blank')}
            startIcon={<LocationOn />}
            sx={{ backgroundColor: colors.primary, '&:hover': { backgroundColor: colors.primaryDark } }}
          >
            Open in Google Maps
          </Button>
        </CardContent>
      </Card>

      {/* Social Media Card */}
      {(storeInfo?.instagram || storeInfo?.facebook || storeInfo?.youtube) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Share sx={{ mr: 1, color: colors.primary }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Follow Us
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {storeInfo.instagram && (
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Instagram />}
                    onClick={() => handleSocialMediaClick(storeInfo.instagram)}
                    sx={{
                      borderColor: '#E4405F',
                      color: '#E4405F',
                      '&:hover': { borderColor: '#E4405F', backgroundColor: 'rgba(228, 64, 95, 0.1)' },
                    }}
                  >
                    Instagram
                  </Button>
                </Grid>
              )}
              {storeInfo.facebook && (
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Facebook />}
                    onClick={() => handleSocialMediaClick(storeInfo.facebook)}
                    sx={{
                      borderColor: '#1877F2',
                      color: '#1877F2',
                      '&:hover': { borderColor: '#1877F2', backgroundColor: 'rgba(24, 119, 242, 0.1)' },
                    }}
                  >
                    Facebook
                  </Button>
                </Grid>
              )}
              {storeInfo.youtube && (
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<YouTube />}
                    onClick={() => handleSocialMediaClick(storeInfo.youtube)}
                    sx={{
                      borderColor: '#FF0000',
                      color: '#FF0000',
                      '&:hover': { borderColor: '#FF0000', backgroundColor: 'rgba(255, 0, 0, 0.1)' },
                    }}
                  >
                    YouTube
                  </Button>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Contact Card */}
      {storeInfo?.phoneNumber && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Phone sx={{ mr: 1, color: colors.primary }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Contact Us
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{storeInfo.phoneNumber}</Typography>
              <Button
                variant="contained"
                startIcon={<Phone />}
                onClick={() => handlePhoneCall(storeInfo.phoneNumber)}
                sx={{ backgroundColor: colors.primary }}
              >
                Call
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default NewsPage;

