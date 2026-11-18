import { Link, NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Download, Home, MessagesSquare, PenLine, Share, User, X } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'

const top = ({ isActive }) => `text-sm font-medium ${isActive ? 'text-brand' : 'text-muted hover:text-ink'}`
const tabs = [
  { to: '/', label: 'Accueil', Icon: Home, end: true },
  { to: '/discussions', label: 'Discussions', Icon: MessagesSquare },
  { to: '/nouvelle', label: 'Écrire', Icon: PenLine },
  { to: '/mon-espace', label: 'Profil', Icon: User },
]

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches

export default function Layout() {
  const { user, profile } = useAuth()
  const [installEvt, setInstallEvt] = useState(window.__broSurInstallPrompt ?? null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('bro-sur-install') === 'dismissed')

  useEffect(() => {
    const onPrompt = () => setInstallEvt(window.__broSurInstallPrompt ?? null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const canInstall = !dismissed && !isStandalone() && (installEvt || isIOS)

  async function install() {
    if (!installEvt) return
    await installEvt.prompt()
    const { outcome } = await installEvt.userChoice
    if (outcome === 'accepted') setInstallEvt(null)
  }

  function dismiss() {
    localStorage.setItem('bro-sur-install', 'dismissed')
    setDismissed(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="wrap flex h-16 items-center justify-between">
          <Link to="/" className="font-display text-2xl">bro sûr<span className="text-brand">.</span></Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <NavLink to="/discussions" className={top}>Discussions</NavLink>
            <NavLink to="/regles" className={top}>Règles</NavLink>
          </nav>
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <NotificationBell />
                <Link to="/mon-espace" className="btn btn-line">{profile?.pseudonym ?? 'Mon espace'}</Link>
              </>
            ) : (
              <>
                <Link to="/connexion" className="btn btn-ghost">Se connecter</Link>
                <Link to="/inscription" className="btn btn-primary">Rejoindre</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0"><Outlet /></main>

      <footer className="border-t border-line bg-sand/60">
        <div className="wrap grid gap-8 py-10 md:grid-cols-3">
          <div>
            <p className="font-display text-xl">bro sûr<span className="text-brand">.</span></p>
            <p className="mt-2 max-w-xs text-sm text-muted">Un espace pour parler, écouter et avancer ensemble. Ici, on se parle avec respect, on ne juge pas, et personne ne reste seul avec ses questions.</p>
          </div>
          <div className="text-sm">
            <p className="mb-2 font-semibold">La communauté</p>
            <ul className="space-y-1 text-muted">
              <li><Link className="hover:text-ink" to="/discussions">Dernières discussions</Link></li>
              <li><Link className="hover:text-ink" to="/regles">Règles de la communauté</Link></li>
              <li><Link className="hover:text-ink" to="/aide">Besoin d’aide ?</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="mb-2 font-semibold">Bon à savoir</p>
            <p className="text-muted">Les conseils partagés ici viennent de membres, pas de professionnels. En cas de détresse, contacte une personne de confiance ou un service d’aide.</p>
            <p className="mt-2"><Link className="text-brand underline" to="/confidentialite">Politique de confidentialité</Link></p>
          </div>
        </div>
        <p className="wrap pb-6 text-xs text-muted">© 2026 Bro sûr. Écouter avant de répondre.</p>
      </footer>

      {canInstall && (
        <div className="fixed inset-x-4 bottom-20 z-30 mx-auto max-w-md rounded-2xl border border-line bg-card p-4 shadow-lg md:bottom-6">
          <div className="flex items-start gap-3">
            <Download size={22} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Installer Bro sûr</p>
              <p className="mt-1 text-xs text-muted">
                {installEvt
                  ? 'Ajoute l’app à ton écran d’accueil : elle s’ouvre comme une vraie application.'
                  : 'Sur iPhone : touche Partager puis « Sur l’écran d’accueil ». Sur Android : menu ⋮ puis « Installer l’app ».'}
              </p>
              <div className="mt-3 flex gap-2">
                {installEvt && (
                  <button onClick={install} className="btn btn-primary !px-4 !py-1.5 !text-xs">
                    <Download size={14} className="mr-1" aria-hidden="true" />Installer
                  </button>
                )}
                {!installEvt && isIOS && (
                  <span className="inline-flex items-center gap-1 text-xs text-brand"><Share size={14} aria-hidden="true" />Partager → Sur l’écran d’accueil</span>
                )}
                <button onClick={dismiss} className="btn btn-ghost !px-3 !py-1.5 !text-xs">Plus tard</button>
              </div>
            </div>
            <button onClick={dismiss} aria-label="Fermer" className="rounded-full p-1 text-muted hover:bg-sand">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-card md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-xs ${isActive ? 'text-brand' : 'text-muted'}`}>
            <Icon size={20} aria-hidden="true" />{label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
