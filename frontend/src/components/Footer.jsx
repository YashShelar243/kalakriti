
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Heart,
  MapPin,
  Mail,
} from 'lucide-react'

function Footer() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  function handleSubscribe(event) {
    event.preventDefault()

    setMessage(
      'Newsletter subscriptions are coming soon. Thank you for your interest!'
    )
    setEmail('')
  }

  return (
    <footer className="border-t border-gold/20 bg-warm-white">
      {/* Main footer */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8 lg:py-16">

        {/* Brand */}
        <div>
          <Link
            to="/"
            className="inline-block font-display text-3xl font-bold tracking-tight text-maroon"
          >
            KalaKriti<span className="text-gold">.</span>
          </Link>

          <p className="mt-2 text-[10px] font-medium tracking-[0.2em] text-burgundy/70 sm:text-xs">
            EVERY CREATION TELLS A STORY
          </p>

          <p className="mt-4 max-w-xs text-sm leading-7 text-burgundy/70">
            Discover thoughtfully crafted rangoli, beautiful woolen art,
            charming home decor and unique gifts made to bring creativity
            into your everyday life.
          </p>

          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit Instagram"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2.5 text-sm text-maroon transition hover:border-maroon hover:bg-maroon hover:text-white"
          >
            Instagram ↗
          </a>

          <div className="mt-5 flex items-center gap-2 text-xs text-burgundy/60">
            <Heart size={14} className="text-gold" />
            Handmade with love.
          </div>
        </div>

        {/* Explore */}
        <div>
          <h3 className="font-display text-xl text-burgundy">
            Explore
          </h3>

          <div className="mt-5 flex flex-col gap-3 text-sm text-burgundy/70">
            <Link
              to="/"
              className="transition hover:translate-x-1 hover:text-maroon"
            >
              Home
            </Link>

            <Link
              to="/shop"
              className="transition hover:translate-x-1 hover:text-maroon"
            >
              All Products
            </Link>

            <Link
              to="/#categories"
              className="transition hover:translate-x-1 hover:text-maroon"
            >
              Categories
            </Link>

            <Link
              to="/#story"
              className="transition hover:translate-x-1 hover:text-maroon"
            >
              About KalaKriti
            </Link>

            <Link
              to="/cart"
              className="transition hover:translate-x-1 hover:text-maroon"
            >
              Shopping Cart
            </Link>
          </div>
        </div>

        {/* Customer care */}
        <div>
          <h3 className="font-display text-xl text-burgundy">
            Customer Care
          </h3>

          <div className="mt-5 flex flex-col gap-3 text-sm text-burgundy/70">
            <Link
              to="/my-orders"
              className="transition hover:translate-x-1 hover:text-maroon"
            >
              My Orders
            </Link>

            <Link
              to="/account"
              className="transition hover:translate-x-1 hover:text-maroon"
            >
              My Profile
            </Link>

            <a
              href="mailto:support@kalakriti.example"
              className="flex items-center gap-2 transition hover:text-maroon"
            >
              <Mail size={15} />
              Contact Us
            </a>

            <div className="flex items-start gap-2 leading-6">
              <MapPin size={15} className="mt-1 shrink-0 text-gold" />
              <span>Celebrating handmade artistry across India</span>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="font-display text-xl text-burgundy">
            A Little Inspiration
          </h3>

          <p className="mt-5 text-sm leading-7 text-burgundy/70">
            Be the first to discover new handmade collections, festive
            creations and gift ideas.
          </p>

          <form
            className="mt-5 flex items-center gap-2 border-b border-gold/60 pb-2"
            onSubmit={handleSubscribe}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>

            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setMessage('')
              }}
              placeholder="Your email address"
              required
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-burgundy outline-none placeholder:text-burgundy/50"
            />

            <button
              type="submit"
              aria-label="Submit newsletter interest"
              className="rounded-full p-2 text-maroon transition hover:bg-maroon hover:text-white"
            >
              <ArrowRight size={20} />
            </button>
          </form>

          {message ? (
            <p
              role="status"
              className="mt-3 text-xs leading-5 text-burgundy/70"
            >
              {message}
            </p>
          ) : (
            <p className="mt-3 text-xs leading-5 text-burgundy/50">
              Newsletter sign-ups will be connected to a service later.
            </p>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gold/20 bg-ivory">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-xs text-burgundy/60 sm:px-6 md:flex-row md:text-left lg:px-8">
          <p>
            © {new Date().getFullYear()} KalaKriti. All rights reserved.
          </p>

          <p className="flex items-center gap-1">
            Made with <Heart size={12} className="text-maroon" /> and inspired
            by tradition.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
