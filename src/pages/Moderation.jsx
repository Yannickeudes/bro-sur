import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { fmtDate } from '../lib/format.js'

const REPORT_SELECT = 'id, reason, status, created_at, discussion:discussions(id, title, body, status, author:profiles!author_id(pseudonym)), reply:replies(id, body, status, author:profiles!author_id(pseudonym))'

export default function Moderation() {
  const { user, profile, loading } = useAuth()
  const [reports, setReports] = useState(null)
  const [handled, setHandled] = useState([])
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const isMod = profile?.role === 'moderator'

  const load = () => {
    supabase.from('reports')
      .select(REPORT_SELECT)
      .eq('status', 'open').order('created_at')
      .then(({ data, error: err }) => {
        if (err) { console.error(err); setError('Impossible de charger les signalements.') }
        else setReports(data ?? [])
      })
    supabase.from('reports')
      .select(REPORT_SELECT)
      .eq('status', 'handled').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setHandled(data ?? []))
    supabase.rpc('moderation_dashboard')
      .then(({ data }) => setStats(data?.[0] ?? null))
      .catch(() => setStats(null))
  }
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

  const statCards = stats && [
    ['Signalements ouverts', stats.reports_open],
    ['Traités', stats.reports_handled],
    ['Discussions', stats.discussions_published],
    ['Réponses', stats.replies_published],
    ['Contenus masqués', Number(stats.discussions_hidden) + Number(stats.replies_hidden)],
    ['Membres', stats.members],
  ]

  const ReportCard = ({ r, children }) => {
    const t = r.discussion ?? r.reply
    return (
      <li className="rounded-2xl border border-line bg-card p-5">
        <p className="text-sm text-muted">{r.discussion ? 'Discussion' : 'Réponse'} · signalée le {fmtDate(r.created_at)}</p>
        {r.discussion && <h2 className="mt-1 text-xl">{r.discussion.title}</h2>}
        <p className="mt-2 whitespace-pre-line">{t?.body ?? 'Contenu supprimé.'}</p>
        <p className="mt-2 text-sm text-muted">Auteur : {t?.author?.pseudonym ?? '?'} · statut : {t?.status}</p>
        <p className="mt-3 rounded-xl bg-sand p-3 text-sm"><strong>Motif :</strong> {r.reason}</p>
        {children}
      </li>
    )
  }

  return (
    <section className="wrap max-w-3xl py-12">
      <h1 className="text-3xl">Modération</h1>
      <p className="mt-2 text-muted">Signalements à traiter. Masquer un contenu le retire de la vue publique.</p>

      {statCards && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statCards.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-line bg-card p-4 text-center">
              <p className="font-display text-2xl text-brand">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p role="alert" className="mt-8 text-red-700">{error}</p>}
      {!reports && !error && <p className="mt-8 text-muted">Chargement…</p>}
      {reports?.length === 0 && <p className="mt-8 rounded-2xl bg-sand p-5">Aucun signalement en attente.</p>}
      <ul className="mt-8 space-y-4">
        {reports?.map((r) => (
          <ReportCard key={r.id} r={r}>
            <div className="mt-4 flex gap-2">
              <button onClick={() => act(r, true)} className="btn btn-primary" disabled={!r.discussion && !r.reply}>Masquer le contenu</button>
              <button onClick={() => act(r, false)} className="btn btn-line">Ignorer le signalement</button>
            </div>
          </ReportCard>
        ))}
      </ul>

      {handled.length > 0 && (
        <>
          <h2 className="mt-14 text-2xl">Traités récemment</h2>
          <ul className="mt-4 space-y-4 opacity-80">
            {handled.map((r) => <ReportCard key={r.id} r={r} />)}
          </ul>
        </>
      )}
    </section>
  )
}
