
import {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

function getSavedUser() {
  try {
    const token = localStorage.getItem('kalakriti-token')
    const savedUser = localStorage.getItem('kalakriti-user')

    if (!token || !savedUser) return null

    return JSON.parse(savedUser)
  } catch {
    localStorage.removeItem('kalakriti-token')
    localStorage.removeItem('kalakriti-user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser)

  const saveSession = useCallback((userData, token) => {
    localStorage.setItem('kalakriti-token', token)
    localStorage.setItem('kalakriti-user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    const { user: userData, token } = response.data.data

    saveSession(userData, token)
    return userData
  }, [saveSession])

  const register = useCallback(async (details) => {
    const response = await api.post('/auth/register', details)
    const { user: userData, token } = response.data.data

    saveSession(userData, token)
    return userData
  }, [saveSession])

  const logout = useCallback(() => {
    localStorage.removeItem('kalakriti-token')
    localStorage.removeItem('kalakriti-user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
