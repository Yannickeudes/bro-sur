export default function Confidentialite() {
  return (
    <section className="wrap max-w-3xl py-16">
      <h1 className="text-4xl">Politique de confidentialité</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">Dernière mise à jour : novembre 2026</p>

      <div className="mt-10 space-y-8 leading-relaxed">
        <div>
          <h2 className="text-2xl">Qui sommes-nous</h2>
          <p className="mt-2 text-muted">Bro sûr est une plateforme communautaire d’écoute et d’entraide pour les jeunes, éditée par Yannick-Eudes Cédric Koffi APETOH. Cette page explique quelles données nous collectons et comment elles sont utilisées.</p>
        </div>

        <div>
          <h2 className="text-2xl">Données collectées</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-muted">
            <li><strong>Compte</strong> : adresse e-mail (jamais affichée publiquement) et pseudonyme choisi à l’inscription.</li>
            <li><strong>Contenus</strong> : discussions, réponses et soutiens que tu publies, ainsi que ton choix d’anonymat.</li>
            <li><strong>Signalements</strong> : motif et auteur du signalement, visibles uniquement par toi et les modérateurs.</li>
            <li><strong>Technique</strong> : session de connexion stockée dans ton navigateur (localStorage) pour te garder connecté.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl">Utilisation des données</h2>
          <p className="mt-2 text-muted">Tes données servent uniquement à faire fonctionner le service : afficher tes publications sous ton pseudonyme (ou anonymement si tu le choisis), t’envoyer les notifications de réponses, et traiter les signalements. Nous ne vendons, ne louons et ne partageons jamais tes données avec des tiers à des fins commerciales.</p>
        </div>

        <div>
          <h2 className="text-2xl">Anonymat</h2>
          <p className="mt-2 text-muted">Si tu publies anonymement, ton pseudonyme n’apparaît pas sur le contenu. Seuls les modérateurs peuvent retrouver l’auteur d’un contenu signalé, uniquement pour modérer les abus.</p>
        </div>

        <div>
          <h2 className="text-2xl">Où sont hébergées les données</h2>
          <p className="mt-2 text-muted">La base de données et l’authentification sont assurées par Supabase (Union européenne / infrastructure cloud). Le site statique est hébergé par GitHub Pages. Ces services agissent comme sous-traitants et appliquent leurs propres politiques de confidentialité.</p>
        </div>

        <div>
          <h2 className="text-2xl">Cookies</h2>
          <p className="mt-2 text-muted">Nous n’utilisons pas de cookies publicitaires ni de traceurs. Seule la session de connexion est conservée localement dans ton navigateur. Tu peux la supprimer à tout moment via « Se déconnecter » ou en vidant les données du site.</p>
        </div>

        <div>
          <h2 className="text-2xl">Tes droits</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-muted">
            <li>Accéder à tes données et les rectifier (pseudonyme modifiable dans « Mon espace »)</li>
            <li>Supprimer tes discussions toi-même, ou demander la suppression complète de ton compte</li>
            <li>Retirer ton consentement à tout moment en supprimant ton compte</li>
          </ul>
          <p className="mt-2 text-muted">Pour exercer ces droits ou poser une question, écris-nous à <a className="text-brand underline" href="mailto:contactbrosur@gmail.com">contactbrosur@gmail.com</a>.</p>
        </div>

        <div>
          <h2 className="text-2xl">Sécurité</h2>
          <p className="mt-2 text-muted">Les mots de passe sont chiffrés par Supabase Auth et jamais stockés en clair. L’accès aux données est contrôlé par des règles de sécurité au niveau de la base de données (RLS), vérifiées régulièrement.</p>
        </div>

        <div>
          <h2 className="text-2xl">Modifications</h2>
          <p className="mt-2 text-muted">Toute modification de cette politique sera publiée sur cette page avec la date de mise à jour. L’utilisation continue du service après modification vaut acceptation.</p>
        </div>
      </div>
    </section>
  )
}
