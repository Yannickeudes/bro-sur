import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { fmtDate } from '../lib/format.js'

export default function Moderation() {
  const { user, profile, loading } = useAuth()
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')
  const isMod = profile?.role === 'moderator'

  const load = () => supabase.from('reports')
    .select('id, reason, created_at, discussion:discussions(id, title, body, status, author:profiles!author_id(pseudonym)), reply:replies(id, body, status, author:profiles!author_id(pseudonym))')
    .eq('status', 'open').order('created_at')
    .then(({ data, error: err }) => {
      if (err) { console.error(err); setError('Impossible de charger les signalements.') }
      else setReports(data ?? [])
    })
  useEffect(() => { if (isMod) load() }, [isMod])

  async function act(r, hide) {
    if (hide) {
      const [table, id] = r.discussion ? ['discussions', r.discussion.id] : ['replies', r.reply.id]
      await supabase.from(table).update({ status: 'hidden' }).eq('id', id)
    }
    await supabase.from('reports').update({ status: 'handled' }).eq('id', r.id)
    load()
  }

  if (loading) return <p className="wrap py-20 text-muted">Chargement…</p>
  if (!user) return <Navigate to="/connexion" replace />
  if (!profile) return <p className="wrap py-20 text-muted">Chargement…</p>
  if (!isMod) return <p className="wrap py-20 text-muted">Cette page est réservée aux modérateurs.</p>

  return (
    <section className="wrap max-w-3xl py-12">
      <h1 className="text-3xl">Modération</h1>
      <p className="mt-2 text-muted">Signalements à traiter. Masquer un contenu le retire de la vue publique.</p>
      {error && <p role="alert" className="mt-8 text-red-700">{error}</p>}
      {!reports && !error && <p className="mt-8 text-muted">Chargement…</p>}
      {reports?.length === 0 && <p className="mt-8 rounded-2xl bg-sand p-5">Aucun signalement en attente.</p>}
      <ul className="mt-8 space-y-4">
        {reports?.map((r) => {
          const t = r.discussion ?? r.reply
          return (
            <li key={r.id} className="rounded-2xl border border-line bg-card p-5">
              <p className="text-sm text-muted">{r.discussion ? 'Discussion' : 'Réponse'} · signalée le {fmtDate(r.created_at)}</p>
              {r.discussion && <h2 className="mt-1 text-xl">{r.discussion.title}</h2>}
              <p className="mt-2 whitespace-pre-line">{t?.body ?? 'Contenu supprimé.'}</p>
              <p className="mt-2 text-sm text-muted">Auteur : {t?.author?.pseudonym ?? '?'} · statut : {t?.status}</p>
              <p className="mt-3 rounded-xl bg-sand p-3 text-sm"><strong>Motif :</strong> {r.reason}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => act(r, true)} className="btn btn-primary" disabled={!t}>Masquer le contenu</button>
                <button onClick={() => act(r, false)} className="btn btn-line">Ignorer le signalement</button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
