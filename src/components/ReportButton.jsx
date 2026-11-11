import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'

export default function ReportButton({ discussionId, replyId }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [state, setState] = useState('')

  if (!user) return <Link to="/connexion" className="text-xs text-muted underline">Signaler</Link>
  if (state === 'sent') return <span className="text-xs text-brand-dark">Merci, un modérateur va regarder.</span>

  async function send(e) {
    e.preventDefault()
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id, discussion_id: discussionId ?? null, reply_id: replyId ?? null, reason: reason.trim(),
    })
    if (!error) return setState('sent')
    setState(error.code === '23505' ? 'Tu as déjà signalé ce contenu.' : 'Le signalement a échoué.')
  }

  return (
    <span className="inline-block">
      {!open ? (
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
          <Flag size={12} aria-hidden="true" />Signaler
        </button>
      ) : (
        <form onSubmit={send} className="mt-2 w-72 space-y-2 rounded-xl border border-line bg-card p-3">
          <label className="block text-xs font-medium">Pourquoi signales-tu ce contenu ?
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} maxLength={500} rows={3} className="mt-1 w-full rounded-lg border border-line px-2 py-1 text-sm" />
          </label>
          {state && <p role="alert" className="text-xs text-red-700">{state}</p>}
          <div className="flex gap-2">
            <button className="btn btn-primary !px-3 !py-1.5 !text-xs">Envoyer</button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost !px-3 !py-1.5 !text-xs">Annuler</button>
          </div>
        </form>
      )}
    </span>
  )
}
