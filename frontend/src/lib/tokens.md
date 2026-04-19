/**
 * DESIGN TOKEN REFERENCE
 * Warm Study Studio Design System
 * 
 * This file documents all CSS custom properties (tokens) used in the app.
 * All colors, shadows, and layout values are centralized here for consistency.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   BRAND COLOR PALETTE
   Soft sage green with warm accents
   ═══════════════════════════════════════════════════════════════════════════ */

--brand-50:      #F4F8EB    /* Lightest - backgrounds, tints */
--brand-100:     #EDF3DC    /* Badge backgrounds */
--brand-200:     #DDF1B8    /* Hover states */
--brand-300:     #C2E887    /* Interactive hover */
--brand-400:     #9ECB5C    /* Secondary emphasis */
--brand-500:     #88B34A    /* PRIMARY - buttons, key accents */
--brand-600:     #719A3B    /* Button hover, focus states */
--brand-700:     #557827    /* Deep emphasis */
--brand-800:     #3E5B18    /* Very dark */
--brand-900:     #253A0A    /* Darkest - reserved for special cases */

/* ═══════════════════════════════════════════════════════════════════════════
   SURFACES - Background colors and card containers
   ═══════════════════════════════════════════════════════════════════════════ */

--surface-bg:        #F4F7EC    /* Main page background */
--surface-secondary: #FAFCF6    /* Secondary background variation */
--surface-card:      #FFFFFF    /* Card background, primary surface */
--surface-muted:     #E6ECCF    /* Muted/disabled areas, badges */
--surface-elevated:  #F1F6DF    /* Elevated surfaces (modals, popovers) */

/* ═══════════════════════════════════════════════════════════════════════════
   TEXT - Typography colors
   ═══════════════════════════════════════════════════════════════════════════ */

--text-primary:   #252D1B    /* Main text, headings */
--text-secondary: #394A28    /* Secondary text, subheadings */
--text-muted:     #5B753A    /* Subtle text, helper text */
--text-light:     #83A15D    /* Light text (use sparingly) */
--text-faint:     #A0B980    /* Faintest text, disabled states */

/* ═══════════════════════════════════════════════════════════════════════════
   BORDERS - Dividers and outlines
   ═══════════════════════════════════════════════════════════════════════════ */

--border-primary: #D1E5B9    /* Standard border color for cards, inputs */
--border-muted:   #E6ECCF    /* Subtle dividers, faint borders */
--border-accent:  rgba(136, 179, 74, 0.3)  /* Brand-colored borders */

/* ═══════════════════════════════════════════════════════════════════════════
   ACCENTS - Additional semantic colors
   ═══════════════════════════════════════════════════════════════════════════ */

--accent-amber:      #F4B940      /* Warm gold/amber for secondary CTAs */
--accent-amber-dark: #E18B2E      /* Darker amber for hover states */
--accent-success:    #22C55E      /* Green - success messages, progress */
--accent-danger:     #EF4444      /* Red - destructive actions, errors */
--accent-warning:    #F59E0B      /* Orange - warnings, caution */

/* ═══════════════════════════════════════════════════════════════════════════
   SHADOWS - Elevation and depth
   ═══════════════════════════════════════════════════════════════════════════ */

--shadow-xs:  0 1px 2px rgba(44, 51, 37, 0.04)       /* Subtle shadow */
--shadow-sm:  0 2px 8px rgba(44, 51, 37, 0.08)       /* Small card shadow */
--shadow-md:  0 4px 16px rgba(44, 51, 37, 0.12)      /* Medium elevation */
--shadow-lg:  0 8px 24px rgba(44, 51, 37, 0.15)      /* Large elevation */

/* ═══════════════════════════════════════════════════════════════════════════
   GLOWS - Soft glow effects for focus and hover
   ═══════════════════════════════════════════════════════════════════════════ */

--glow-brand:        rgba(136, 179, 74, 0.2)         /* Brand glow - default */
--glow-brand-hover:  rgba(136, 179, 74, 0.35)        /* Brand glow - hover/focus */
--glow-amber:        rgba(244, 185, 64, 0.15)        /* Amber glow for accent buttons */

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLLBAR - Webkit scrollbar styling
   ═══════════════════════════════════════════════════════════════════════════ */

--scrollbar-track:       #F0F4E8         /* Scrollbar track background */
--scrollbar-thumb:       #D1DCC0         /* Scrollbar thumb default */
--scrollbar-thumb-hover: #C2D9A8         /* Scrollbar thumb on hover */

/* ═══════════════════════════════════════════════════════════════════════════
   GRADIENTS - Multi-color backgrounds
   ═══════════════════════════════════════════════════════════════════════════ */

--gradient-card:    linear-gradient(135deg, #FFFFFF 0%, #F7FAF2 100%)
--gradient-sidebar: linear-gradient(180deg, #F9FAF7 0%, #EDF2E8 100%)
--gradient-hero:    linear-gradient(135deg, #88B34A 0%, #557827 100%)

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY - Miscellaneous
   ═══════════════════════════════════════════════════════════════════════════ */

--input-bg:      #FFFFFF          /* Input/textarea background */
--overlay-bg:    rgba(44, 51, 37, 0.25)  /* Modal overlay */
--noise-opacity: 0.035            /* Background noise texture opacity */

/* ═══════════════════════════════════════════════════════════════════════════
   DARK MODE OVERRIDES
   
   In html.dark context, these tokens are redefined for dark mode.
   All component styles remain the same; only the token values change.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Dark mode uses a deep forest palette with luminous green highlights */
/* html.dark overrides all the above tokens with dark-appropriate values */

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT CLASSES (defined in globals.css)
   ═══════════════════════════════════════════════════════════════════════════ */

.card {
  /* Uses: --gradient-card, --border-primary, --shadow-sm */
  /* Semantic: Primary container for content */
}

.btn-primary {
  /* Uses: --brand-500, --brand-600, --glow-brand */
  /* Semantic: Main action button */
}

.btn-secondary {
  /* Uses: --border-primary, --surface-muted */
  /* Semantic: Secondary action */
}

.btn-accent {
  /* Uses: --accent-amber, --glow-amber */
  /* Semantic: Special/upgrade action */
}

.badge {
  /* Uses: --surface-muted, --text-muted */
  /* Semantic: Status indicator */
}

.input {
  /* Uses: --input-bg, --border-primary, --brand-500 (focus) */
  /* Semantic: Form input */
}

.progress-bar {
  /* Uses: --border-primary for track, --brand-500 for fill */
  /* Semantic: Progress indicator */
}

/* ═══════════════════════════════════════════════════════════════════════════
   USAGE GUIDELINES
   ═══════════════════════════════════════════════════════════════════════════ */

/*
  DO USE:
  - CSS custom properties (var(--token-name)) for all colors and shadows
  - Component classes (.card, .btn-primary, etc.) instead of utility combos
  - Semantic naming: text-primary, surface-bg, border-muted
  - Group related tokens (all brand colors, all surfaces, etc.)

  DON'T USE:
  - Hard-coded hex colors (always use tokens)
  - Tailwind arbitrary colors like bg-slate-900
  - Mixed naming schemes (var(--bg-primary) + var(--surface-bg))
  - Theme-specific colors outside of html.dark context

  MODIFYING TOKENS:
  1. Update values in :root for light mode
  2. Update values in html.dark for dark mode
  3. All components automatically inherit new values
  4. No page-by-page changes needed (scalable!)
*/
