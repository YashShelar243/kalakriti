
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function MainLayout() {
  return (
    <div className="min-h-screen bg-warm-white">
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default MainLayout

