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
                <Paper sx={{ p: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Your balance
                        </Typography>
                        <Typography variant="h3" sx={{ mb: 1 }}>
                            ${user?.balance ?? '0.00'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {user?.email}
                        </Typography>
                    </Box>
                    <Button onClick={handleSendMoney} variant="contained" size="large">
                        Send money
                    </Button>
                </Paper>

                {/* Transactions */}
                <Typography variant="h5" sx={{ mb: 2 }}>
                    Recent transactions
                </Typography>

                {transactions.length === 0 ? (
                    <Typography color="text.secondary">
                        No transactions yet. Send some money to get started.
                    </Typography>
                ) : (
                    <Stack spacing={1}>
                        {transactions.map((tx) => {
                            const isSender = tx.senderEmail === user?.email;
                            const counterparty = isSender ? tx.recipientEmail : tx.senderEmail;
                            const sign = isSender ? '-' : '+';
                            const dateLabel = new Date(tx.createdAt).toLocaleDateString();
                            return (
                                <Paper key={tx.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                        <Typography sx={{ minWidth: 100 }} color="text.secondary">
                                            {isSender ? 'Sent to' : 'Received from'}
                                        </Typography>
                                        <Typography>{counterparty}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                        <Typography color={isSender ? 'error.main' : 'success.main'}>
                                            {sign}${tx.amount}
                                        </Typography>
                                        <Typography color="text.secondary">{dateLabel}</Typography>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

export default Dashboard;