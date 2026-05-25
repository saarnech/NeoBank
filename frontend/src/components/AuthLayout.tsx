import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex' }}>
            {/* Left pane — branding */}
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flex: '0 0 40%',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: 6,
                    color: 'primary.contrastText',
                    backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                }}
            >
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    NeoBank
                </Typography>

                <Box>
                    <Typography variant="h3" sx={{ mb: 2, fontWeight: 700, letterSpacing: '-0.02em' }}>
                        Banking, simplified.
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.7, maxWidth: 380 }}>
                        Send money instantly, see your balance at a glance, and get help from an AI assistant — all in one place.
                    </Typography>
                </Box>

                <Typography variant="body2" sx={{ opacity: 0.5 }}>
                    © 2026 NeoBank
                </Typography>
            </Box>

            {/* Right pane — form */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 3, md: 6 },
                }}
            >
                <Box sx={{ width: '100%', maxWidth: 420 }}>
                    {/* Brand only shows on mobile (left pane is hidden then) */}
                    <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4, textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            NeoBank
                        </Typography>
                    </Box>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}

export default AuthLayout;