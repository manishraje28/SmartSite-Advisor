import Button from '../common/Button';

export default function HeroSection({
  title,
  subtitle,
  ctaText = "Get Started",
  ctaLink = "#",
  secondaryCtaText = null,
  secondaryCtaLink = null,
  backgroundImage = null,
  children
}) {
  return (
    <section className="gradient-hero py-20 sm:py-28 md:py-32 rounded-4xl mb-20 overflow-hidden relative">
      {backgroundImage && (
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      <div className="container-wide relative z-10 text-center">
        <h1 className="mb-6 text-white">
          {title}
        </h1>

        {subtitle && (
          <p className="text-xl text-white opacity-95 mb-10 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}

        {children && (
          <div className="mb-8">
            {children}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => window.location.href = ctaLink}
          >
            {ctaText}
          </Button>

          {secondaryCtaText && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.location.href = secondaryCtaLink}
            >
              {secondaryCtaText}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
