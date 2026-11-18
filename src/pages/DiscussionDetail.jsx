import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, Pencil } from 'lucide-react'
import ReportButton from '../components/ReportButton.jsx'
import ReplyThread from '../components/ReplyThread.jsx'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { categoryName } from '../lib/categories.js'
import { fmtDate } from '../lib/format.js'

const field = 'mt-1 w-full rounded-xl border border-line bg-card px-4 py-2.5'

export default function DiscussionDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [d, setD] = useState(undefined) // undefined : chargement, null : introuvable
  const [replies, setReplies] = useState([])
  const [supported, setSupported] = useState(false)
  const [body, setBody] = useState('')
  const [anon, setAnon] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Édition de la discussion
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState('')

  // Édition d'une réponse
  const [editingReply, setEditingReply] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)

  const loadReplies = useCallback(async () => {
    const { data } = await supabase
      .from('replies_public')
      .select('*')
      .eq('discussion_id', id)
      .is('parent_reply_id', null)
      .order('created_at')
    setReplies(data ?? [])
  }, [id])

  useEffect(() => {
    if (!supabase) return
    supabase.from('discussions_public').select('*').eq('id', id).maybeSingle().then(({ data }) => setD(data ?? null))
    loadReplies()
  }, [id, loadReplies])

  useEffect(() => {
    if (!supabase || !user) { setSupported(false); return }
    supabase.from('supports').select('discussion_id').match({ user_id: user.id, discussion_id: id }).maybeSingle()
      .then(({ data }) => setSupported(Boolean(data)))
  }, [id, user])

  async function toggleSupport() {
    setError('')
    const req = supported
      ? supabase.from('supports').delete().match({ user_id: user.id, discussion_id: id })
      : supabase.from('supports').insert({ user_id: user.id, discussion_id: id })
    const { error: err } = await req
    if (err) return setError('Action impossible pour le moment.')
    setSupported(!supported)
    setD((x) => ({ ...x, support_count: Number(x.support_count) + (supported ? -1 : 1) }))
  }

  async function reply(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error: err } = await supabase.from('replies').insert({ discussion_id: id, author_id: user.id, body: body.trim(), is_anonymous: anon })
    setBusy(false)
    if (err) return setError(err.message.startsWith('Trop') ? err.message : 'Ta réponse n’a pas pu être publiée.')
    setBody('')
    setD((x) => ({ ...x, reply_count: Number(x.reply_count) + 1 }))
    loadReplies()
  }

  function startEdit() {
    setEditTitle(d.title); setEditBody(d.body); setEditError(''); setEditing(true)
  }

  async function saveEdit(e) {
    e.preventDefault()
    setEditBusy(true); setEditError('')
    const { error: err } = await supabase.rpc('edit_own_discussion', {
      p_id: id, p_title: editTitle, p_body: editBody,
    })
    setEditBusy(false)
    if (err) return setEditError(err.message)
    setD((x) => ({ ...x, title: editTitle.trim(), body: editBody.trim() }))
    setEditing(false)
  }

  function startReplyEdit(r) {
    setEditingReply(r.id); setReplyBody(r.body); setError('')
  }

  async function saveReplyEdit(e, replyId) {
    e.preventDefault()
    setReplyBusy(true); setError('')
    const { error: err } = await supabase.rpc('edit_own_reply', { p_id: replyId, p_body: replyBody })
    setReplyBusy(false)
    if (err) return setError(err.message)
    setReplies((list) => list.map((r) => (r.id === replyId ? { ...r, body: replyBody.trim() } : r)))
    setEditingReply(null)
  }

  if (!supabase) return <p className="wrap py-20 text-muted">Supabase n’est pas configuré (voir le fichier .env).</p>
  if (d === undefined) return <p className="wrap py-20 text-muted">Chargement…</p>
  if (d === null) return (
    <section className="wrap max-w-2xl py-20 text-center">
      <h1 className="text-3xl">Discussion introuvable</h1>
      <p className="mb-6 mt-3 text-muted">Elle a peut-être été supprimée.</p>
      <Link to="/discussions" className="btn btn-primary">Retour aux discussions</Link>
    </section>
  )
  return (
    <section className="wrap max-w-3xl py-12">
      <Link to="/discussions" className="text-sm text-brand underline">Toutes les discussions</Link>
      <article className="mt-4">
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs text-brand-dark">{categoryName(d.category)}</span>
        {editing ? (
          <form onSubmit={saveEdit} className="mt-3 space-y-3">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required minLength={5} maxLength={120} className={`${field} text-xl font-semibold`} aria-label="Titre" />
            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} required minLength={10} maxLength={5000} rows={8} className={field} aria-label="Texte" />
            {editError && <p role="alert" className="text-sm text-red-700">{editError}</p>}
            <div className="flex gap-3">
              <button className="btn btn-primary" disabled={editBusy}>{editBusy ? 'Enregistrement…' : 'Enregistrer'}</button>
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted underline">Annuler</button>
            </div>
          </form>
        ) : (
          <>
            <h1 className="mt-3 text-3xl md:text-4xl">{d.title}</h1>
            <p className="mt-2 text-sm text-muted">{d.author_pseudonym ?? 'Anonyme'} · {fmtDate(d.created_at)}</p>
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed">{d.body}</p>
          </>
        )}
        <div className="mt-6 flex items-center gap-3">
          {user ? (
            <button onClick={toggleSupport} aria-pressed={supported} className={`btn ${supported ? 'btn-primary' : 'btn-line'}`}>
              <Heart size={16} className="mr-2" aria-hidden="true" />{supported ? 'Soutenu' : 'Soutenir'}
            </button>
          ) : (
            <Link to="/connexion" className="text-sm text-brand underline">Connecte-toi pour soutenir</Link>
          )}
          <span className="text-sm text-muted">{d.support_count} soutiens</span>
          {!editing && d.is_mine && (
            <button onClick={startEdit} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
              <Pencil size={14} aria-hidden="true" />Modifier
            </button>
          )}
          <ReportButton discussionId={d.id} />
        </div>
      </article>

      <h2 className="mt-12 text-2xl">{d.reply_count} réponses</h2>
      {Number(d.thread_reply_count) > 0 && (
        <p className="mt-1 text-sm text-muted">
          + {d.thread_reply_count} {Number(d.thread_reply_count) > 1 ? 'réponses échangées' : 'réponse échangée'} dans les fils
        </p>
      )}
      <ul className="mt-4 space-y-4">
        {replies.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-card p-5">
            {editingReply === r.id ? (
              <form onSubmit={(e) => saveReplyEdit(e, r.id)} className="space-y-3">
                <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} required maxLength={2000} rows={4} className={field} aria-label="Ta réponse" />
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <div className="flex gap-3">
                  <button className="btn btn-primary" disabled={replyBusy}>{replyBusy ? 'Un instant…' : 'Enregistrer'}</button>
                  <button type="button" onClick={() => setEditingReply(null)} className="text-sm text-muted underline">Annuler</button>
                </div>
              </form>
            ) : (
              <>
                <p className="whitespace-pre-line leading-relaxed">{r.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 text-sm text-muted">
                  <span>
                    {r.author_pseudonym ?? 'Anonyme'}
                    {r.is_discussion_author && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-dark">Auteur</span>}
                    {' · '}{fmtDate(r.created_at)}
                  </span>
                  {r.is_mine && (
                    <button onClick={() => startReplyEdit(r)} className="inline-flex items-center gap-1 hover:text-ink">
                      <Pencil size={13} aria-hidden="true" />Modifier
                    </button>
                  )}
                  <ReportButton replyId={r.id} />
                </div>
              </>
            )}
            <ReplyThread discussionId={id} parentReplyId={r.id} />
          </li>
        ))}
      </ul>

      {user ? (
        <form onSubmit={reply} className="mt-8 space-y-3">
          <label className="block text-sm font-medium">Ta réponse
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={2000} rows={4} className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-2.5" placeholder="Partage ton expérience, avec bienveillance." />
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />Répondre anonymement</label>
          {error && !editingReply && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button className="btn btn-primary" disabled={busy || !body.trim()}>{busy ? 'Un instant…' : 'Répondre'}</button>
        </form>
      ) : (
        <p className="mt-8 rounded-2xl bg-sand p-5 text-sm">
          <Link to="/connexion" className="font-medium text-brand underline">Connecte-toi</Link> ou <Link to="/inscription" className="font-medium text-brand underline">rejoins la communauté</Link> pour répondre.
        </p>
      )}
    </section>
  )
}
