import { jsx as _jsx } from "react/jsx-runtime";
// Authentication Context for global auth state management
// Extracted from monolith to @repo/auth-config package
import { createContext, useContext, useState, useEffect } from 'react';
import { SessionManager, authenticateUser, logout as authLogout } from './auth-utils';
const AuthContext = createContext(null);
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export function AuthProvider({ children, onUserChange, onLogin, onLogout }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [requiresOnboarding, setRequiresOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Initialize auth state from session on app start
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const session = SessionManager.getSession();
                if (session && session.user) {
                    setUser(session.user);
                    setIsAuthenticated(true);
                    setRequiresOnboarding(session.requiresOnboarding || false);
                    // Notify parent component of user change
                    onUserChange?.(session.user);
                }
                else {
                    setUser(null);
                    setIsAuthenticated(false);
                    setRequiresOnboarding(false);
                    // Notify parent component of user change
                    onUserChange?.(null);
                }
            }
            catch (error) {
                console.error('Error initializing auth', error);
                setUser(null);
                setIsAuthenticated(false);
                setRequiresOnboarding(false);
            }
            finally {
                setIsLoading(false);
            }
        };
        initializeAuth();
    }, [onUserChange]);
    /**
     * Login function with smart routing logic
     */
    const login = async (username, password) => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await authenticateUser(username, password);
            if (result.success && result.user) {
                // Set auth state
                setUser(result.user);
                setIsAuthenticated(true);
                setRequiresOnboarding(result.requiresOnboarding);
                // Store session
                SessionManager.setSession(result.user, result.requiresOnboarding);
                // Notify parent component
                onUserChange?.(result.user);
                onLogin?.(result.user);
                return {
                    success: true,
                    requiresOnboarding: result.requiresOnboarding,
                    error: null
                };
            }
            else {
                setError(result.error);
                return {
                    success: false,
                    requiresOnboarding: false,
                    error: result.error
                };
            }
        }
        catch (error) {
            const errorMessage = 'Login failed due to network error';
            setError(errorMessage);
            return {
                success: false,
                requiresOnboarding: false,
                error: errorMessage
            };
        }
        finally {
            setIsLoading(false);
        }
    };
    /**
     * Logout function
     */
    const logout = () => {
        try {
            const success = authLogout();
            if (success) {
                setUser(null);
                setIsAuthenticated(false);
                setRequiresOnboarding(false);
                setError(null);
                // Notify parent component
                onUserChange?.(null);
                onLogout?.();
            }
            else {
                setError('Logout failed');
            }
            return success;
        }
        catch (error) {
            console.error('Logout error', error);
            setError('Logout failed');
            return false;
        }
    };
    /**
     * Mark onboarding as completed
     */
    const completeOnboarding = () => {
        try {
            SessionManager.markOnboardingComplete();
            setRequiresOnboarding(false);
            return true;
        }
        catch (error) {
            console.error('Error completing onboarding', error);
            setError('Failed to complete onboarding');
            return false;
        }
    };
    /**
     * Clear any auth errors
     */
    const clearError = () => {
        setError(null);
    };
    /**
     * Check if user is authenticated and profile is complete
     */
    const isReadyForApp = () => {
        return isAuthenticated && !requiresOnboarding;
    };
    const contextValue = {
        // Auth state
        user,
        isAuthenticated,
        requiresOnboarding,
        isLoading,
        error,
        // Auth actions
        login,
        logout,
        completeOnboarding,
        clearError,
        // Helper functions
        isReadyForApp
    };
    return (_jsx(AuthContext.Provider, { value: contextValue, children: children }));
}
