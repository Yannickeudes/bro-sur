import { Link } from 'react-router-dom'

const rules = [
  ['On parle comme à un proche', 'Pas de moqueries, pas de jugements, pas de « c’est rien ». Ce qui te paraît petit peut compter énormément pour quelqu’un d’autre.'],
  ['On ne dévoile jamais quelqu’un', 'Pas de nom, pas de capture d’écran, pas d’indice qui permettrait de reconnaître une personne. Ce qui se dit ici reste ici.'],
  ['On partage son expérience, pas des verdicts', '« Voilà ce qui m’a aidé » est plus utile que « tu dois faire ça ». Chaque situation a son contexte.'],
  ['On protège les plus fragiles', 'Les propos violents, le harcèlement, la discrimination et les contenus choquants sont retirés, et l’accès peut être suspendu.'],
  ['On ne fait pas de publicité', 'Pas de vente, pas de lien promotionnel, pas de recrutement. Cet espace sert à parler, pas à vendre.'],
  ['On respecte la loi et la sécurité', 'Aucun contenu illégal, aucune incitation au danger. En cas de danger immédiat, contacte les secours de ton pays.'],
]

export default function Rules() {
  return (
    <section className="wrap max-w-3xl py-16">
      <h1 className="text-4xl">Règles de la communauté</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">Bro sûr fonctionne parce que les personnes qui s’y expriment prennent soin les unes des autres. Voici ce qui rend cet espace sûr pour tout le monde.</p>
      <ul className="mt-10 space-y-6">
        {rules.map(([title, text]) => (
          <li key={title} className="border-l-2 border-brand pl-5">
            <h2 className="text-xl">{title}</h2>
            <p className="mt-1 leading-relaxed text-muted">{text}</p>
          </li>
        ))}
      </ul>
      <div className="mt-12 rounded-2xl bg-brand-soft p-6">
        <h2 className="text-xl">Les conseils d’ici ne remplacent pas un professionnel</h2>
        <p className="mt-2 leading-relaxed">Les membres de Bro sûr partagent leur vécu, pas un avis médical, juridique ou psychologique. Si tu traverses une période très difficile, parle aussi à une personne de confiance, à un professionnel de santé, ou à un service d’écoute de ton pays. En cas de danger immédiat, contacte les secours.</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/discussions" className="btn btn-primary">Revenir aux discussions</Link>
        <Link to="/" className="btn btn-line">Découvrir Bro sûr</Link>
      </div>
    </section>
  )
}
