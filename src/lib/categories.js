export const categories = [
  { slug: 'relations', short: 'Relations', name: 'Relations et amour', text: 'Couple, amitié naissante, ruptures, premiers sentiments.' },
  { slug: 'famille', short: 'Famille', name: 'Famille et amitié', text: 'Disputes à la maison, incompréhensions, liens qui comptent.' },
  { slug: 'etudes', short: 'Études', name: 'Études et orientation', text: 'Choix de filière, examens, pression scolaire, avenir proche.' },
  { slug: 'travail', short: 'Travail', name: 'Vie professionnelle', text: 'Premier emploi, stages, relations avec les collègues.' },
  { slug: 'confiance', short: 'Confiance', name: 'Confiance en soi', text: 'Se sentir légitime, oser parler, s’accepter comme on est.' },
  { slug: 'bien-etre', short: 'Bien-être', name: 'Bien-être et développement personnel', text: 'Rythme, habitudes, gestion des émotions, petits progrès.' },
  { slug: 'quotidien', short: 'Quotidien', name: 'Difficultés du quotidien', text: 'Argent, logement, solitude, tout ce qui pèse au jour le jour.' },
]

export const categoryName = (slug) => categories.find((c) => c.slug === slug)?.name ?? slug
