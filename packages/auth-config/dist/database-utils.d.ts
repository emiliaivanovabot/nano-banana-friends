export interface ProfileCompletionResult {
    isComplete: boolean;
    missingFields: string[];
    user?: any;
}
export interface UserResult {
    user: any | null;
    error: any | null;
}
export interface UserProfile {
    id: string;
    username: string;
    email?: string;
    gemini_api_key?: string;
    hair_color?: string;
    eye_color?: string;
    skin_tone?: string;
    age_range?: string;
    default_resolution?: string;
    default_aspect_ratio?: string;
    favorite_prompts?: any;
    main_face_image_url?: string;
    face_2_image_url?: string;
    face_2_name?: string;
    face_3_image_url?: string;
    face_3_name?: string;
    created_at: string;
    last_login?: string;
    user_stats?: {
        daily_prompt_tokens: number;
        daily_output_tokens: number;
        daily_cost_usd: number;
        total_cost_usd: number;
        total_generations: number;
    };
}
/**
 * Check if user profile has all required fields completed
 * REQUIRED fields: gemini_api_key, main_face_image_url
 */
export declare function checkProfileCompletion(userId: string): Promise<ProfileCompletionResult>;
/**
 * Get user by username for login
 * Optimized query with proper indexing
 */
export declare function getUserByUsername(username: string): Promise<UserResult>;
/**
 * Update user's last login timestamp
 * Optimized single-field update
 */
export declare function updateLastLogin(userId: string): Promise<boolean>;
/**
 * Create user stats entry when profile is first completed
 * Ensures proper initialization of user_stats table
 */
export declare function initializeUserStats(userId: string): Promise<boolean>;
/**
 * Performance-optimized user profile fetch
 * Gets complete user profile with stats in single query
 */
export declare function getFullUserProfile(userId: string): Promise<{
    profile: UserProfile | null;
    error: any | null;
}>;
//# sourceMappingURL=database-utils.d.ts.map