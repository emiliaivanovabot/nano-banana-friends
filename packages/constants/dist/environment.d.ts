export type Environment = 'development' | 'production' | 'preview';
export interface EnvironmentConfig {
    NODE_ENV: string;
    VERCEL_ENV?: string;
    VERCEL_URL?: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isPreview: boolean;
    appName: string;
    version: string;
}
export declare const getEnvironment: () => Environment;
export declare const getEnvironmentConfig: () => EnvironmentConfig;
export declare const isDevelopment: () => boolean;
export declare const isProduction: () => boolean;
export declare const isPreview: () => boolean;
export declare const isDebugEnabled: () => boolean;
export declare const getFeatureFlags: () => {
    enableLogging: boolean;
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enableDevTools: boolean;
    strictMode: boolean;
};
export declare const getDatabaseConfig: () => {
    supabaseUrl: string | undefined;
    supabaseAnonKey: string | undefined;
    supabaseServiceKey: string | undefined;
    isDevelopment: boolean;
    isProduction: boolean;
};
//# sourceMappingURL=environment.d.ts.map