import LandingPage from './components/LandingPage'
import OrderApp from './OrderApp'
import AdminPage from './components/AdminPage'
import MenuPage from './components/MenuPage'
import JoinPage from './pages/JoinPage'
import CashbackPage from './pages/CashbackPage'
import './App.css'
import { useEffect, useState } from 'react'

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const isOrderPage = pathname.startsWith('/order')
  const isAdminPage = pathname.startsWith('/admin')
  const isMenuPage = pathname.startsWith('/menu')
  const isJoinPage = pathname.startsWith('/join')
  const isCashbackPage = pathname.startsWith('/cashback')

  return (
    <>
      {isAdminPage ? (
        <AdminPage />
      ) : isJoinPage ? (
        <JoinPage />
      ) : isCashbackPage ? (
        <CashbackPage />
      ) : isOrderPage ? (
        <OrderApp />
      ) : isMenuPage ? (
        <MenuPage />
      ) : (
        <LandingPage />
      )}
    </>
  )
}

export default App
