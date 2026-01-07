// UI Components
export * from './ui';

// Icons & Flags
export * from './icons';

// Support
export * from './support';

// Providers
export * from './providers';

// Cache Management
export { default as CacheBuster } from './CacheBuster';

// Prefetch & Smart Navigation
export { default as PrefetchRoutes, usePrefetchRoutes, usePrefetchOnHover } from './PrefetchRoutes';
export { default as GlobalPrefetch } from './GlobalPrefetch';
export { default as SmartLink } from './SmartLink';
// INSTANT NAVIGATION - мгновенные переходы
export { 
  default as InstantNavigation, 
  CriticalRoutesPrefetch, 
  useInstantNavigate,
  useNavigation,
  NavigationProvider 
} from './InstantNavigation';
export { default as TurboLink, useInstantLink } from './TurboLink';