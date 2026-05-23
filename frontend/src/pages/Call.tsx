import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    AppBar,
    Toolbar,
    Button,
    Link as MuiLink,
    TextField,
    Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Call() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [recipientEmail, setRecipientEmail] = useState('');
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    function roomNameFor(email: string): string {
        return 'neobank-' + email.replace(/[@.]/g, '-');
    }

    function startCall(targetEmail: string) {
        setError(null);
        if (!window.JitsiMeetExternalAPI) {
            setError('Video service is still loading. Please try again in a moment.');
            return;
        }
        setActiveRoom(roomNameFor(targetEmail));
    }

    function endCall() {
        if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
        }
        setActiveRoom(null);
        setRecipientEmail('');
    }

    // Initialize Jitsi when we have a room and the container exists
    useEffect(() => {
        if (!activeRoom || !jitsiContainerRef.current || apiRef.current) {
            return;
        }

        const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
            roomName: activeRoom,
            parentNode: jitsiContainerRef.current,
            width: '100%',
            height: 600,
            userInfo: {
                displayName: user?.email ?? 'User',
                email: user?.email ?? '',
            },
        });

        api.addEventListener('readyToClose', () => {
            endCall();
        });

        apiRef.current = api;

        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
            }
        };
    }, [activeRoom, user?.email]);

    function handleCallMyself() {
        if (user?.email) {
            startCall(user.email);
        }
    }

    function handleCallRecipient(e: React.FormEvent) {
        e.preventDefault();
        if (recipientEmail.trim()) {
            startCall(recipientEmail.trim());
        }
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

            <Box sx={{ flex: 1, p: 4, maxWidth: 900, width: '100%', mx: 'auto' }}>
                <MuiLink
                    component={RouterLink}
                    to="/dashboard"
                    sx={{ display: 'inline-block', mb: 4 }}
                >
                    ← Back to dashboard
                </MuiLink>

                <Typography variant="h4" sx={{ mb: 2 }}>
                    Video call
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Confirm transfers face to face. Enter a user's email to join their room.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {!activeRoom && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 500 }}>
                        <Box
                            component="form"
                            onSubmit={handleCallRecipient}
                            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                        >
                            <TextField
                                label="Call user by email"
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                fullWidth
                            />
                            <Button type="submit" variant="contained" size="large" disabled={!recipientEmail.trim()}>
                                Join their room
                            </Button>
                        </Box>

                        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>or</Typography>

                        <Button onClick={handleCallMyself} variant="outlined" size="large">
                            Open my own room
                        </Button>
                    </Box>
                )}

                {activeRoom && (
                    <Box>
                        <Button onClick={endCall} variant="outlined" sx={{ mb: 2 }}>
                            End call
                        </Button>
                        <Box ref={jitsiContainerRef} sx={{ width: '100%', minHeight: 600 }} />
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default Call;