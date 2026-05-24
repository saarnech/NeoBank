import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    IconButton,
    CircularProgress,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { sendChatMessage, type ChatMessage } from '../api/chat';

function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    async function handleSend() {
        const trimmed = input.trim();
        if (!trimmed || isSending) return;

        setError(null);
        const userMessage: ChatMessage = { role: 'user', content: trimmed };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsSending(true);

        try {
            const reply = await sendChatMessage(updatedMessages);
            setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to get a reply. Please try again.';
            setError(message);
        } finally {
            setIsSending(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    if (!isOpen) {
        return (
            <IconButton
                onClick={() => setIsOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 60,
                    height: 60,
                    boxShadow: 3,
                    '&:hover': { bgcolor: 'primary.dark' },
                }}
                aria-label="Open chat"
            >
                <ChatIcon />
            </IconButton>
        );
    }

    return (
        <Paper
            elevation={6}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                width: 360,
                height: 500,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h6">Customer Support</Typography>
                <IconButton
                    onClick={() => setIsOpen(false)}
                    sx={{ color: 'white' }}
                    aria-label="Close chat"
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.50' }}>
                {messages.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                        Hi! Ask me anything about how NeoBank works.
                    </Typography>
                )}
                {messages.map((msg, i) => (
                    <Box
                        key={i}
                        sx={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            mb: 1,
                        }}
                    >
                        <Box
                            sx={{
                                maxWidth: '80%',
                                bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                                color: msg.role === 'user' ? 'white' : 'text.primary',
                                p: 1.5,
                                borderRadius: 2,
                                boxShadow: 1,
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            <Typography variant="body2">{msg.content}</Typography>
                        </Box>
                    </Box>
                ))}
                {isSending && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                        <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
                            <CircularProgress size={16} />
                        </Box>
                    </Box>
                )}
                {error && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {error}
                    </Typography>
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                />
                <Button
                    onClick={handleSend}
                    variant="contained"
                    disabled={!input.trim() || isSending}
                    aria-label="Send"
                >
                    <SendIcon fontSize="small" />
                </Button>
            </Box>
        </Paper>
    );
}

export default ChatWidget;