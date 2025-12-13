export interface User {
    id: string;
    username: string;
    model_id?: string;
    subscription_type?: string;
    is_active?: boolean;
    lastLogin?: string;
}
export interface AuthResult {
    success: boolean;
    user: User | null;
    error: string | null;
    requiresOnboarding: boolean;
    missingFields?: string[];
}
export interface SessionData {
    user: User;
    requiresOnboarding: boolean;
    loginTime: number;
    expiresAt: number;
}
/**
 * Hash password with bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify password against hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Authenticate user with username and password
 */
export declare function authenticateUser(username: string, password: string): Promise<AuthResult>;
/**
 * Session management utilities
 */
export declare const SessionManager: {
    /**
     * Store user session in localStorage
     */
    setSession(user: User, requiresOnboarding?: boolean): boolean;
    /**
     * Get user session from localStorage
     */
    getSession(): SessionData | null;
    /**
     * Clear user session
     */
    clearSession(): boolean;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Get current user from session
     */
    getCurrentUser(): User | null;
    /**
     * Check if user requires onboarding
     */
    requiresOnboarding(): boolean;
    /**
     * Update session to mark onboarding as completed
     */
    markOnboardingComplete(): void;
};
/**
 * Logout utility
 */
export declare function logout(): boolean;
//# sourceMappingURL=auth-utils.d.ts.map