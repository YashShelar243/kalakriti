
function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref = '#products',
  align = 'left',
}) {
  return (
    <div
      className={`mb-9 flex flex-wrap items-end justify-between gap-4 ${
        align === 'center' ? 'text-center' : 'text-left'
      }`}
    >
      <div className={align === 'center' ? 'mx-auto' : ''}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-3 font-display text-3xl text-burgundy sm:text-4xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 text-sm leading-6 text-burgundy/70">
            {description}
          </p>
        )}
      </div>

      {actionLabel && (
        <a
          href={actionHref}
          className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-maroon transition hover:text-gold"
        >
          {actionLabel}
          <span aria-hidden="true">→</span>
        </a>
      )}
    </div>
  )
}

export default SectionHeading
