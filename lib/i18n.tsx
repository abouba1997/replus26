export type Locale = 'fr' | 'en'

const sectorsFr = [
  'Solaire',
  'Stockage d’énergie',
  'Hydrogène',
  'Microréseaux',
  'Infrastructure de véhicules électriques',
  'Énergie éolienne',
  'Autre',
] as const

const sectorsEn = [
  'Solar',
  'Energy storage',
  'Hydrogen',
  'Microgrids',
  'Electric vehicle infrastructure',
  'Wind energy',
  'Other',
] as const

export const copy = {
  fr: {
    navEvent: 'L’événement',
    navMission: 'La mission',
    navApply: 'Candidater',
    navCta: 'Rejoindre la délégation',
    eyebrow: 'Délégation malienne · Las Vegas',
    heroTitle: (
      <>
        Le futur de <em>l’énergie</em>
        <br />
        se rencontre ici.
      </>
    ),
    heroCopy:
      'Du 16 au 19 novembre 2026, la section économique et commerciale de l’Ambassade des États-Unis à Bamako constitue une délégation d’opérateurs maliens pour RE+ — le plus grand salon des énergies renouvelables en Amérique du Nord.',
    heroCta: 'Déposer ma candidature',
    scroll: 'Découvrir la mission',
    organized: 'Ambassade des États-Unis · Bamako',
    bridge: 'AmCham Mali',
    eventLabel: 'Le rendez-vous',
    eventIntro: 'Quatre jours pour ouvrir le prochain chapitre de l’énergie propre.',
    dateLabel: '16 — 19',
    date: 'novembre 2026',
    location: 'Convention Center',
    professionals: '21e édition',
    why: 'Pourquoi maintenant',
    missionTitle: (
      <>
        Une fenêtre ouverte
        <br />
        <span>sur le monde.</span>
      </>
    ),
    missionBody:
      'RE+ réunit toute la chaîne de l’énergie propre : solaire, stockage, hydrogène, microréseaux, infrastructure de véhicules électriques et énergie éolienne. C’est l’endroit où les solutions deviennent des partenariats, et où les opérateurs maliens rencontrent l’écosystème américain.',
    benefits: [
      'Accéder au plus grand salon des énergies renouvelables en Amérique du Nord',
      'Présenter un projet concret auprès d’entreprises américaines',
      'Porter la voix du Mali au cœur de l’innovation énergétique',
    ],
    statement: (
      <>
        Le Mali a une place
        <br />
        à prendre dans la
        <br />
        <em>nouvelle énergie.</em>
      </>
    ),
    ambition: 'Notre ambition · 2026',
    applyEyebrow: 'Formulaire de candidature',
    applyTitle: 'Faites partie de la délégation.',
    applyBody:
      'Remplissez ce formulaire de façon exacte et complète. Joignez les documents demandés. Date limite : 04 septembre 2026. Envoi également possible à replusevent@amchammali.org.',
    deadline: 'Date limite · 04 septembre 2026',
    closed: 'Candidatures closes',
    closedTitle: 'La fenêtre est fermée.',
    closedBody:
      'La date limite du 04 septembre 2026 est passée. Pour toute question, écrivez à replusevent@amchammali.org.',
    partners: 'Organisé avec',
    officialSite: 'Site officiel RE+',
    visaNote:
      'Un visa américain peut prendre plusieurs semaines. Si vous êtes retenu(e), anticipez immédiatement le rendez-vous consulaire — le salon ouvre le 16 novembre.',
    privacyDocs:
      'Passeport, relevé bancaire et NINA sont stockés de façon privée et accessibles uniquement à l’équipe Embassy / AmCham.',
    closingEyebrow: 'Las Vegas · 16–19 novembre 2026',
    closing: 'Construisons la suite.',
    apply: 'Je candidate',
    footer: 'Délégation malienne · RE+ 2026 · Ambassade des États-Unis à Bamako & AmCham Mali',
    form: {
      steps: ['État civil', 'Entreprise', 'Questions', 'Documents'],
      requiredError: 'Veuillez renseigner tous les champs obligatoires.',
      consentError: 'Votre consentement est requis pour envoyer votre candidature.',
      docsError: 'Joignez le passeport, le relevé bancaire et le NINA ou l’attestation de travail.',
      genericError: 'Une erreur est survenue. Réessayez dans quelques instants.',
      continue: 'Continuer',
      back: 'Retour',
      send: 'Envoyer ma candidature',
      sending: 'Envoi en cours…',
      identity: 'Votre identité',
      company: 'Votre organisation',
      questions: 'Votre projet',
      documents: 'Pièces jointes',
      prenomNom: 'Prénom et nom *',
      prenomNomPh: 'Votre prénom et nom',
      profession: 'Profession *',
      professionPh: 'Votre fonction',
      email: 'Adresse email *',
      emailPh: 'vous@entreprise.ml',
      telephone: 'Numéro de téléphone *',
      telephonePh: '+223 …',
      orgName: 'Nom de l’organisation *',
      orgNamePh: 'Raison sociale',
      orgAddress: 'Adresse de l’organisation *',
      orgAddressPh: 'Ville, quartier, pays',
      dateCreation: 'Date de création *',
      datePlaceholder: 'Choisir la date',
      chooseFile: 'Choisir un fichier',
      replaceFile: 'Remplacer',
      removeFile: 'Retirer',
      dropFile: 'Déposez le fichier ici',
      fileTypeError: 'Format non accepté. Utilisez PDF, JPG ou PNG.',
      fileTooLargeError: 'Fichier trop volumineux ({max} Mo max. par pièce).',
      fileHint: 'PDF, JPG ou PNG · {max} Mo max. par pièce.',
      edit: 'Modifier',
      reviewTitle: 'Vérifiez votre dossier',
      docsTitle: 'Pièces à joindre',
      docsIntro:
        'Passeport, relevé bancaire et NINA ou attestation. PDF, JPG ou PNG · {max} Mo max. par pièce.',
      reviewProject: 'Projet',
      reviewVisa: 'Visa US',
      reviewDocs: 'Documents',
      secteur: 'Secteur d’activité *',
      secteurPh: 'Sélectionner',
      ca: 'Chiffre d’affaires annuel *',
      caPh: 'Montant indicatif',
      employees: 'Nombre d’employés *',
      employeesPh: 'Effectif',
      salon: 'Avez-vous déjà participé à une foire ou un salon international ? *',
      salonPh: 'Si oui, lequel et quand ? Sinon, indiquez « Non ».',
      projet:
        'Décrivez un projet concret que vous envisagez de développer grâce à RE+ ou avec une entreprise américaine. *',
      projetPh: 'Le projet, les partenaires visés, l’impact attendu…',
      raisons: 'Quelles sont vos raisons de vouloir participer à RE+ 2026 ? *',
      raisonsPh: 'Vos objectifs pour cette mission économique…',
      visa: 'Avez-vous déjà demandé un visa pour les États-Unis ? *',
      visaOptions: [
        { value: '', label: 'Sélectionner' },
        { value: 'jamais', label: 'Non, jamais demandé' },
        { value: 'obtenu', label: 'Oui, et je l’ai obtenu' },
        { value: 'refuse', label: 'Oui, mais il a été refusé' },
        { value: 'en_cours', label: 'Oui, la demande est en cours' },
      ],
      passport: 'Copie du passeport *',
      bank: 'Copie du relevé de compte bancaire de l’entreprise *',
      nina: 'Copie du NINA de l’entreprise ou attestation de travail *',
      consent:
        'J’accepte que ces informations et pièces jointes soient utilisées pour l’étude de ma candidature et la coordination de la délégation malienne à RE+ 2026.',
      reviewName: 'Identité',
      reviewOrg: 'Organisation',
      reviewContact: 'Contact',
      reviewSector: 'Secteur',
      successEyebrow: 'Dossier enregistré',
      successTitle: 'C’est envoyé.',
      successLead:
        'Gardez précieusement cette référence. L’Ambassade des États-Unis à Bamako et AmCham Mali s’en serviront pour vous recontacter.',
      successRefLabel: 'Votre référence',
      successCopy: 'Copier',
      successCopied: 'Copiée',
      successBody:
        'Un accusé part vers votre email. L’équipe étudie les candidatures jusqu’au 4 septembre 2026. Si vous êtes retenu(e), vous serez contacté(e) pour la suite — y compris le calendrier visa.',
      backHome: 'Retour à l’accueil',
      sectors: sectorsFr,
    },
  },
  en: {
    navEvent: 'The event',
    navMission: 'The mission',
    navApply: 'Apply',
    navCta: 'Join the delegation',
    eyebrow: 'Malian delegation · Las Vegas',
    heroTitle: (
      <>
        The future of <em>energy</em>
        <br />
        meets here.
      </>
    ),
    heroCopy:
      'From November 16 to 19, 2026, the Economic and Commercial Section of the U.S. Embassy in Bamako is assembling a delegation of Malian energy operators for RE+ — North America’s largest renewable energy trade show.',
    heroCta: 'Submit my application',
    scroll: 'Discover the mission',
    organized: 'U.S. Embassy · Bamako',
    bridge: 'AmCham Mali',
    eventLabel: 'The gathering',
    eventIntro: 'Four days to open the next chapter of clean energy.',
    dateLabel: '16 — 19',
    date: 'November 2026',
    location: 'Convention Center',
    professionals: '21st edition',
    why: 'Why now',
    missionTitle: (
      <>
        A window open
        <br />
        <span>to the world.</span>
      </>
    ),
    missionBody:
      'RE+ covers the full clean energy chain: solar, storage, hydrogen, microgrids, EV infrastructure and wind. It is where solutions become partnerships, and where Malian operators meet the U.S. ecosystem.',
    benefits: [
      'Access North America’s largest renewable energy trade show',
      'Present a concrete project to U.S. companies',
      'Bring Mali’s voice to the heart of energy innovation',
    ],
    statement: (
      <>
        Mali has a place
        <br />
        to claim in the
        <br />
        <em>new energy.</em>
      </>
    ),
    ambition: 'Our ambition · 2026',
    applyEyebrow: 'Application form',
    applyTitle: 'Join the delegation.',
    applyBody:
      'Complete this form accurately. Attach the required documents. Deadline: September 4, 2026. You may also email replusevent@amchammali.org.',
    deadline: 'Deadline · September 4, 2026',
    closed: 'Applications closed',
    closedTitle: 'The window is closed.',
    closedBody:
      'The September 4, 2026 deadline has passed. For questions, write to replusevent@amchammali.org.',
    partners: 'Organized with',
    officialSite: 'Official RE+ site',
    visaNote:
      'A U.S. visa can take several weeks. If selected, book the consular appointment immediately — the show opens on November 16.',
    privacyDocs:
      'Passport, bank statement and NINA files are stored privately and visible only to the Embassy / AmCham team.',
    closingEyebrow: 'Las Vegas · November 16–19, 2026',
    closing: 'Let’s build what’s next.',
    apply: 'I’m applying',
    footer: 'Malian delegation · RE+ 2026 · U.S. Embassy Bamako & AmCham Mali',
    form: {
      steps: ['Personal details', 'Company', 'Questions', 'Documents'],
      requiredError: 'Please complete all required fields.',
      consentError: 'Consent is required to submit your application.',
      docsError:
        'Attach your passport, company bank statement, and NINA or employment certificate.',
      genericError: 'Something went wrong. Please try again in a moment.',
      continue: 'Continue',
      back: 'Back',
      send: 'Submit my application',
      sending: 'Sending…',
      identity: 'Your identity',
      company: 'Your organization',
      questions: 'Your project',
      documents: 'Attachments',
      prenomNom: 'First and last name *',
      prenomNomPh: 'Your first and last name',
      profession: 'Profession *',
      professionPh: 'Your role',
      email: 'Email address *',
      emailPh: 'you@company.ml',
      telephone: 'Phone number *',
      telephonePh: '+223 …',
      orgName: 'Organization name *',
      orgNamePh: 'Legal name',
      orgAddress: 'Organization address *',
      orgAddressPh: 'City, district, country',
      datePlaceholder: 'Choose a date',
      chooseFile: 'Choose a file',
      replaceFile: 'Replace',
      removeFile: 'Remove',
      dropFile: 'Drop the file here',
      fileTypeError: 'File type not accepted. Use PDF, JPG or PNG.',
      fileTooLargeError: 'File too large ({max} MB max. per file).',
      fileHint: 'PDF, JPG or PNG · {max} MB max. per file.',
      edit: 'Edit',
      reviewTitle: 'Review your file',
      docsTitle: 'Attachments',
      docsIntro:
        'Passport, bank statement, and NINA or employment letter. PDF, JPG or PNG · {max} MB max. per file.',
      reviewProject: 'Project',
      reviewVisa: 'U.S. visa',
      reviewDocs: 'Documents',
      dateCreation: 'Date founded *',
      secteur: 'Sector of activity *',
      secteurPh: 'Select',
      ca: 'Annual turnover *',
      caPh: 'Indicative amount',
      employees: 'Number of employees *',
      employeesPh: 'Headcount',
      salon: 'Have you already attended an international trade fair? *',
      salonPh: 'If yes, which one and when? Otherwise write “No”.',
      projet:
        'Describe a concrete project you plan to develop thanks to RE+ or with a U.S. company. *',
      projetPh: 'The project, intended partners, expected impact…',
      raisons: 'Why do you want to take part in RE+ 2026? *',
      raisonsPh: 'Your goals for this economic mission…',
      visa: 'Have you ever applied for a U.S. visa? *',
      visaOptions: [
        { value: '', label: 'Select' },
        { value: 'jamais', label: 'No, never applied' },
        { value: 'obtenu', label: 'Yes, and it was granted' },
        { value: 'refuse', label: 'Yes, but it was refused' },
        { value: 'en_cours', label: 'Yes, the application is pending' },
      ],
      passport: 'Copy of passport *',
      bank: 'Copy of the company bank statement *',
      nina: 'Copy of the company NINA or employment certificate *',
      consent:
        'I agree that this information and these attachments may be used to review my application and coordinate the Malian delegation to RE+ 2026.',
      reviewName: 'Identity',
      reviewOrg: 'Organization',
      reviewContact: 'Contact',
      reviewSector: 'Sector',
      successEyebrow: 'Application recorded',
      successTitle: 'It’s submitted.',
      successLead:
        'Keep this reference. The U.S. Embassy in Bamako and AmCham Mali will use it to reach you.',
      successRefLabel: 'Your reference',
      successCopy: 'Copy',
      successCopied: 'Copied',
      successBody:
        'A receipt is on its way to your email. The team reviews applications through September 4, 2026. If selected, you will be contacted about next steps — including the visa timeline.',
      backHome: 'Back to home',
      sectors: sectorsEn,
    },
  },
} as const

export function getCopy(locale: Locale) {
  return copy[locale]
}

export function getSectors(locale: Locale) {
  return locale === 'en' ? sectorsEn : sectorsFr
}
