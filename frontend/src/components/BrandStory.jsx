
import { ArrowRight, Heart, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'

function BrandStory() {
  const navigate = useNavigate()

  function exploreProducts() {
    navigate('/shop')
  }

  return (
    <section
      id="story"
      className="scroll-mt-24 overflow-hidden bg-ivory"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* Brand image */}
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full border border-gold/50 sm:-left-6 sm:-top-6 sm:h-32 sm:w-32" />

          <div className="relative overflow-hidden rounded-2xl border-4 border-warm-white shadow-xl sm:border-8">
            <img
              src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=80"
              alt="Creative workspace representing the care behind handmade artistry"
              loading="lazy"
              className="h-72 w-full object-cover sm:h-96"
            />
          </div>

          <div className="absolute -bottom-5 -right-2 rounded-xl border border-gold/20 bg-warm-white px-4 py-3 shadow-lg sm:right-[-12px] sm:px-6 sm:py-4">
            <div className="flex items-center gap-2">
              <Heart size={17} className="text-maroon" />
              <p className="font-display text-base italic text-maroon sm:text-lg">
                Made with love
              </p>
            </div>
            <p className="mt-1 text-[10px] tracking-wider text-burgundy/65 sm:text-xs">
              INSPIRED BY CREATIVITY
            </p>
          </div>
        </div>

        {/* Brand story */}
        <div className="pt-3 lg:pl-6">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-maroon sm:text-sm">
            <Sparkles size={16} className="text-gold" />
            A story in every creation
          </p>

          <h2 className="mt-5 font-display text-3xl leading-tight text-burgundy sm:text-4xl lg:text-5xl">
            Handmade is more than a craft.
            <span className="mt-1 block italic text-maroon">
              It's a feeling.
            </span>
          </h2>

          <p className="mt-6 text-sm leading-7 text-burgundy/75 sm:text-base sm:leading-8">
            At KalaKriti, we celebrate the joy of creativity and the beauty
            of thoughtful details. From festive rangoli decorations to
            cozy woolen art, charming home decor and meaningful gifts,
            discover creations that bring warmth, color and character
            into your life.
          </p>

          <p className="mt-4 text-sm leading-7 text-burgundy/75 sm:text-base sm:leading-8">
            Every creation tells a story. Find something special for your
            home, your celebrations, or someone you love.
          </p>

          <div className="mt-8">
            <Button onClick={exploreProducts}>
              Discover Our Collection
              <ArrowRight size={17} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BrandStory
