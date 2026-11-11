import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { categories } from '../lib/categories.js'

const field = 'mt-1 w-full rounded-xl border border-line bg-card px-4 py-2.5'

export default function NewDiscussion() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ category: '', title: '', body: '', anon: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  if (loading) return <p className="wrap py-20 text-muted">Chargement…</p>
  if (!user) return <Navigate to="/connexion" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { data, error: err } = await supabase.from('discussions')
      .insert({ author_id: user.id, category: form.category, title: form.title.trim(), body: form.body.trim(), is_anonymous: form.anon })
      .select('id').single()
    setBusy(false)
    if (err) return setError(err.message.startsWith('Trop') ? err.message : 'Ta discussion n’a pas pu être publiée. Le titre doit faire de 5 à 120 caractères et le texte de 10 à 5 000.')
    navigate(`/discussions/${data.id}`)
  }

  return (
    <section className="wrap max-w-2xl py-12">
      <h1 className="text-3xl md:text-4xl">Une chose à dire ?</h1>
      <p className="mt-2 text-muted">Écris ce que tu vis. Personne ne connaît ton vrai nom ici.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block text-sm font-medium">Catégorie
          <select className={field} value={form.category} onChange={set('category')} required>
            <option value="" disabled>Choisis une catégorie</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Titre
          <input className={field} value={form.title} onChange={set('title')} required minLength={5} maxLength={120} />
        </label>
        <label className="block text-sm font-medium">Ton message
          <textarea className={field} rows={8} value={form.body} onChange={set('body')} required minLength={10} maxLength={5000} />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={form.anon} onChange={set('anon')} />
          <span>Publier anonymement. Ton pseudonyme ne sera pas affiché ; seuls les modérateurs peuvent retrouver l’auteur en cas d’abus.</span>
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Publication…' : 'Publier'}</button>
      </form>
    </section>
  )
}
