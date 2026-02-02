/**
 * Common components – barrel export for clean imports.
 * Usage: import { Button, EmptyState, Skeleton } from '@/components/common';
 */
export { Button } from './Button';
export { Card } from './Card';
export { EmptyState } from './EmptyState';
export { ErrorView } from './ErrorView';
export { ErrorBoundary } from './ErrorBoundary';
export { LoadingScreen } from './LoadingScreen';
export { NotificationBadge } from './NotificationBadge';
export { OptimizedImage } from './OptimizedImage';
export {
  SkeletonBox,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonList,
  SkeletonAppointmentRow,
  SkeletonReviewRow,
} from './Skeleton';
export { StarRating } from './StarRating';
export { ToastProvider, useToast } from './Toast';
