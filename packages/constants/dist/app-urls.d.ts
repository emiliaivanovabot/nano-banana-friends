export interface AppUrls {
    platform: string;
    gemini: string;
    seedream: string;
}
export declare const PRODUCTION_URLS: AppUrls;
export declare const DEVELOPMENT_URLS: AppUrls;
export declare const getAppUrls: () => AppUrls;
export declare const getPlatformUrl: () => string;
export declare const getGeminiUrl: () => string;
export declare const getSeedreamUrl: () => string;
export declare const navigateToApp: (app: keyof AppUrls, path?: string, target?: string) => void;
export declare const getApiEndpoint: (app: keyof AppUrls, endpoint: string) => string;
//# sourceMappingURL=app-urls.d.ts.map