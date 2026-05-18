import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Link as MuiLink,
} from '@mui/material';
import { verifyOtp, resendOtp } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // The email was passed via navigation state from the Register page
    const email = (location.state as { email?: string })?.email;

    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);

    // If the user lands here directly without going through Register, send them back
    if (!email) {
        navigate('/register', { replace: true });
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setInfo(null);
        setIsSubmitting(true);

        try {
            const result = await verifyOtp({ email: email!, otp });
            login(result.token, result.user);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            const message = err.response?.data?.error || 'Something went wrong. Please try again.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResend() {
        setError(null);
        setInfo(null);
        setIsResending(true);

        try {
            await resendOtp(email!);
            setInfo('A new code has been sent to your email.');
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to resend code. Please try again.';
            setError(message);
        } finally {
            setIsResending(false);
        }
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
            }}
        >
            <Typography variant="h5" sx={{ mb: 4 }}>
                NeoBank
            </Typography>

            <Typography variant="h4" sx={{ mb: 2 }}>
                Verify your email
            </Typography>

            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
            </Typography>

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
                <TextField
                    label="Verification code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    fullWidth
                    slotProps={{ htmlInput: { maxLength: 6 } }}
                />

                {error && <Alert severity="error">{error}</Alert>}
                {info && <Alert severity="info">{info}</Alert>}

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    fullWidth
                >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Verify'}
                </Button>

                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                    Didn't receive a code?{' '}
                    <MuiLink
                        component="button"
                        type="button"
                        onClick={handleResend}
                        disabled={isResending}
                        underline="hover"
                    >
                        {isResending ? 'Sending...' : 'Resend'}
                    </MuiLink>
                </Typography>
            </Box>
        </Box>
    );
}

export default VerifyOtp;