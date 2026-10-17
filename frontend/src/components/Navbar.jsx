import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  UserRound,
  LogOut,
  Package,
  ChevronDown,
  LayoutDashboard,
  PlusCircle,
  Store,
  ClipboardList,
  Tags,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/shop' },
  { label: 'About', href: '/#story' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  const { cartCount } = useCart()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  const accountPath = isAdmin ? '/admin/dashboard' : '/account'

  function closeMenu() {
    setMenuOpen(false)
  }

  function closeNavigationMenus() {
    closeMenu()
    setProfileOpen(false)
  }

  function handleSearch(event) {
    event.preventDefault()

    const query = searchTerm.trim()
    if (!query) return

    setSearchOpen(false)
    closeNavigationMenus()
    navigate(`/shop?search=${encodeURIComponent(query)}`)
  }

  function handleLogout() {
    logout()
    setProfileOpen(false)
    closeMenu()
    navigate('/')
  }

  function isActive(link) {
    if (link.href === '/') {
      return location.pathname === '/'
    }

    if (link.href === '/shop') {
      return location.pathname === '/shop'
    }

    return (
      link.href === '/#story' &&
      location.pathname === '/' &&
      location.hash === '#story'
    )
  }

  function isAdminActive(path) {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard'
    }

    if (path === '/admin/store-overview') {
      return location.pathname === '/admin/store-overview'
    }

    if (path === '/admin/products') {
      return location.pathname === '/admin/products'
    }

    if (path === '/admin/categories') {
      return location.pathname === '/admin/categories'
    }

    if (path === '/admin/orders') {
      return location.pathname === '/admin/orders'
    }

    return false
  }

  function openAddProduct() {
    closeNavigationMenus()

    if (location.pathname === '/admin/products') {
      window.dispatchEvent(new Event('kalakriti:add-product'))
      return
    }

    navigate('/admin/products?add=true')
  }

  const adminNavLinks = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Store Overview',
      href: '/admin/store-overview',
      icon: Store,
    },
    {
      label: 'Manage Products',
      href: '/admin/products',
      icon: Package,
    },
    {
      label: 'Manage Categories',
      href: '/admin/categories',
      icon: Tags,
    },
    {
      label: 'Manage Orders',
      href: '/admin/orders',
      icon: ClipboardList,
    },
  ]

  return (
    <>
      {!isAdmin && (
        <div className="bg-burgundy px-3 py-2 text-center text-[10px] tracking-[0.12em] text-white sm:text-xs sm:tracking-[0.2em]">
          HANDMADE WITH LOVE · EVERY CREATION TELLS A STORY
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-gold/20 bg-warm-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-lg p-1 text-maroon transition hover:bg-maroon/5 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Brand */}
          <Link
            to={isAdmin ? '/admin/dashboard' : '/'}
            onClick={closeNavigationMenus}
            className="shrink-0"
          >
            <span className="block text-2xl font-bold tracking-tight text-maroon sm:text-3xl">
              KalaKriti<span className="text-gold">.</span>
            </span>

            <span className="mt-0.5 hidden text-[9px] tracking-[0.2em] text-burgundy sm:block sm:text-[10px]">
              {isAdmin
                ? 'ADMIN PANEL'
                : 'EVERY CREATION TELLS A STORY'}
            </span>
          </Link>

          {/* Desktop navigation */}
          {isAdmin ? (
            <nav className="hidden items-center gap-1 md:flex">
              {adminNavLinks.map((link) => {
                const Icon = link.icon
                const active = isAdminActive(link.href)

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={closeNavigationMenus}
                    className={`inline-flex items-center gap-2 rounded-xl px-2 py-2.5 text-xs font-medium transition lg:px-3 lg:text-sm ${
                      active
                        ? 'bg-maroon text-white shadow-sm'
                        : 'text-gray-700 hover:bg-maroon/5 hover:text-maroon'
                    }`}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                )
              })}

              <button
                type="button"
                onClick={openAddProduct}
                className="ml-1 inline-flex shrink-0 items-center gap-2 rounded-xl bg-gold px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-burgundy lg:px-4 lg:text-sm"
              >
                <PlusCircle size={17} />
                Add Product
              </button>
            </nav>
          ) : (
            <nav className="hidden items-center gap-6 text-sm md:flex lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`whitespace-nowrap transition hover:text-gold ${
                    isActive(link)
                      ? 'font-semibold text-maroon'
                      : 'text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Search, cart and profile */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            {!isAdmin && (
              <>
                <button
                  type="button"
                  aria-label={searchOpen ? 'Close search' : 'Search products'}
                  aria-expanded={searchOpen}
                  onClick={() => setSearchOpen((open) => !open)}
                  className={`transition hover:text-gold ${
                    searchOpen ? 'text-maroon' : ''
                  }`}
                >
                  {searchOpen ? <X size={21} /> : <Search size={21} />}
                </button>

                <Link
                  to="/cart"
                  aria-label={`Cart, ${cartCount} items`}
                  className="relative transition hover:text-gold"
                >
                  <ShoppingBag size={21} />

                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[10px] text-white">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {!isAuthenticated ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/login"
                  className="rounded-full border border-maroon px-4 py-2 text-sm font-medium text-maroon transition hover:bg-maroon hover:text-white"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="rounded-full bg-maroon px-4 py-2 text-sm font-medium text-white transition hover:bg-burgundy"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 rounded-full border border-gold/30 px-3 py-2 text-sm font-medium text-maroon transition hover:bg-maroon/5"
                >
                  <UserRound size={17} />
                  <span>{isAdmin ? 'Admin' : 'Profile'}</span>
                  <ChevronDown size={15} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-xl border border-gold/20 bg-white py-2 shadow-lg">
                    <div className="border-b border-gold/20 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-maroon">
                        {user?.name || 'Welcome'}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user?.email || ''}
                      </p>
                    </div>

                    {isAdmin ? (
                      <>
                        {adminNavLinks.map((link) => {
                          const Icon = link.icon

                          return (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={closeNavigationMenus}
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-ivory hover:text-maroon"
                            >
                              <Icon size={17} />
                              {link.label}
                            </Link>
                          )
                        })}

                        <button
                          type="button"
                          onClick={openAddProduct}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-ivory hover:text-maroon"
                        >
                          <PlusCircle size={17} />
                          Add Product
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/account"
                          onClick={closeNavigationMenus}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-ivory hover:text-maroon"
                        >
                          <UserRound size={17} />
                          My Profile
                        </Link>

                        <Link
                          to="/my-orders"
                          onClick={closeNavigationMenus}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-ivory hover:text-maroon"
                        >
                          <Package size={17} />
                          My Orders
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 border-t border-gold/20 px-4 py-3 text-left text-sm text-gray-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        {menuOpen && (
          <nav className="border-t border-gold/20 bg-warm-white px-5 py-3 md:hidden">
            {isAdmin ? (
              <>
                {adminNavLinks.map((link) => {
                  const Icon = link.icon
                  const active = isAdminActive(link.href)

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={closeNavigationMenus}
                      className={`flex items-center gap-3 border-b border-gold/10 py-3 text-sm ${
                        active
                          ? 'font-semibold text-maroon'
                          : 'text-gray-700'
                      }`}
                    >
                      <Icon size={18} />
                      {link.label}
                    </Link>
                  )
                })}

                <button
                  type="button"
                  onClick={openAddProduct}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-white"
                >
                  <PlusCircle size={18} />
                  Add Product
                </button>

                <div className="mt-3 border-t border-gold/10 py-3">
                  <p className="text-sm font-semibold text-maroon">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user?.email || ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 border-t border-gold/20 py-3 text-left text-sm text-gray-600"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={closeMenu}
                    className={`block border-b border-gold/10 py-3 text-sm transition hover:text-gold ${
                      isActive(link)
                        ? 'font-semibold text-maroon'
                        : 'text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                <Link
                  to="/cart"
                  onClick={closeMenu}
                  className="flex items-center justify-between border-b border-gold/10 py-3 text-sm hover:text-maroon"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag size={17} />
                    Cart
                  </span>

                  <span className="rounded-full bg-maroon/10 px-2 py-1 text-xs text-maroon">
                    {cartCount} items
                  </span>
                </Link>

                {!isAuthenticated ? (
                  <div className="flex gap-3 py-4">
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="flex-1 rounded-full border border-maroon px-4 py-2.5 text-center text-sm font-medium text-maroon"
                    >
                      Login
                    </Link>

                    <Link
                      to="/register"
                      onClick={closeMenu}
                      className="flex-1 rounded-full bg-maroon px-4 py-2.5 text-center text-sm font-medium text-white"
                    >
                      Register
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-gold/10 py-3">
                      <p className="text-sm font-semibold text-maroon">
                        {user?.name || 'My Account'}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user?.email || ''}
                      </p>
                    </div>

                    <Link
                      to={accountPath}
                      onClick={closeMenu}
                      className="flex items-center gap-2 py-3 text-sm text-maroon"
                    >
                      <UserRound size={17} />
                      My Account
                    </Link>

                    <Link
                      to="/my-orders"
                      onClick={closeMenu}
                      className="flex items-center gap-2 py-3 text-sm text-maroon"
                    >
                      <Package size={17} />
                      My Orders
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 border-t border-gold/20 py-3 text-left text-sm text-gray-600"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </>
                )}
              </>
            )}
          </nav>
        )}

        {/* Customer product search */}
        {searchOpen && !isAdmin && (
          <form
            onSubmit={handleSearch}
            className="border-t border-gold/20 bg-warm-white px-4 py-4"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-full border border-gold/40 bg-white px-4 focus-within:border-maroon">
              <Search size={19} className="shrink-0 text-maroon" />

              <input
                autoFocus
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search handmade creations..."
                aria-label="Search products"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />

              <button
                type="submit"
                className="rounded-full bg-maroon px-4 py-2 text-sm font-medium text-white transition hover:bg-burgundy"
              >
                Search
              </button>
            </div>
          </form>
        )}
      </header>
    </>
  )
}

export default Navbar