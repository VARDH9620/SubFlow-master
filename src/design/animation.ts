// src/design/animation.ts
// Centralized Framer Motion animation variants and timing constants

import type { Variants, Transition } from 'framer-motion';

/* ================================================================
   TIMING CONSTANTS
   ================================================================ */
export const timing = {
  micro: 0.25,
  medium: 0.45,
  hero: 0.8,
} as const;

/* ================================================================
   SPRING CONFIGS
   ================================================================ */
export const springSnappy: Transition = { type: 'spring', stiffness: 220, damping: 26 };
export const springGentle: Transition = { type: 'spring', stiffness: 140, damping: 22 };
export const springBouncy: Transition = { type: 'spring', stiffness: 180, damping: 16 };

/* ================================================================
   PAGE / SECTION VARIANTS
   ================================================================ */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: timing.medium } },
  exit: { opacity: 0, transition: { duration: timing.micro } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
  exit: { opacity: 0, y: 12, transition: { duration: timing.micro } },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: timing.micro } },
};

/* ================================================================
   STAGGER CONTAINERS
   ================================================================ */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 18 },
  },
};

/* ================================================================
   MICRO-INTERACTION HELPERS
   ================================================================ */
export const hoverLift = {
  whileHover: { y: -3, scale: 1.01 },
  whileTap: { scale: 0.98 },
  transition: springSnappy,
};

export const hoverGlow = {
  whileHover: { boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)' },
  transition: { duration: timing.medium },
};

export const pulseGlow: Variants = {
  idle: {
    boxShadow: [
      '0 0 0px rgba(99, 102, 241, 0)',
      '0 0 20px rgba(99, 102, 241, 0.15)',
      '0 0 0px rgba(99, 102, 241, 0)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

/* ================================================================
   TABLE ROW ANIMATION
   ================================================================ */
export const tableRowVariant = (index: number): Variants => ({
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.03, duration: timing.micro, ease: 'easeOut' },
  },
});

/* ================================================================
   MODAL / OVERLAY
   ================================================================ */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.93, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.15 } },
};

/* ================================================================
   TOAST
   ================================================================ */
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.12 } },
};

/* ================================================================
   REDUCED MOTION HOOK
   ================================================================ */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
