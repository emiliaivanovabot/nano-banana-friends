/**
 * Usage Tracking Utilities for daily_usage_history table
 * Extracted from monolith to @repo/business-logic package
 */
export interface UsageUpdateParams {
    userId: string;
    resolution: '1K' | '2K' | '4K';
    generationCount: number;
    generationTimeSeconds: number;
    promptTokens?: number;
    outputTokens?: number;
    costUsd?: number;
}
export interface DailyUsageRecord {
    id?: string;
    user_id: string;
    usage_date: string;
    cost_usd: number;
    generations_count: number;
    generation_time_seconds: number;
    count_1k: number;
    count_2k: number;
    count_4k: number;
    prompt_tokens: number;
    output_tokens: number;
    errors_count: number;
}
export interface UsageResult {
    success: boolean;
    data?: DailyUsageRecord;
    error?: string;
    updated?: boolean;
}
export interface AspectRatio {
    aspect_ratio: string;
    count: number;
    percentage: number;
}
/**
 * Update daily usage statistics
 */
export declare const updateDailyUsage: ({ userId, resolution, generationCount, generationTimeSeconds, promptTokens, outputTokens, costUsd }: UsageUpdateParams) => Promise<UsageResult>;
/**
 * Increment error count for today
 */
export declare const incrementErrorCount: (username: string) => Promise<UsageResult>;
/**
 * Get daily usage stats for a user using materialized view
 */
export declare const getDailyUsageHistory: (userId: string, days?: number) => Promise<{
    success: boolean;
    data: DailyUsageRecord[];
    error?: string;
}>;
/**
 * Get top aspect ratios used by user
 */
export declare const getTopAspectRatios: (userId: string, days?: number, limit?: number) => Promise<{
    success: boolean;
    data: AspectRatio[];
    error?: string;
}>;
/**
 * Get unified statistics combining daily_usage_history and generations tables
 * Returns real token counts from Gemini API instead of estimates
 */
export declare const getUnifiedGenerationStats: (userId: string, days?: number) => Promise<{
    success: boolean;
    data: DailyUsageRecord[];
    error?: string;
}>;
//# sourceMappingURL=usage-tracking.d.ts.map