import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, supabaseReady } from '../lib/supabase.js'

const messages = {
  'Invalid login credentials': 'E-mail ou mot de passe incorrect.',
  'User already registered': 'Un compte existe déjà avec cet e-mail.',
  'Email not confirmed': 'Confirme d’abord ton adresse e-mail grâce au message reçu.',
}
const input = 'w-full rounded-xl border border-line bg-card px-4 py-2.5'

export default function AuthPage({ mode }) {
  const register = mode === 'register'
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', pseudonym: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try {
      if (register) {
        const pseudo = form.pseudonym.trim()
        if (!/^[A-Za-z0-9_-]{3,20}$/.test(pseudo)) throw new Error('Ton pseudonyme doit faire 3 à 20 caractères : lettres, chiffres, tiret ou tiret bas.')
        const { data: free, error: e1 } = await supabase.rpc('pseudonym_available', { p: pseudo })
        if (e1) throw e1
        if (!free) throw new Error('Ce pseudonyme est déjà pris.')
        const { data, error: e2 } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { pseudonym: pseudo } } })
        if (e2) throw e2
        if (data.session) navigate('/mon-espace')
        else setInfo('Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.')
      } else {
        const { error: e3 } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (e3) throw e3
        navigate('/mon-espace')
      }
    } catch (err) {
      setError(messages[err.message] ?? err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="wrap max-w-md py-16">
      <h1 className="text-3xl">{register ? 'Rejoindre Bro sûr' : 'Se connecter'}</h1>
      <p className="mt-2 text-muted">{register ? 'Ton e-mail reste privé : les autres membres ne voient que ton pseudonyme.' : 'Content de te revoir.'}</p>
      {!supabaseReady && <p className="mt-6 rounded-xl bg-sand p-4 text-sm">Supabase n’est pas encore configuré : renseigne le fichier <code>.env</code> (voir <code>.env.example</code>), puis relance le site.</p>}
      <form onSubmit={submit} className="mt-8 space-y-4">
        {register && (
          <label className="block text-sm font-medium">Pseudonyme
            <input className={`${input} mt-1`} value={form.pseudonym} onChange={set('pseudonym')} required autoComplete="nickname" />
          </label>
        )}
        <label className="block text-sm font-medium">E-mail
          <input className={`${input} mt-1`} type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </label>
        <label className="block text-sm font-medium">Mot de passe
          <input className={`${input} mt-1`} type="password" minLength={8} value={form.password} onChange={set('password')} required autoComplete={register ? 'new-password' : 'current-password'} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {info && <p role="status" className="text-sm text-brand-dark">{info}</p>}
        <button className="btn btn-primary w-full" disabled={busy || !supabaseReady}>{busy ? 'Un instant…' : register ? 'Créer mon compte' : 'Me connecter'}</button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {register ? 'Déjà membre ? ' : 'Pas encore de compte ? '}
        <Link className="font-medium text-brand underline" to={register ? '/connexion' : '/inscription'}>{register ? 'Se connecter' : 'Rejoindre'}</Link>
      </p>
    </section>
  )
}
