// ─── API wrapper ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Domain models ─────────────────────────────────────────────────────────────

export interface Project {
  _id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription?: string;
  category?: string;
  techStack?: string[];
  imageUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  problemSolved?: string;
  features?: string[];
  client?: string;
  completedAt?: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  _id?: string;
  title: string;
  slug?: string;
  shortDescription: string;
  fullDescription?: string;
  icon?: string;
  imageUrl?: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  phone?: string;
  company?: string;
  serviceInterest?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
}

// ─── Site content ─────────────────────────────────────────────────────────────

export interface SiteContentSection {
  _id?: string;
  key: string;
  section?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  primaryButtonText?: string;
  primaryButtonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  metadata?: Record<string, unknown>;
  updatedAt?: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface SiteSettings {
  _id?: string;
  businessName: string;
  founderName?: string;
  logoText: string;
  headerLogoUrl?: string;
  footerLogoUrl?: string;
  email: string;
  phone?: string;
  location?: string;
  domain?: string;
  socialLinks: {
    linkedin: string;
    github: string;
    twitter: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
  footerText: string;
  metaDescription?: string;
  metaKeywords?: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  admin: AdminUser;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  total: number;
  weekly: number;
  monthly: number;
  yearly: number;
  topPages: { path: string; count: number }[];
  daily: { date: string; count: number }[];
  devices: { device: string; count: number }[];
}
