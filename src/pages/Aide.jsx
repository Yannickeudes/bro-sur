import { resources } from '../lib/resources.js'

export default function Aide() {
  return (
    <section className="wrap max-w-3xl py-16">
      <h1 className="text-4xl">Besoin d’aide ?</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">Bro sûr est un espace entre jeunes : on s’y écoute, mais on n’y remplace pas un professionnel. Si ce que tu traverses est lourd, tu as le droit de demander de l’aide ailleurs aussi.</p>
      <ul className="mt-8 space-y-3 leading-relaxed">
        <li className="border-l-2 border-brand pl-4">Parle à une personne de confiance : un parent, un ami, un enseignant, un grand frère ou une grande sœur.</li>
        <li className="border-l-2 border-brand pl-4">Consulte un professionnel de santé ou un service d’écoute de ton pays.</li>
        <li className="border-l-2 border-brand pl-4">En cas de danger immédiat pour toi ou pour quelqu’un d’autre, contacte tout de suite les secours de ton pays.</li>
      </ul>
      {resources.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl">Services d’écoute et d’aide</h2>
          <ul className="mt-4 space-y-3">
            {resources.map((r) => (
              <li key={r.name} className="rounded-2xl border border-line bg-card p-5">
                <h3 className="text-lg">{r.name}</h3>
                <p className="text-sm text-muted">{r.description}</p>
                <p className="mt-1 font-medium">{r.contact}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
