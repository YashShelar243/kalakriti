
import { ArrowRight, Sparkles, Heart, Palette } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'

function HeroSection() {
  const navigate = useNavigate()

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-ivory"
    >
      {/* Decorative background details */}
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full border border-gold/20" />
      <div className="pointer-events-none absolute -left-16 top-24 h-48 w-48 rounded-full border border-gold/20" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* Hero content */}
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-warm-white px-4 py-2">
            <Sparkles size={16} className="text-gold" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-maroon sm:text-xs">
              Thoughtfully made, beautifully yours
            </span>
          </div>

          <h1 className="max-w-2xl font-display text-4xl leading-[1.15] text-burgundy sm:text-5xl lg:text-6xl xl:text-7xl">
            Every creation
            <span className="mt-2 block italic text-maroon">
              tells a story.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-burgundy/75 sm:text-base sm:leading-8">
            Discover the beauty of handmade artistry. From vibrant rangoli
            designs and cozy woolen creations to thoughtful gifts and
            charming home decor, find something made to make your moments
            special.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              onClick={() => navigate('/shop')}
            >
              Explore Products
              <ArrowRight size={17} />
            </Button>

            <Button
              variant="secondary"
              onClick={() => scrollToSection('categories')}
            >
              Shop by Category
            </Button>
          </div>

          {/* Brand highlights */}
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-gold/30 pt-6">
            <div className="flex flex-col gap-2">
              <Heart size={20} className="text-maroon" />
              <p className="text-xs font-semibold text-burgundy sm:text-sm">
                Made with Care
              </p>
              <p className="text-[10px] leading-5 text-burgundy/65 sm:text-xs">
                Crafted with love
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Palette size={20} className="text-maroon" />
              <p className="text-xs font-semibold text-burgundy sm:text-sm">
                Unique Art
              </p>
              <p className="text-[10px] leading-5 text-burgundy/65 sm:text-xs">
                Creativity in every detail
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Sparkles size={20} className="text-maroon" />
              <p className="text-xs font-semibold text-burgundy sm:text-sm">
                Special Gifts
              </p>
              <p className="text-[10px] leading-5 text-burgundy/65 sm:text-xs">
                Made for your moments
              </p>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full border border-gold/60 sm:-right-5 sm:-top-5 sm:h-32 sm:w-32" />

          <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-full bg-maroon/5 sm:h-44 sm:w-44" />

          <div className="relative overflow-hidden rounded-t-[45%] rounded-b-2xl border-[5px] border-warm-white shadow-2xl sm:border-[8px]">
            <img
              src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1200&q=85"
              alt="Beautiful decorative pieces and thoughtfully styled home decor"
              className="h-[320px] w-full object-cover sm:h-[430px] lg:h-[500px]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-burgundy/35 via-transparent to-transparent" />
          </div>

          {/* Image caption */}
          <div className="absolute -bottom-5 left-3 right-3 rounded-xl border border-gold/20 bg-warm-white p-4 shadow-xl sm:bottom-6 sm:left-auto sm:right-[-12px] sm:max-w-xs sm:p-5">
            <p className="font-display text-lg italic text-maroon sm:text-xl">
              A little art, a lot of heart.
            </p>
            <p className="mt-1 text-[10px] tracking-[0.15em] text-burgundy/70 sm:text-xs">
              EVERY CREATION TELLS A STORY
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
