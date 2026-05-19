import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

function PublicOnlyRoute({ children }: { children: ReactNode }) {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

export default PublicOnlyRoute;