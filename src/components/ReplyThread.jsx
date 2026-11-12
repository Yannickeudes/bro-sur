import { useCallback, useEffect, useState } from 'react'
import ReportButton from './ReportButton.jsx'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { fmtDate } from '../lib/format.js'

// Fil de réponses sous un conseil (un seul niveau)
export default function ReplyThread({ discussionId, parentReplyId }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [anon, setAnon] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('replies_public')
      .select('*')
      .eq('parent_reply_id', parentReplyId)
      .order('created_at')
    setItems(data ?? [])
  }, [parentReplyId])

  useEffect(() => { load() }, [load])

  async function send(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error: err } = await supabase.from('replies').insert({
      discussion_id: discussionId,
      parent_reply_id: parentReplyId,
      author_id: user.id,
      body: body.trim(),
      is_anonymous: anon,
    })
    setBusy(false)
    if (err) return setError(err.message.startsWith('Trop') ? err.message : 'Ta réponse n’a pas pu être publiée.')
    setBody('')
    setOpen(false)
    load()
  }

  return (
    <div className="mt-3 border-l-2 border-line pl-4">
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <p className="whitespace-pre-line leading-relaxed">{r.body}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-muted">
                <span>
                  {r.author_pseudonym ?? 'Anonyme'}
                  {r.is_discussion_author && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-dark">Auteur</span>}
                  {' · '}{fmtDate(r.created_at)}
                </span>
                <ReportButton replyId={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {user && (open ? (
        <form onSubmit={send} className="mt-3 space-y-3">
          <label className="block text-sm font-medium">Ta réponse
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={1000} rows={3} className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-2.5" placeholder="Réponds avec bienveillance." />
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />Répondre anonymement</label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex items-center gap-3">
            <button className="btn btn-primary" disabled={busy || !body.trim()}>{busy ? 'Un instant…' : 'Envoyer'}</button>
            <button type="button" onClick={() => { setOpen(false); setBody(''); setError('') }} className="text-sm text-muted underline">Annuler</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mt-2 text-sm font-medium text-brand underline">
          Répondre à ce message
        </button>
      ))}
    </div>
  )
}
