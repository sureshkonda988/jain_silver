import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Logout, CheckCircle, Cancel, Visibility } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';
import colors from '../theme/colors';

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/pending-users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.put(`/admin/approve-user/${userId}`);
      fetchUsers();
      alert('User approved successfully');
    } catch (error) {
      alert('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm('Are you sure you want to reject this user?')) {
      try {
        await api.put(`/admin/reject-user/${userId}`, { reason: 'Rejected by admin' });
        fetchUsers();
        alert('User rejected successfully');
      } catch (error) {
        alert('Failed to reject user');
      }
    }
  };

  const handleAdjustRates = async () => {
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount)) {
      alert('Please enter a valid number');
      return;
    }
    try {
      await api.post('/admin/adjust-rates', { amount });
      alert('Rates adjusted successfully');
      setAdjustDialogOpen(false);
      setAdjustAmount('');
    } catch (error) {
      alert('Failed to adjust rates');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Admin Dashboard
        </Typography>
        <Button variant="contained" color="error" startIcon={<Logout />} onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Rate Adjustment</Typography>
          <Button variant="contained" onClick={() => setAdjustDialogOpen(true)}>
            Adjust Rates
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant={activeTab === 'pending' ? 'contained' : 'outlined'} onClick={() => setActiveTab('pending')}>
              Pending Users
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Chip label={user.status} color={user.status === 'approved' ? 'success' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => handleApprove(user._id)}>
                        Approve
                      </Button>
                      <Button size="small" color="error" startIcon={<Cancel />} onClick={() => handleReject(user._id)} sx={{ ml: 1 }}>
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)}>
        <DialogTitle>Adjust Rates</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Amount (negative to decrease)"
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdjustRates} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboardPage;

