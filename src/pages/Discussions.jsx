import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { categories, categoryName } from '../lib/categories.js'
import { fmtDate } from '../lib/format.js'

export default function Discussions() {
  const [params, setParams] = useSearchParams()
  const cat = params.get('categorie') || ''
  const q = params.get('q') || ''
  const [text, setText] = useState(q)
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    let alive = true
    setItems(null); setError('')
    let query = supabase.from('discussions_public').select('*').order('created_at', { ascending: false }).limit(50)
    if (cat) query = query.eq('category', cat)
    const clean = q.replace(/[,()%*\\]/g, ' ').trim()
    if (clean) query = query.or(`title.ilike.%${clean}%,body.ilike.%${clean}%`)
    query.then(({ data, error: err }) => {
      if (!alive) return
      if (err) setError('Impossible de charger les discussions.')
      else setItems(data)
    })
    return () => { alive = false }
  }, [cat, q])

  const update = (next) => {
    const p = new URLSearchParams(params)
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    setParams(p)
  }
  const chip = (active) => `rounded-full border px-4 py-1.5 text-sm ${active ? 'border-brand bg-brand text-white' : 'border-line bg-card hover:bg-sand'}`

  if (!supabase) return <p className="wrap py-20 text-muted">Supabase n’est pas configuré (voir le fichier .env).</p>
  return (
    <section className="wrap py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl">Les discussions</h1>
        <Link to="/nouvelle" className="btn btn-primary">Nouvelle discussion</Link>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); update({ q: text.trim() }) }} className="mt-6 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Rechercher un mot ou un sujet" aria-label="Rechercher" className="w-full max-w-md rounded-full border border-line bg-card px-5 py-2.5" />
        <button className="btn btn-line">Rechercher</button>
      </form>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => update({ categorie: '' })} className={chip(!cat)}>Tout</button>
        {categories.map((c) => (
          <button key={c.slug} onClick={() => update({ categorie: c.slug })} className={chip(cat === c.slug)}>{c.short}</button>
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {!items && !error && <p className="text-muted">Chargement…</p>}
        {items?.length === 0 && (
          <div className="rounded-2xl border border-line bg-card p-8 text-center">
            <p className="font-display text-xl">Une chose à dire ?</p>
            <p className="mt-2 text-muted">Aucune discussion ici pour l’instant. Personne ne connaît ton vrai nom : lance la conversation.</p>
          </div>
        )}
        {items?.map((d) => (
          <Link key={d.id} to={`/discussions/${d.id}`} className="block rounded-2xl border border-line bg-card p-5 hover:border-brand">
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs text-brand-dark">{categoryName(d.category)}</span>
            <h2 className="mt-3 text-xl">{d.title}</h2>
            <p className="mt-1 line-clamp-2 text-muted">{d.body}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span>{d.author_pseudonym ?? 'Anonyme'} · {fmtDate(d.created_at)}</span>
              <span className="inline-flex items-center gap-1"><Heart size={14} aria-hidden="true" />{d.support_count} soutiens</span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={14} aria-hidden="true" />{d.reply_count} réponses
                {Number(d.thread_reply_count) > 0 && ` (+${d.thread_reply_count} dans les fils)`}
              </span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
