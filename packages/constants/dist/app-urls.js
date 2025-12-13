// Application URLs for deployment configuration
// Shared constants across the monorepo
// Production URLs for Vercel deployment
export const PRODUCTION_URLS = {
    platform: 'https://platform.vercel.app',
    gemini: 'https://nano-banana.vercel.app',
    seedream: 'https://seedream.vercel.app'
};
// Development URLs (local)
export const DEVELOPMENT_URLS = {
    platform: 'http://localhost:3000',
    gemini: 'http://localhost:3001',
    seedream: 'http://localhost:3002'
};
// Environment-based URL getter
export const getAppUrls = () => {
    const isDevelopment = process.env.NODE_ENV === 'development' ||
        process.env.VERCEL_ENV === 'development' ||
        typeof window !== 'undefined' && window.location.hostname === 'localhost';
    return isDevelopment ? DEVELOPMENT_URLS : PRODUCTION_URLS;
};
// Individual app URL getters
export const getPlatformUrl = () => getAppUrls().platform;
export const getGeminiUrl = () => getAppUrls().gemini;
export const getSeedreamUrl = () => getAppUrls().seedream;
// Cross-app navigation helpers
export const navigateToApp = (app, path = '/', target = '_self') => {
    if (typeof window !== 'undefined') {
        const urls = getAppUrls();
        const url = `${urls[app]}${path}`;
        window.open(url, target);
    }
};
// API endpoint helpers
export const getApiEndpoint = (app, endpoint) => {
    const urls = getAppUrls();
    return `${urls[app]}/api${endpoint}`;
};
