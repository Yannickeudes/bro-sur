import { Link } from 'react-router-dom'

export default function ComingSoon({ title, step }) {
  return (
    <section className="wrap max-w-2xl py-24 text-center">
      <h1 className="text-3xl">{title}</h1>
      <p className="mb-8 mt-3 text-muted">
        {step ? `Cette page sera construite à l’étape ${step}.` : 'Cette page n’existe pas.'}
      </p>
      <Link to="/" className="btn btn-primary">Retour à l’accueil</Link>
    </section>
  )
}
