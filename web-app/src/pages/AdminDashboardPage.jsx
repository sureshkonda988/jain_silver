import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, CircularProgress } from '@mui/material';
import { Logout, CheckCircle, Cancel, Visibility, Remove, Add } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';
import colors from '../theme/colors';

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('increase'); // 'increase' or 'decrease'
  const [loadingAction, setLoadingAction] = useState(false);
  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoadingRates(true);
      const response = await api.get('/rates');
      setRates(response.data || []);
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoadingRates(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not authenticated. Please sign in again.');
        navigate('/admin/login');
        return;
      }
      
      try {
        const pendingResponse = await api.get('/admin/pending-users');
        setPendingUsers(pendingResponse.data || []);
      } catch (pendingError) {
        console.error('Error fetching pending users:', pendingError);
        const errorMsg = pendingError.response?.data?.message || pendingError.message || 'Failed to fetch pending users';
        if (pendingError.response?.status === 401 || pendingError.response?.status === 403) {
          alert(`Authentication error: ${errorMsg}. Please sign in again.`);
          navigate('/admin/login');
          return;
        }
        alert(`Failed to fetch pending users: ${errorMsg}`);
        setPendingUsers([]);
      }
      
      // Try to fetch all users
      try {
        const allResponse = await api.get('/admin/users');
        setAllUsers(allResponse.data || []);
      } catch (allUsersError) {
        console.error('Error fetching all users:', allUsersError);
        const errorMsg = allUsersError.response?.data?.message || allUsersError.message || 'Failed to fetch all users';
        if (allUsersError.response?.status === 401 || allUsersError.response?.status === 403) {
          // Already handled above, just use pending users
          setAllUsers(pendingUsers);
        } else {
          console.warn('All users endpoint not available, using pending users only');
          setAllUsers(pendingUsers);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch users';
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert(`Authentication error: ${errorMsg}. Please sign in again.`);
        navigate('/admin/login');
      } else {
        alert(`Failed to fetch users: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setLoadingAction(true);
      await api.put(`/admin/approve-user/${userId}`);
      await fetchUsers();
      alert('User approved successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve user');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm('Are you sure you want to reject this user?')) {
      try {
        setLoadingAction(true);
        await api.put(`/admin/reject-user/${userId}`, { reason: 'Rejected by admin' });
        await fetchUsers();
        alert('User rejected successfully');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to reject user');
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleViewDocuments = (userId) => {
    navigate(`/admin/users/${userId}/documents`);
  };

  const handleAdjustRates = async () => {
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number');
      return;
    }
    try {
      setLoadingAction(true);
      const finalAmount = adjustType === 'decrease' ? -Math.abs(amount) : amount;
      await api.post('/admin/adjust-rates', { amount: finalAmount });
      alert(`Rates ${adjustType === 'decrease' ? 'decreased' : 'increased'} by ₹${amount}/gram successfully`);
      setAdjustDialogOpen(false);
      setAdjustAmount('');
      // Refresh rates to show updated values
      await fetchRates();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to adjust rates');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const usersToShow = activeTab === 0 ? pendingUsers : allUsers;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Admin Dashboard
        </Typography>
        <Button variant="contained" color="error" startIcon={<Logout />} onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {/* Rate Adjustment Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Rate Adjustment</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
            Adjust silver rates per gram. Enter positive amount to increase or decrease rates.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<Remove />}
              onClick={() => {
                setAdjustType('decrease');
                setAdjustDialogOpen(true);
              }}
              disabled={loadingAction}
            >
              Decrease Rates
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Add />}
              onClick={() => {
                setAdjustType('increase');
                setAdjustDialogOpen(true);
              }}
              disabled={loadingAction}
            >
              Increase Rates
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Current Rates Display Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Current Silver Rates</Typography>
            <Button size="small" onClick={fetchRates} disabled={loadingRates}>
              Refresh
            </Button>
          </Box>
          {loadingRates ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : rates.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Normal Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Adjusted Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Adjustment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rates.map((rate) => {
                    const hasAdjustment = rate.manualAdjustment && rate.manualAdjustment !== 0;
                    const normalPrice = rate.originalRate || rate.rate;
                    const adjustedPrice = rate.rate;
                    const adjustment = rate.manualAdjustment || 0;
                    
                    return (
                      <TableRow key={rate._id || rate.name}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {rate.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                            {rate.purity} • {rate.weight?.value} {rate.weight?.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                            ₹{normalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block' }}>
                            ₹{rate.originalRatePerGram?.toFixed(2) || rate.ratePerGram.toFixed(2)}/gram
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: hasAdjustment ? 600 : 400,
                              color: hasAdjustment ? (adjustment > 0 ? colors.success : colors.error) : colors.textPrimary
                            }}
                          >
                            ₹{adjustedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block' }}>
                            ₹{rate.ratePerGram.toFixed(2)}/gram
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {hasAdjustment ? (
                            <Chip
                              label={`${adjustment > 0 ? '+' : ''}₹${adjustment.toFixed(2)}/gram`}
                              size="small"
                              sx={{
                                backgroundColor: adjustment > 0 ? colors.success : colors.error,
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                              No adjustment
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" sx={{ color: colors.textSecondary, textAlign: 'center', p: 2 }}>
              No rates available
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Pending Users (${pendingUsers.length})`} />
            <Tab label={`All Users (${allUsers.length})`} />
          </Tabs>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : usersToShow.length === 0 ? (
            <Alert severity="info">No users found</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersToShow.map((userItem) => (
                    <TableRow key={userItem._id}>
                      <TableCell>{userItem.name}</TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>{userItem.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={userItem.status || 'pending'}
                          color={userItem.status === 'approved' ? 'success' : userItem.status === 'rejected' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {userItem.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleApprove(userItem._id)}
                                disabled={loadingAction}
                                variant="contained"
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => handleReject(userItem._id)}
                                disabled={loadingAction}
                                variant="contained"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => handleViewDocuments(userItem._id)}
                          >
                            View Docs
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Adjust Rates Dialog */}
      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {adjustType === 'decrease' ? 'Decrease Rates' : 'Increase Rates'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
            Enter the amount per gram to {adjustType === 'decrease' ? 'decrease' : 'increase'} rates.
            Example: Enter 100 to {adjustType === 'decrease' ? 'decrease' : 'increase'} by ₹100/gram.
          </Typography>
          <TextField
            fullWidth
            label={`Amount to ${adjustType === 'decrease' ? 'decrease' : 'increase'}`}
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            margin="normal"
            placeholder="e.g., 100"
            inputProps={{ min: 0, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)} disabled={loadingAction}>
            Cancel
          </Button>
          <Button
            onClick={handleAdjustRates}
            variant="contained"
            color={adjustType === 'decrease' ? 'error' : 'success'}
            disabled={loadingAction || !adjustAmount}
          >
            {loadingAction ? 'Applying...' : adjustType === 'decrease' ? 'Decrease' : 'Increase'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboardPage;

