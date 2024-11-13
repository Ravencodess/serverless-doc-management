import { useAuthenticator } from '@aws-amplify/ui-react';
import { Navigate, Outlet } from 'react-router-dom';

const AuthLayout = () => {
    const { authStatus } = useAuthenticator((context) => [context.authStatus]);

    return authStatus === 'authenticated' ? (
        <Outlet />
    ) : (
        <Navigate to="/login" replace />
    );
};

export default AuthLayout;