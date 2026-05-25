import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import { loginUser } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await loginUser({ email, password });
            login(result.token, result.user);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            const message = err.response?.data?.error || 'Something went wrong. Please try again.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthLayout>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Log in to your NeoBank account.
            </Typography>

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
                <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                />
                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                />

                {error && <Alert severity="error">{error}</Alert>}

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    fullWidth
                >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Log in'}
                </Button>

                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                    Don't have an account?{' '}
                    <Link to="/register">Sign up</Link>
                </Typography>
            </Box>
        </AuthLayout>
    );
}

export default Login;