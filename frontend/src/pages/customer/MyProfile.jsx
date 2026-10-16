
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, Mail, Phone, Save, ArrowLeft, LoaderCircle, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function MyProfile() {
  const { user, login } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        setLoading(true)
        setError('')

        const response = await api.get('/auth/me')
        const profile = response.data?.data?.user

        if (!response.data?.success || !profile) {
          throw new Error('Unable to load your profile.')
        }

        if (!cancelled) {
          setFormData({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Unable to load your profile.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) return

    if (formData.name.trim().length < 2 || formData.name.trim().length > 120) {
      setError('Name must be between 2 and 120 characters.')
      return
    }

    if (formData.phone.trim().length > 20) {
      setError('Phone number must not exceed 20 characters.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await api.put('/auth/me', {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      })

      const updatedUser = response.data?.data?.user

      if (!response.data?.success || !updatedUser) {
        throw new Error(response.data?.message || 'Unable to update your profile.')
      }

      setFormData({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
      })

      // Update the displayed user in the app if AuthContext exposes its login method.
      if (typeof login === 'function') {
        // The profile is saved on the server; the page will reload profile data next time.
      }

      setSuccess('Your profile has been updated successfully.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to update your profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm text-burgundy outline-none transition focus:border-maroon focus:ring-1 focus:ring-maroon'

  if (loading) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center bg-warm-white text-burgundy/70">
        <LoaderCircle size={30} className="animate-spin text-maroon" />
        <p className="mt-4 text-sm">Loading your profile...</p>
      </section>
    )
  }

  return (
    <main className="min-h-screen bg-warm-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-maroon hover:text-gold"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            Your KalaKriti account
          </p>
          <h1 className="mt-3 font-display text-3xl text-burgundy sm:text-4xl">
            My Profile
          </h1>
          <p className="mt-3 text-sm leading-6 text-burgundy/70">
            Keep your contact details up to date for a smoother shopping experience.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-gold/20 bg-ivory/50 p-5 sm:p-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-maroon">
              <UserRound size={28} />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl text-burgundy">
                Account Details
              </h2>
              <p className="mt-1 break-all text-sm text-burgundy/65">
                {user?.email || formData.email}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 size={18} />
                {success}
              </div>
            )}

            <div>
              <label htmlFor="profile-name" className="text-sm font-medium text-burgundy">
                Full Name
              </label>
              <div className="relative">
                <UserRound size={17} className="absolute left-4 top-[26px] text-burgundy/50" />
                <input
                  id="profile-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  className={`${inputClass} pl-11`}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-email" className="text-sm font-medium text-burgundy">
                Email Address
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-[26px] text-burgundy/50" />
                <input
                  id="profile-email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-ivory/60 pl-11`}
                />
              </div>
              <p className="mt-2 text-xs text-burgundy/55">
                Email address cannot be changed here.
              </p>
            </div>

            <div>
              <label htmlFor="profile-phone" className="text-sm font-medium text-burgundy">
                Mobile Number
              </label>
              <div className="relative">
                <Phone size={17} className="absolute left-4 top-[26px] text-burgundy/50" />
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  maxLength={20}
                  className={`${inputClass} pl-11`}
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gold/20 pt-6 sm:flex-row sm:justify-end">
              <Link
                to="/my-orders"
                className="inline-flex items-center justify-center rounded-full border border-maroon px-6 py-3 text-sm font-medium text-maroon transition hover:bg-ivory"
              >
                View My Orders
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm font-medium text-white transition hover:bg-burgundy disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

export default MyProfile
