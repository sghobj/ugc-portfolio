import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  clearInstagramPanelToken,
  getInstagramPanelToken,
  validateInstagramPanelToken,
} from '@/lib/instagramPanelAuth'

type AuthStatus = 'checking' | 'authorized' | 'unauthorized'

export const ProtectedRoute = () => {
  const location = useLocation()
  const [status, setStatus] = useState<AuthStatus>('checking')

  useEffect(() => {
    let isMounted = true
    const token = getInstagramPanelToken()

    if (!token) {
      setStatus('unauthorized')
      return () => {
        isMounted = false
      }
    }

    const checkAccess = async (): Promise<void> => {
      const isValid = await validateInstagramPanelToken(token)

      if (!isMounted) {
        return
      }

      if (isValid) {
        setStatus('authorized')
        return
      }

      clearInstagramPanelToken()
      setStatus('unauthorized')
    }

    void checkAccess()

    return () => {
      isMounted = false
    }
  }, [location.pathname])

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="font-body text-sm text-muted-foreground">Checking access...</p>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return <Navigate to="/instagram-login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
