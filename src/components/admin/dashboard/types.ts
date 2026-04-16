import { SiteSettings } from "../../../types/site-settings";
import {
  AboutStatContentItem,
  GalleryContentItem,
  PackageContentItem,
  ReviewContentItem,
  ServiceContentItem,
  SiteContent
} from "../../../types/site-content";

export interface DashboardSummary {
  totalBlockedDates: number;
  nextBlockedDate: string | null;
  publicPhoneNumber: string;
  publicEmail: string;
  bookingEnabled: boolean;
  totalBookings: number;
  bookingsAwaitingResponse: number;
  upcomingConfirmedBookings: number;
  recentActivityCount: number;
}

export interface BlockedDateEntry {
  id: string;
  eventDate: string;
  status: "blocked" | "available";
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardState {
  settings: SiteSettings;
  content: SiteContent;
  summary: DashboardSummary | null;
  blockedDates: BlockedDateEntry[];
  newBlockedDate: string;
  newBlockedNote: string;
  calendarMonth: Date;
  loading: boolean;
  blockedLoading: boolean;
  contactMessage: string | null;
  packageMessage: string | null;
  bookingMessage: string | null;
  siteMessage: string | null;
  contentMessage: string | null;
  blockedMessage: string | null;
  contactError: string | null;
  packageError: string | null;
  bookingError: string | null;
  siteError: string | null;
  contentError: string | null;
  blockedError: string | null;
}

export type OrderedSetters = {
  setOrderedServices: (next: ServiceContentItem[]) => void;
  setOrderedPackages: (next: PackageContentItem[]) => void;
  setOrderedGallery: (next: GalleryContentItem[]) => void;
  setReviews: (next: ReviewContentItem[]) => void;
  setAboutStats: (next: AboutStatContentItem[]) => void;
};
