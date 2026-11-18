import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Download, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { categoryName } from '../lib/categories.js'
import { fmtDate } from '../lib/format.js'

export default function Profile() {
  const { user, profile, loading, signOut, reloadProfile } = useAuth()
  const [pseudo, setPseudo] = useState('')
  const [msg, setMsg] = useState('')
  const [mine, setMine] = useState(null)
  const [accountBusy, setAccountBusy] = useState(false)

  const loadMine = () => supabase.from('discussions')
    .select('id, title, category, created_at, status, is_anonymous')
    .eq('author_id', user.id).order('created_at', { ascending: false })
    .then(({ data }) => setMine(data ?? []))
  useEffect(() => { if (profile) setPseudo(profile.pseudonym) }, [profile])
  useEffect(() => { if (user) loadMine() }, [user])

  async function savePseudo(e) {
    e.preventDefault(); setMsg('')
    const p = pseudo.trim()
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(p)) return setMsg('Ton pseudonyme doit faire 3 à 20 caractères : lettres, chiffres, tiret ou tiret bas.')
    const { error } = await supabase.from('profiles').update({ pseudonym: p }).eq('id', user.id)
    if (error) return setMsg(error.code === '23505' ? 'Ce pseudonyme est déjà pris.' : 'Modification impossible.')
    reloadProfile(); setMsg('Pseudonyme mis à jour.')
  }
  async function remove(id) {
    if (!window.confirm('Supprimer définitivement cette discussion et ses réponses ?')) return
    await supabase.from('discussions').delete().eq('id', id)
    loadMine()
  }

  async function exportData() {
    setAccountBusy(true)
    const { data, error } = await supabase.rpc('export_my_data')
    setAccountBusy(false)
    if (error) return setMsg('Export impossible pour le moment.')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bro-sur-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteAccount() {
    if (!window.confirm('Supprimer définitivement ton compte et tout ce que tu as publié ? Cette action est irréversible.')) return
    if (!window.confirm('Dernière confirmation : tu perdras accès à toutes tes discussions et réponses. Continuer ?')) return
    setAccountBusy(true)
    const { error } = await supabase.rpc('delete_own_account')
    setAccountBusy(false)
    if (error) return setMsg('Suppression impossible pour le moment. Réessaie ou contacte l’équipe.')
    await signOut()
    window.location.href = '/'
  }

  if (loading) return <p className="wrap py-20 text-muted">Chargement…</p>
  if (!user) return <Navigate to="/connexion" replace />
  return (
    <section className="wrap max-w-2xl py-12">
      <h1 className="text-3xl">Mon espace</h1>
      <p className="mt-2 text-sm text-muted">E-mail (visible par toi seul) : {user.email}</p>
      <form onSubmit={savePseudo} className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">Pseudonyme
          <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} className="mt-1 block rounded-xl border border-line bg-card px-4 py-2.5" />
        </label>
        <button className="btn btn-line">Enregistrer</button>
      </form>
      {msg && <p role="status" className="mt-2 text-sm text-brand-dark">{msg}</p>}
      {profile?.role === 'moderator' && <Link to="/moderation" className="btn btn-primary mt-6">Ouvrir la modération</Link>}

      <h2 className="mt-12 text-2xl">Mes discussions</h2>
      {mine?.length === 0 && <p className="mt-3 text-muted">Tu n’as encore rien publié. <Link to="/nouvelle" className="text-brand underline">Écrire une discussion</Link></p>}
      <ul className="mt-4 space-y-3">
        {mine?.map((d) => (
          <li key={d.id} className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-card p-4">
            <div>
              <Link to={`/discussions/${d.id}`} className="font-display text-lg hover:text-brand">{d.title}</Link>
              <p className="text-sm text-muted">{categoryName(d.category)} · {fmtDate(d.created_at)}{d.is_anonymous ? ' · anonyme' : ''}{d.status === 'hidden' ? ' · masquée par la modération' : ''}</p>
            </div>
            <button onClick={() => remove(d.id)} className="text-sm text-red-700 underline">Supprimer</button>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-2xl">Tes données</h2>
      <p className="mt-2 text-sm text-muted">Conformément à la politique de confidentialité, tu peux récupérer une copie de tes données ou supprimer ton compte.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={exportData} disabled={accountBusy} className="btn btn-line">
          <Download size={16} className="mr-2" aria-hidden="true" />Télécharger mes données
        </button>
        <button onClick={deleteAccount} disabled={accountBusy} className="btn btn-line !text-red-700">
          <Trash2 size={16} className="mr-2" aria-hidden="true" />Supprimer mon compte
        </button>
      </div>

      <button onClick={signOut} className="btn btn-line mt-10">Se déconnecter</button>
    </section>
  )
}
