import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { fmtDate } from '../lib/format.js'

const LABELS = {
  reply_to_discussion: 'Quelqu’un a répondu à ta discussion',
  reply_to_reply: 'Quelqu’un t’a répondu',
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  const load = useCallback(async () => {
    if (!supabase || !user) return
    const { data } = await supabase
      .from('notifications')
      .select('id, discussion_id, kind, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    setItems(data ?? [])
  }, [user])

  // Chargement au départ, puis toutes les minutes
  useEffect(() => {
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [load])

  // Fermer le menu en cliquant ailleurs
  useEffect(() => {
    function onClick(e) {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function markRead(id) {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
  }

  async function markAllRead() {
    setItems((list) => list.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
  }

  if (!user) return null

  const unread = items.filter((n) => !n.read_at).length

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) load() }}
        aria-label={unread > 0 ? `Notifications (${unread} non lues)` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-full p-2 hover:bg-brand-soft"
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-line bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs text-brand underline">
                Tout marquer comme lu
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">Rien de nouveau pour le moment.</p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    to={`/discussions/${n.discussion_id}`}
                    onClick={() => { markRead(n.id); setOpen(false) }}
                    className={`block rounded-xl px-3 py-2 text-sm hover:bg-brand-soft ${n.read_at ? 'text-muted' : 'font-medium'}`}
                  >
                    {LABELS[n.kind] ?? 'Nouvelle réponse'}
                    <span className="block text-xs font-normal text-muted">{fmtDate(n.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
