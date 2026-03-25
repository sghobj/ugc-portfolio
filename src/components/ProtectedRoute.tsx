import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  clearUgcAdminToken,
  getUgcAdminToken,
  validateUgcAdminToken,
} from '@/lib/ugcAdminAuth'

type AuthStatus = 'checking' | 'authorized' | 'unauthorized'

export const ProtectedRoute = () => {
  const location = useLocation()
  const [status, setStatus] = useState<AuthStatus>('checking')

  useEffect(() => {
    let isMounted = true
    const token = getUgcAdminToken()

    if (!token) {
      setStatus('unauthorized')
      return () => {
        isMounted = false
      }
    }

    const checkAccess = async (): Promise<void> => {
      const isValid = await validateUgcAdminToken(token)

      if (!isMounted) {
        return
      }

      if (isValid) {
        setStatus('authorized')
        return
      }

      clearUgcAdminToken()
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
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
