import { Link } from 'react-router-dom'
import { categories } from '../lib/categories.js'

const steps = [
  ['Tu écris ce que tu vis', 'Une question, un doute, une histoire. Tu choisis une catégorie et tu gardes le pseudonyme que tu as choisi.'],
  ['La communauté te répond', 'Des jeunes qui sont passés par là réagissent, racontent leur expérience et te donnent un avis honnête et respectueux.'],
  ['Tu avances à ton rythme', 'Tu retrouves tes discussions, tu reviens quand tu veux, et tu aides à ton tour quelqu’un d’autre.'],
]
const promises = [
  ['On répond avec respect', 'Pas de moqueries, pas de jugements. On parle comme on parlerait à un proche.'],
  ['Tu restes maître de ton identité', 'Aucune identité publique affichée. Tu choisis ton pseudonyme, et tu peux écrire anonymement.'],
  ['Tout est modéré', 'Chaque discussion peut être signalée. Un contenu irrespectueux est retiré de la plateforme.'],
]

export default function Home() {
  return (
    <>
      <section className="wrap py-16 md:py-24">
        <p className="mb-4 text-sm font-medium text-brand">Bienvenue chez Bro sûr</p>
        <h1 className="max-w-3xl text-4xl leading-tight md:text-6xl">Un espace pour parler, écouter et avancer ensemble.</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Tu as une question que tu n’oses pas poser ? Une situation qui te pèse ? Ici, tu partages ce que tu veux, sous pseudonyme, et des jeunes comme toi te répondent avec bienveillance.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/inscription" className="btn btn-primary">Rejoindre la communauté</Link>
          <Link to="/discussions" className="btn btn-line">Lire les discussions</Link>
        </div>
        <ul className="mt-8 flex flex-wrap gap-2 text-sm">
          {['Pseudonyme par défaut', 'Bienveillance obligatoire', 'Sans jugement'].map((t) => (
            <li key={t} className="rounded-full bg-brand-soft px-3 py-1 text-brand-dark">{t}</li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-card py-14">
        <div className="wrap">
          <h2 className="max-w-xl text-2xl md:text-3xl">Trois étapes, comme une conversation avec quelqu’un de confiance.</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map(([title, text], i) => (
              <li key={title}>
                <span className="font-display text-3xl text-brand">{i + 1}</span>
                <h3 className="mt-2 text-xl">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="categories" className="wrap scroll-mt-20 py-16">
        <h2 className="max-w-xl text-2xl md:text-3xl">Parle de ce qui compte vraiment pour toi.</h2>
        <p className="mt-3 max-w-xl text-muted">Sept espaces pour ne jamais te sentir hors sujet. Choisis celui qui ressemble le plus à ce que tu traverses.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.slug} to={`/discussions?categorie=${c.slug}`} className="rounded-2xl border border-line bg-card p-5 hover:border-brand">
              <h3 className="text-lg">{c.name}</h3>
              <p className="mt-1 text-sm text-muted">{c.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-sand/60 py-14">
        <div className="wrap grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl md:text-3xl">La confiance n’est pas un slogan ici.</h2>
            <p className="mt-3 leading-relaxed text-muted">Bro sûr est un espace entre jeunes. Les conseils partagés ne remplacent pas un accompagnement professionnel : si ta situation est lourde, parles-en aussi à une personne de confiance ou à un professionnel.</p>
            <Link to="/inscription" className="btn btn-primary mt-6">Rejoindre la communauté</Link>
          </div>
          <ul className="space-y-5">
            {promises.map(([title, text]) => (
              <li key={title} className="border-l-2 border-brand pl-4">
                <h3 className="text-lg">{title}</h3>
                <p className="text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
