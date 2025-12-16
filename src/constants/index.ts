// 应用常量定义

export const APP_CONFIG = {
  name: '蜗牛个人导航',
  version: '1.0.0',
  description: '现代化云端导航页面',
  githubUrl: 'https://github.com/eallion/favorite-cloudflare',
} as const

export const STORAGE_KEYS = {
  LOCAL_STORAGE_KEY: 'cloudnav_data_cache',
  AUTH_KEY: 'cloudnav_auth_token',
  CONFIG_KEY: 'config', // 统一配置
  SEARCH_CONFIG_KEY: 'search_config',
  CATEGORIES_CONFIG_KEY: 'cate_config',
  LINKS_CONFIG_KEY: 'links_config',
  // 本地存储专用（用户个人偏好）
  VIEW_MODE_KEY: 'cloudnav_view_mode',
} as const

export const API_ENDPOINTS = {
  STORAGE: '/api/storage',
  LINK: '/api/link',
  WEBDAV: '/api/webdav',
  AUTH: '/api/auth',
} as const

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : process.env.VITE_ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-auth-password',
  'Access-Control-Max-Age': '86400',
} as const

export const SECURITY_CONFIG = {
  maxInputLength: 1000,
  maxUrlLength: 2048,
  passwordMinLength: 8,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 小时
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 分钟
} as const

export const UI_CONFIG = {
  gridBreakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  animationDuration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  sidebarWidth: 320,
  headerHeight: 64,
} as const

export const DEFAULT_ICON_CONFIG = {
  source: 'faviconextractor' as const,
  faviconextractor: {
    enabled: true,
  },
  google: {
    enabled: false,
  },
  customapi: {
    enabled: false,
    url: '',
    headers: {},
  },
  customurl: {
    enabled: false,
    url: '',
  },
} as const
