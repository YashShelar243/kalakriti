
import { ArrowRight, Sparkles, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'

function PromoBanner() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-burgundy px-4 py-14 text-center text-white sm:px-6 sm:py-20">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full border border-gold/20 sm:h-64 sm:w-64" />
      <div className="pointer-events-none absolute -right-16 -bottom-20 h-56 w-56 rounded-full border border-gold/20 sm:h-72 sm:w-72" />

      <div className="relative mx-auto max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold sm:text-sm">
          <Sparkles size={16} />
          A thoughtful touch
        </p>

        <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
          Make every celebration
          <span className="mt-2 block italic text-gold">
            a little more beautiful.
          </span>
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
          Explore handcrafted treasures made for your home, your loved
          ones, and the moments worth remembering. Find something unique
          that tells your story.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            variant="gold"
            onClick={() => navigate('/shop')}
          >
            Explore Products
            <ArrowRight size={17} />
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs tracking-wide text-white/70">
          <Heart size={14} className="text-gold" />
          Every creation tells a story.
        </div>
      </div>
    </section>
  )
}

export default PromoBanner
