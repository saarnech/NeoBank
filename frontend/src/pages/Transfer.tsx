import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    AppBar,
    Toolbar,
    Link as MuiLink,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { createTransfer } from '../api/transactions';

function Transfer() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [recipientEmail, setRecipientEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await createTransfer({ recipientEmail, amount });
            // Success — bounce back to the dashboard, which will refetch fresh balance + transactions
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            const message = err.response?.data?.error || 'Something went wrong. Please try again.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top bar */}
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">NeoBank</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                        <Typography variant="body2">{user?.email}</Typography>
                        <Button onClick={handleLogout} variant="outlined" size="small">
                            Log out
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Main content */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                }}
            >
                <MuiLink
                    component={RouterLink}
                    to="/dashboard"
                    sx={{ alignSelf: 'flex-start', mb: 4, ml: 2 }}
                >
                    ← Back to dashboard
                </MuiLink>

                <Typography variant="h4" sx={{ mb: 2 }}>
                    Send money
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Your balance: ${user?.balance ?? '0.00'}
                </Typography>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                    <TextField
                        label="Recipient email"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        fullWidth
                        slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                    />

                    {error && <Alert severity="error">{error}</Alert>}

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={isSubmitting}
                        fullWidth
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : 'Send'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default Transfer;