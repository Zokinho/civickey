export interface BilingualText {
  en: string;
  fr: string;
}

export interface MunicipalityColors {
  primary: string;
  primaryDark?: string;
  primaryLight?: string;
  accent?: string;
  secondary?: string;
  background?: string;
}

export interface NavigationItem {
  id: string;
  label: BilingualText;
  type: 'link' | 'dropdown';
  linkType?: 'builtin' | 'page' | 'external';
  builtinPage?: 'home' | 'collections' | 'events' | 'news' | 'facilities';
  pageSlug?: string;
  externalUrl?: string;
  children?: NavigationChild[];
}

export interface NavigationChild {
  id: string;
  label: BilingualText;
  linkType: 'builtin' | 'page' | 'external';
  builtinPage?: 'home' | 'collections' | 'events' | 'news' | 'facilities';
  pageSlug?: string;
  externalUrl?: string;
}

export interface WebsiteSettings {
  enabled: boolean;
  subdomain?: string;
  heroTagline?: BilingualText;
  heroImage?: string;
  heroImagePosition?: string;
  navigation?: NavigationItem[];
  footer?: {
    address?: string;
    phone?: string;
    email?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  customDomain?: string;
  domainVerified?: boolean;
}

export interface MunicipalityConfig {
  id: string;
  name: string;
  nameEn?: string;
  nameFr?: string;
  colors: MunicipalityColors;
  logo?: string;
  website?: WebsiteSettings;
  active?: boolean;
}

export interface Event {
  id: string;
  title: BilingualText;
  description: BilingualText;
  date: string;
  time: string;
  endTime?: string;
  endDate?: string;
  multiDay?: boolean;
  location: string;
  address?: string;
  category: string;
  ageGroup?: string;
  residents?: boolean;
  maxParticipants?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Alert {
  id: string;
  title: BilingualText;
  message: BilingualText;
  type: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Facility {
  id: string;
  name: BilingualText;
  description: BilingualText;
  address?: string;
  phone?: string;
  email?: string;
  hours?: FacilityHours;
  category?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacilityHours {
  [day: string]: { open: string; close: string } | null;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ScheduleData {
  collectionTypes: CollectionType[];
  schedules: Record<string, ZoneSchedule>;
  guidelines?: Record<string, BilingualText>;
}

export interface CollectionType {
  id: string;
  name: BilingualText;
  color: string;
  icon?: string;
}

export interface CollectionScheduleEntry {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  frequency: string; // "weekly" | "biweekly" | "monthly"
  startDate?: string;
  time?: string;
}

export interface ZoneSchedule {
  [collectionTypeId: string]: CollectionScheduleEntry;
}

export type PageType = 'text' | 'info-cards' | 'pdf' | 'council' | 'links' | 'contact';

export interface CustomPage {
  id: string;
  slug: string;
  title: BilingualText;
  type: PageType;
  status: 'draft' | 'published';
  showInMenu: boolean;
  menuSection?: 'services' | 'city';
  menuOrder?: number;
  content?: PageContent;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageContent {
  // Text page
  body?: BilingualText;
  featuredImage?: string;
  contactInfo?: { phone?: string; email?: string };

  // Info cards page
  intro?: BilingualText;
  cards?: InfoCard[];

  // PDF page
  description?: BilingualText;
  documents?: PdfDocument[];

  // Council page
  members?: CouncilMember[];

  // Links page
  categories?: LinkCategory[];

  // Contact page
  mainAddress?: string;
  mainPhone?: string;
  mainEmail?: string;
  hours?: BilingualText;
  departments?: Department[];
}

export interface InfoCard {
  title: BilingualText;
  description: BilingualText;
  icon?: string;
  image?: string;
}

export interface PdfDocument {
  title: BilingualText;
  url: string;
  description?: BilingualText;
}

export interface CouncilMember {
  name: string;
  role: BilingualText;
  photo?: string;
  email?: string;
  phone?: string;
}

export interface LinkCategory {
  title: BilingualText;
  links: { title: BilingualText; url: string; icon?: string }[];
}

export interface Department {
  name: BilingualText;
  phone?: string;
  email?: string;
  hours?: BilingualText;
}

export type Locale = 'fr' | 'en';
