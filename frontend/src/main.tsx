import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0F172A',         // deep slate (fintech-feeling, not corporate-blue)
            light: '#334155',
            dark: '#020617',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#0EA5E9',         // cyan accent — buttons, highlights, links
            light: '#38BDF8',
            dark: '#0284C7',
            contrastText: '#ffffff',
        },
        background: {
            default: '#F8FAFC',      // off-white page background
            paper: '#ffffff',
        },
        text: {
            primary: '#0F172A',
            secondary: '#475569',
        },
        success: {
            main: '#10B981',         // emerald — positive transaction amounts
        },
        error: {
            main: '#EF4444',         // red — negative amounts, errors
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h3: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h4: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none',   // MUI uppercases buttons by default — disable
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 10,          // slightly rounder than MUI default (4)
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    paddingLeft: 18,
                    paddingRight: 18,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',  // removes MUI's subtle dark-mode gradient
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
        },
    },
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>,
)