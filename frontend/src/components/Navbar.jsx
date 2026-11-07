import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const links = [
  ['/marketplace', 'Marketplace'],
  ['/auctions', 'Auctions'],
  ['/services', 'Services'],
  ['/exchanges', 'Exchanges'],
  ['/dashboard', 'My Dashboard'],
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const socket = useSocket()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return undefined
    let active = true
    api('/api/notifications/unread-count').then((res) => { if (active) setUnread(res.data.count) }).catch(() => {})
    return () => { active = false }
  }, [user])

  useEffect(() => {
    if (!socket) return undefined
    const onNotification = () => setUnread((count) => count + 1)
    socket.on('notification', onNotification)
    return () => socket.off('notification', onNotification)
  }, [socket])

  const itemClass = ({ isActive }) => `rounded-full px-3 py-2 text-sm font-semibold ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-slate-950">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-indigo-600 text-sm text-white">CK</span>
          CampusKart
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink to="/" className={itemClass} end>Home</NavLink>
          {links.map(([to, label]) => <NavLink key={to} to={to} className={itemClass}>{label}</NavLink>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to="/notifications" className="btn-ghost relative">
                Notifications
                {unread > 0 && <span className="ml-1 rounded-full bg-indigo-600 px-1.5 text-xs text-white">{unread}</span>}
              </Link>
              <Link to="/profile" className="btn-secondary">Profile</Link>
              {user.role === 'admin' && <Link to="/admin" className="btn-secondary">Admin</Link>}
              <button className="btn-ghost" type="button" onClick={async () => { await logout(); navigate('/') }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Join</Link>
            </>
          )}
        </div>
        <button className="btn-secondary lg:hidden" type="button" onClick={() => setOpen((value) => !value)}>Menu</button>
      </div>
      {open && (
        <div className="space-y-1 border-t border-slate-100 px-4 py-3 lg:hidden">
          <Link className="block rounded-xl px-3 py-2 font-semibold" to="/" onClick={() => setOpen(false)}>Home</Link>
          {links.map(([to, label]) => (
            <Link key={to} className="block rounded-xl px-3 py-2 font-semibold" to={to} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          <Link className="block rounded-xl px-3 py-2 font-semibold" to="/notifications" onClick={() => setOpen(false)}>Notifications</Link>
          <Link className="block rounded-xl px-3 py-2 font-semibold" to="/profile" onClick={() => setOpen(false)}>Profile</Link>
        </div>
      )}
    </header>
  )
}
