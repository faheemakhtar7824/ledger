export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    verifyOtp: '/auth/verify-otp',
    resendVerification: '/auth/resend-verification',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    me: '/auth/me',
  },
  spaces: {
    base: '/spaces',
    byId: (id) => `/spaces/${id}`,
  },
  categories: {
    base: (spaceId) => `/spaces/${spaceId}/categories`,
    byId: (spaceId, categoryId) => `/spaces/${spaceId}/categories/${categoryId}`,
  },
  expenses: {
    base: (spaceId) => `/spaces/${spaceId}/expenses`,
    byId: (spaceId, expenseId) => `/spaces/${spaceId}/expenses/${expenseId}`,
  },
  budgets: {
    base: (spaceId) => `/spaces/${spaceId}/budget`,
  },
  reports: {
    trend: (spaceId) => `/spaces/${spaceId}/reports/trend`,
    categoryBreakdown: (spaceId) => `/spaces/${spaceId}/reports/category-breakdown`,
    momComparison: (spaceId) => `/spaces/${spaceId}/reports/mom-comparison`,
    exportCsv: (spaceId) => `/spaces/${spaceId}/reports/export.csv`,
    exportPdf: (spaceId) => `/spaces/${spaceId}/reports/export.pdf`,
  },
};