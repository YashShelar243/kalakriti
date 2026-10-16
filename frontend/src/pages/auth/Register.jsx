
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Heart, LoaderCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (form.password.length < 8 || form.password.length > 72) {
      setError('Password must contain 8 to 72 characters.')
      return
    }

    setLoading(true)

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      })

      navigate('/shop', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to create your account. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-[#FFFDF9] shadow-xl md:grid-cols-2">
        <section className="flex flex-col justify-center bg-[#54232A] px-7 py-10 text-[#FFFDF9] sm:px-10 md:px-12">
          <Link to="/" className="text-sm text-[#E8D6B1] hover:underline">
            ← Back to KalaKriti
          </Link>

          <Heart className="mb-5 mt-10 h-10 w-10 text-[#C5A15B]" />

          <p className="text-sm uppercase tracking-[0.25em] text-[#E8D6B1]">
            Made with love
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Discover handmade happiness.
          </h1>

          <p className="mt-5 leading-7 text-[#F1E5DC]">
            Create your account to make ordering your favourite handcrafted
            products simple and convenient.
          </p>
        </section>

        <section className="px-6 py-10 sm:px-10 md:px-12 md:py-12">
          <h2 className="text-2xl font-bold text-[#54232A]">Create account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the KalaKriti community.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#762C36] focus:ring-2 focus:ring-[#762C36]/15"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#762C36] focus:ring-2 focus:ring-[#762C36]/15"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Phone number <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={20}
                value={form.phone}
                onChange={handleChange}
                placeholder="Your phone number"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#762C36] focus:ring-2 focus:ring-[#762C36]/15"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 outline-none focus:border-[#762C36] focus:ring-2 focus:ring-[#762C36]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Enter password again"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#762C36] focus:ring-2 focus:ring-[#762C36]/15"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#762C36] px-4 py-3 font-semibold text-white transition hover:bg-[#54232A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle className="h-5 w-5 animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#762C36] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
