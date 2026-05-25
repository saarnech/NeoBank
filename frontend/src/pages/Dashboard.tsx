import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    AppBar,
    Toolbar,
    CircularProgress,
    Alert,
    Stack,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { fetchCurrentUser } from '../api/auth';
import { fetchTransactions, type Transaction } from '../api/transactions';
import { getSocket } from '../api/socket';
import ChatWidget from '../components/ChatWidget';

function Dashboard() {
    const navigate = useNavigate();
    const { user, logout, login, token } = useAuth();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            setError(null);

            try {
                const [freshUser, txResponse] = await Promise.all([
                    fetchCurrentUser(),
                    fetchTransactions(1, 10),
                ]);

                // Refresh the user in context so balance is up-to-date
                if (token) {
                    login(token, freshUser);
                }
                setTransactions(txResponse.items);
            } catch (err: any) {
                const message = err.response?.data?.error || 'Failed to load dashboard.';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        function handleTransactionReceived(tx: Transaction) {
            console.log('[dashboard] received transaction:', tx);

            // Prepend to the transaction list
            setTransactions((prev) => [tx, ...prev]);

            // Update balance: add the amount to the current user's balance
            if (token && user) {
                const newBalance = (Number(user.balance) + Number(tx.amount)).toFixed(2);
                login(token, { ...user, balance: newBalance });
            }
        }

        socket.on('transaction:received', handleTransactionReceived);

        return () => {
            socket.off('transaction:received', handleTransactionReceived);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, user?.id]);

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    function handleSendMoney() {
        navigate('/transfer');
    }

    if (isLoading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        );
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
            <Box sx={{ flex: 1, p: 4, maxWidth: 900, width: '100%', mx: 'auto' }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Balance card */}
                <Paper
                    sx={{
                        p: 4,
                        mb: 4,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 3,
                        backgroundImage: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                    }}
                >
                    <Box>
                        <Typography variant="body2" sx={{ opacity: 0.7, mb: 1, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                            Your balance
                        </Typography>
                        <Typography variant="h3" sx={{ mb: 1 }}>
                            ${Number(user?.balance ?? 0).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.6 }}>
                            {user?.email}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button
                            onClick={handleSendMoney}
                            variant="contained"
                            size="large"
                            color="secondary"
                        >
                            Send money
                        </Button>
                        <Button
                            onClick={() => navigate('/call')}
                            variant="outlined"
                            size="large"
                            sx={{
                                color: 'white',
                                borderColor: 'rgba(255,255,255,0.4)',
                                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            Video call
                        </Button>
                    </Box>
                </Paper>

                {/* Transactions */}
                <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                    Recent transactions
                </Typography>

                {transactions.length === 0 ? (
                    <Paper sx={{
                        p: 2.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: 0,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: 2,
                            borderColor: 'transparent',
                        },
                    }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            No transactions yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Send some money to get started.
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={1}>
                        {transactions.map((tx) => {
                            const isSender = tx.senderEmail === user?.email;
                            const counterparty = isSender ? tx.recipientEmail : tx.senderEmail;
                            const sign = isSender ? '-' : '+';
                            const dateLabel = new Date(tx.createdAt).toLocaleDateString();
                            return (
                                <Paper
                                    key={tx.id}
                                    sx={{
                                        p: 2.5,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            transform: 'translateY(-1px)',
                                            boxShadow: 2,
                                        },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                bgcolor: isSender ? 'error.light' : 'success.light',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {isSender ? '↑' : '↓'}
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                                                {isSender ? 'Sent to' : 'Received from'}
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {counterparty}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 700, color: isSender ? 'error.main' : 'success.main' }}>
                                            {sign}${Number(tx.amount).toFixed(2)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">{dateLabel}</Typography>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </Box>
            <ChatWidget />
        </Box>
    );
}

export default Dashboard;