// ─── API wrapper ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  pagination?: Pagination;
  isPreview?: boolean;
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
  fullName: string;
  username?: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  admin: AdminUser;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface UserAuthResponse {
  success: boolean;
  token: string;
  data: User;
}

export interface PurchaseAccess {
  _id?: string;
  userId: string;
  userEmail?: string;
  resourceId: string;
  sourceResourceId?: string;
  sourcePurchaseType: 'SINGLE_RESOURCE' | 'BUNDLE';
  status: 'PAID' | 'FAILED' | 'REFUNDED';
  accessType?: 'LIFETIME';
  paymentProvider?: string;
  stripeSessionId?: string;
  amountPaid?: number;
  createdAt?: string;
}

export interface LibraryItem {
  resource: Resource;
  sourcePurchaseType: 'SINGLE_RESOURCE' | 'BUNDLE';
  sourceResourceId?: string;
  bundleName?: string | null;
  accessType: 'LIFETIME' | 'SAVED_FREE';
}

export interface LibraryResponse {
  purchased: LibraryItem[];
  savedFree: LibraryItem[];
}

// ─── Resources / Learning Hub ────────────────────────────────────────────────

export type ResourceType     = 'PDF' | 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'BUNDLE';
export type ResourceCategory =
  | 'Interview Questions'
  | 'Certification Questions'
  | 'Useful Resources'
  | 'Multiple Choice Practice'
  | 'Short Answer / Flashcards';

export interface ResourcePricing {
  isFree: boolean;
  oldPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  autoCalculateDiscount?: boolean;
  currency?: string;
}

export interface ResourceLabels {
  bestSeller?: boolean;
  hotSelling?: boolean;
  isNew?: boolean;
  recommended?: boolean;
}

export interface ResourceCurriculumSection {
  sectionTitle: string;
  lessons: string[];
}

export interface Resource {
  _id?: string;
  title: string;
  slug?: string;
  description: string;
  category: ResourceCategory;
  type: ResourceType;
  thumbnailUrl?: string;
  pdfUrl?: string;
  previewPageLimit?: number;
  isPaid: boolean;
  price?: number;
  pricing?: ResourcePricing;
  labels?: ResourceLabels;
  isPublished: boolean;
  isFeatured: boolean;
  tags?: string[];
  displayOrder?: number;
  includedResourceIds?: string[];
  averageRating?: number;
  reviewCount?: number;
  // Extended detail fields
  fullDescription?: string;
  level?: 'Beginner → Intermediate' | 'Intermediate → Advanced' | 'All Levels';
  duration?: string;
  lessonCount?: number;
  whatYouWillLearn?: string[];
  curriculum?: ResourceCurriculumSection[];
  requirements?: string[];
  targetAudience?: string[];
  ownerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  _id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  resourceId?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewSummary {
  averageRating: number;
  count: number;
}

export interface McqQuestion {
  _id?: string;
  resourceId: string;
  question: string;
  choices: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  order?: number;
  phase?: 1 | 2;
}

export interface ShortAnswerCard {
  _id?: string;
  resourceId: string;
  question: string;
  answer: string;
  explanation?: string;
  order?: number;
  phase?: 1 | 2;
}

// ─── Course Progress ─────────────────────────────────────────────────────────

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface CourseProgress {
  _id?: string;
  userId?: string;
  resourceId?: string;
  completedItemIds: string[];
  currentItemId?: string | null;
  progressPercentage: number;
  status: ProgressStatus;
  startedAt?: string | null;
  lastAccessedAt?: string | null;
  completedAt?: string | null;
}

export interface AdminProgressRecord {
  _id?: string;
  userId?: string;
  userName: string;
  userEmail: string;
  resourceId?: string;
  resourceTitle: string;
  resourceType: string;
  progressPercentage: number;
  status: ProgressStatus;
  completedItemCount: number;
  startedAt?: string | null;
  lastAccessedAt?: string | null;
  completedAt?: string | null;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  resourceId: string;
  title: string;
  thumbnailUrl?: string;
  price: number;
  oldPrice?: number;
  discountPct?: number;
}

export interface CartData {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  subtotal: number;
  total: number;
  itemCount: number;
}

// ─── Coupon ───────────────────────────────────────────────────────────────────

export interface Coupon {
  _id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  scope: 'global' | 'course' | 'publisher';
  courseIds?: string[];
  publisherId?: string;
  maxRedemptions?: number;
  redemptionCount?: number;
  oneTimePerUser?: boolean;
  expiresAt?: string;
  minimumCartAmount?: number;
  active: boolean;
  createdBy?: string;
  createdAt?: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  resourceId: string;
  title?: string;
  ownerId?: string;
  priceAtPurchase: number;
  discountAtPurchase: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  publisherNetAmount: number;
}

export interface Order {
  _id?: string;
  userId: string;
  userEmail?: string;
  items: OrderItem[];
  couponCode?: string;
  grossAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentProvider: 'STRIPE';
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  createdAt?: string;
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export type PayoutStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface PayoutRequest {
  _id?: string;
  publisherId: string | { _id: string; fullName?: string; email?: string; publisherName?: string };
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  status: PayoutStatus;
  requestedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  orderIds?: string[];
  createdAt?: string;
}

export interface PublisherBalance {
  gross: number;
  feeTotal: number;
  net: number;
  platformFeePercent: number;
  minimumAmount: number;
  waitingDays: number;
  lastPayoutDate: string | null;
  nextEligibleDate: string | null;
  isEligible: boolean;
  ineligibleReason: string | null;
}

// ─── Publisher ────────────────────────────────────────────────────────────────

export interface PublisherAccount {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  publisherName?: string;
  bio?: string;
  role: 'publisher';
  isActive: boolean;
  createdAt?: string;
}

export interface PublisherStats {
  resourceCount: number;
  salesCount: number;
  grossRevenue: number;
  platformFees: number;
  netRevenue: number;
}

export interface PublisherSale {
  orderId: string;
  buyer?: { _id: string; name: string; email: string };
  resourceId: string;
  resourceTitle: string;
  priceAtPurchase: number;
  platformFeeAmount: number;
  publisherNet: number;
  paidAt: string;
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
