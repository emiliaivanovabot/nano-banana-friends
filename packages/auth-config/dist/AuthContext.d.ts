import React from 'react';
import { type User } from './auth-utils';
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    requiresOnboarding: boolean;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<{
        success: boolean;
        requiresOnboarding: boolean;
        error: string | null;
    }>;
    logout: () => boolean;
    completeOnboarding: () => boolean;
    clearError: () => void;
    isReadyForApp: () => boolean;
}
export declare function useAuth(): AuthContextType;
export interface AuthProviderProps {
    children: React.ReactNode;
    onUserChange?: (user: User | null) => void;
    onLogin?: (user: User) => void;
    onLogout?: () => void;
}
export declare function AuthProvider({ children, onUserChange, onLogin, onLogout }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AuthContext.d.ts.map