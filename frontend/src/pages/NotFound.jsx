
import { Link } from 'react-router-dom'
import Button from '../components/Button'

function NotFound() {
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-7xl text-gold">404</p>
      <h1 className="mt-4 font-display text-3xl text-burgundy">
        Page Not Found
      </h1>
      <p className="mt-3 text-sm text-burgundy/70">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </section>
  )
}

export default NotFound
