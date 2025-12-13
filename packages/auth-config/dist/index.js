// Main exports for @repo/auth-config package
// Extracted authentication system from monolith
export { AuthProvider, useAuth } from './AuthContext';
export { SessionManager, authenticateUser, logout, hashPassword, verifyPassword } from './auth-utils';
export { checkProfileCompletion, getUserByUsername, updateLastLogin, initializeUserStats, getFullUserProfile } from './database-utils';
