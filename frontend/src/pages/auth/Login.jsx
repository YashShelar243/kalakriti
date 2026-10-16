
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Heart, LoaderCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login({
        email: form.email.trim(),
        password: form.password,
      })

      // Always send admins directly to the Admin Dashboard.
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
        return
      }

      // Customers return to the page they originally requested.
      const destination = location.state?.from

      const safeDestination =
        typeof destination === 'string' &&
        destination.startsWith('/') &&
        !destination.startsWith('//') &&
        destination !== '/login' &&
        destination !== '/register' &&
        !destination.startsWith('/admin')
          ? destination
          : '/shop'

      navigate(safeDestination, { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to log in. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-[#FFFDF9] shadow-xl md:grid-cols-2">
        <section className="flex flex-col justify-center bg-[#54232A] px-7 py-10 text-[#FFFDF9] sm:px-10 md:px-12">
          <Link
            to="/"
            className="text-sm text-[#E8D6B1] hover:underline"
          >
            ← Back to KalaKriti
          </Link>

          <Heart className="mb-5 mt-10 h-10 w-10 text-[#C5A15B]" />

          <p className="text-sm uppercase tracking-[0.25em] text-[#E8D6B1]">
            Welcome back
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Every Creation Tells a Story
          </h1>

          <p className="mt-5 leading-7 text-[#F1E5DC]">
            Sign in to continue your handmade shopping journey and discover
            creations made with care.
          </p>
        </section>

        <section className="px-6 py-10 sm:px-10 md:px-12 md:py-14">
          <h2 className="text-2xl font-bold text-[#54232A]">
            Sign in
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Enter your account details below.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-[#762C36] focus:ring-2 focus:ring-[#762C36]/15"
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
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 outline-none transition focus:border-[#762C36] focus:ring-2 focus:ring-[#762C36]/15"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((visible) => !visible)
                  }
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
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

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#762C36] px-4 py-3 font-semibold text-white transition hover:bg-[#54232A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              )}

              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#762C36] hover:underline"
            >
              Create account
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
