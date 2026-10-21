// NASTAVITVE IN BESEDILA STRANI. Besedila imajo slovensko (sl) in angleško (en) različico.
// Albumi so v datoteki albums.js (ustvarjeni iz izvoza Bloggerja).

window.SITE = {
  author: 'Gregor Raičević',
  email: 'info@slikajzmano.com',
  description: { sl: 'Blog namenjen slikanju', en: 'A blog about photography' },

  // Povezava z praznim url se ne prikaže
  links: [
    { label: 'Instagram', url: 'https://www.instagram.com/gregor.raicevic/' },
    { label: 'YouTube', url: 'https://www.youtube.com/channel/UCyIwdN5BdDtsDIoXm2x7DLg' },
    { label: 'Facebook', url: 'https://www.facebook.com/ProjectFilming-770457323082253/timeline/' }
  ],

  // Naslovna fotografija: album (s = konec povezave albuma) in zaporedna številka fotografije (od 0).
  // album: null pomeni prvo fotografijo najnovejšega albuma.
  hero: { album: null, photo: 0 },

  // Koliko albumov se prikaže naenkrat
  pageSize: 24,

  // Oznake, ki se prikažejo kot filter (ostale so dosegljive prek albuma).
  // null pomeni samodejno: vse oznake z vsaj 3 albumi.
  filterLabels: null,

  about: {
    sl: [
      'Sem Gregor. Fotografiram sončne zahode in vzhode, največkrat s hribov okoli Ljubljane, pa tudi z gora, jezer in obale.',
      'Fotografije in posnetke objavljam tudi na YouTubu in Facebooku.'
    ],
    en: [
      'I’m Gregor. I photograph sunsets and sunrises, mostly from the hills around Ljubljana, but also from the mountains, lakes and the coast.',
      'I also post photos and videos on YouTube and Facebook.'
    ]
  },

  contact: {
    sl: 'Za sodelovanje, uporabo fotografij ali tisk mi piši.',
    en: 'For collaborations, licensing or prints, send me an email.'
  }
};
