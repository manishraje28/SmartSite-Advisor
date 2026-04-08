/**
 * SMARTSITE DESIGN SYSTEM
 *
 * A premium, modern UI/UX design system for AI-powered real estate platform
 *
 * COLOR PALETTE:
 * - Primary BG: #CCBBD9 (soft beige)
 * - Secondary: #FFF5B8 (warm yellow - cards)
 * - Accent: #FFB16E (orange - CTAs)
 * - Emphasis: #CCA25A (golden brown - headings)
 * - Text Dark: #2C1810
 * - Text Medium: #5C4033
 * - Success: #A8D5BA
 *
 * TYPOGRAPHY:
 * - Font: Poppins, Inter
 * - H1: 48px Bold
 * - H2: 32px Bold
 * - Body: 14px Regular
 *
 * SPACING:
 * - Base: 8px, 12px, 16px, 24px, 32px, 48px, 64px
 *
 * COMPONENTS:
 * ✓ Button (primary, secondary, tertiary)
 * ✓ Card (base, large, accent, flat)
 * ✓ Input (with validation, helper text)
 * ✓ Badge (accent, emphasis, success, danger)
 * ✓ HeroSection
 * ✓ FeatureCard
 * ✓ MetricCard
 * ✓ RecommendationCard
 * ✓ Navbar
 *
 * USAGE:
 * All components use Tailwind classes (smartsite namespace) and CSS utilities.
 * See src/index.css for base styles and src/tailwind.config.js for tokens.
 *
 * EXAMPLE:
 * import Button from './components/common/Button';
 * import Card from './components/common/Card';
 * import HeroSection from './components/sections/HeroSection';
 *
 * <HeroSection title="Welcome" />
 * <div className="grid-cols-cards">
 *   <Card variant="accent">Content</Card>
 * </div>
 * <Button variant="primary">Click me</Button>
 */

export const DesignSystem = {
  colors: {
    primary: '#CCBBD9',
    secondary: '#FFF5B8',
    accent: '#FFB16E',
    emphasis: '#CCA25A',
    text: {
      dark: '#2C1810',
      default: '#5C4033',
      muted: '#8B7355',
    },
    status: {
      success: '#A8D5BA',
      danger: '#FF6B6B',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },
  typography: {
    fonts: 'Poppins, Inter, -apple-system, sans-serif',
    headings: {
      h1: '48px Bold',
      h2: '32px Bold',
      h3: '24px Bold',
      h4: '18px Bold',
    },
    body: '14px Regular',
  },
  shadows: {
    xs: '0 2px 8px rgba(0, 0, 0, 0.05)',
    sm: '0 4px 16px rgba(204, 162, 90, 0.1)',
    md: '0 8px 32px rgba(204, 162, 90, 0.15)',
    lg: '0 12px 48px rgba(204, 162, 90, 0.2)',
    accent: '0 6px 20px rgba(255, 177, 110, 0.3)',
  },
  radius: {
    sm: '10px',
    md: '12px',
    lg: '14px',
    xl: '16px',
    full: '9999px',
  }
};

export default DesignSystem;
