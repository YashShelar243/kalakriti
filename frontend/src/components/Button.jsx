
import { LoaderCircle } from 'lucide-react'

function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
}) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

  const variants = {
    primary: 'bg-maroon text-white hover:bg-burgundy',
    secondary: 'border border-maroon/30 text-maroon hover:bg-ivory',
    gold: 'bg-gold text-burgundy hover:bg-gold/80',
    outline: 'border border-gold text-burgundy hover:bg-ivory',
  }

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
    >
      {loading && <LoaderCircle size={17} className="animate-spin" />}
      {children}
    </button>
  )
}

export default Button
