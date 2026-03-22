import type { Locale } from "@/lib/i18n-routing";

export type ServiceCategorySlug =
  | "gerust"
  | "elektriker"
  | "reinigung"
  | "fassade"
  | "heizung"
  | "sanitar";

interface ServiceCategoryContent {
  name: string;
  title: string;
  description: string;
  intro: string;
  bullets: string[];
  faqs: Array<{ question: string; answer: string }>;
}

const CONTENT: Record<
  Locale,
  Record<ServiceCategorySlug, ServiceCategoryContent>
> = {
  de: {
    gerust: {
      name: "Gerüstbau",
      title: "Gerüstbau in der Schweiz: geprüfte Anbieter auf ProjektMarkt",
      description:
        "Finden Sie Gerüstbau-Unternehmen für Wohn- und Gewerbeprojekte in der Schweiz. Ausschreibung, Offerten und sichere Vergabe über ProjektMarkt.",
      intro:
        "Ob Fassadensanierung, Neubau oder Dacharbeiten: Für Gerüstbau-Projekte in Zürich, Bern, Basel und der ganzen Schweiz verbinden wir Bauherren mit qualifizierten Gerüstbau-Firmen.",
      bullets: [
        "Ausschreibung in wenigen Minuten mit klaren Leistungsangaben",
        "Offerten von verifizierten Schweizer Gerüstbau-Betrieben",
        "Transparente Kommunikation und strukturierte Vergabe",
      ],
      faqs: [
        {
          question: "Welche Angaben sind für eine Gerüstbau-Anfrage wichtig?",
          answer:
            "Wichtig sind Gebäudehöhe, Fassadenlänge, Einsatzdauer, Zugangssituation und gewünschter Starttermin.",
        },
        {
          question: "Kann ich mehrere Offerten vergleichen?",
          answer:
            "Ja. Sie erhalten mehrere Offerten und können Preis, Umfang und Terminplanung direkt vergleichen.",
        },
      ],
    },
    elektriker: {
      name: "Elektriker",
      title: "Elektriker in der Schweiz für Umbau, Neubau und Service",
      description:
        "Elektriker für Installationen, Umbauten und Störungsbehebungen in der Schweiz finden. Regional, schnell und transparent vergleichen.",
      intro:
        "Von Starkstrom bis Smart-Home: ProjektMarkt hilft Ihnen, passende Elektriker für private und gewerbliche Projekte in der ganzen Schweiz zu finden.",
      bullets: [
        "Anfragen für Neuinstallationen, Umbauten und Sanierungen",
        "Verifizierte Elektrounternehmen mit Schweizer Markterfahrung",
        "Schnelle Rückmeldungen und nachvollziehbare Offerten",
      ],
      faqs: [
        {
          question: "Kann ich kleinere Servicearbeiten ausschreiben?",
          answer:
            "Ja. Auch kleinere Einsätze wie Sicherungsprobleme oder zusätzliche Anschlüsse können ausgeschrieben werden.",
        },
        {
          question: "Eignet sich die Plattform für Gewerbeprojekte?",
          answer:
            "Ja. Viele Anbieter decken Wohnbau, Büroflächen und gewerbliche Anforderungen ab.",
        },
      ],
    },
    reinigung: {
      name: "Reinigung",
      title: "Baureinigung und Unterhaltsreinigung in der Schweiz",
      description:
        "Reinigungsfirmen für Bauendreinigung, Umzugsreinigung und Unterhalt finden. Lokal in Zürich, Genf, Lausanne, Lugano und schweizweit.",
      intro:
        "Für Bauabnahmen, Liegenschaften und regelmässigen Unterhalt: ProjektMarkt vernetzt Sie mit zuverlässigen Reinigungsunternehmen aus Ihrer Region.",
      bullets: [
        "Bauendreinigung, Zwischenreinigung und Spezialreinigung",
        "Klare Leistungsbeschriebe für bessere Vergleichbarkeit",
        "Geeignet für Verwaltungen, Unternehmen und Privatkunden",
      ],
      faqs: [
        {
          question: "Sind auch wiederkehrende Reinigungen möglich?",
          answer:
            "Ja. Sie können einmalige Einsätze oder laufende Unterhaltsreinigungen ausschreiben.",
        },
        {
          question: "Wie schnell erhalte ich Angebote?",
          answer:
            "In der Regel gehen erste Rückmeldungen innerhalb kurzer Zeit ein, abhängig von Region und Umfang.",
        },
      ],
    },
    fassade: {
      name: "Fassade",
      title: "Fassadenarbeiten in der Schweiz professionell vergeben",
      description:
        "Fassadenbau und Fassadensanierung für Wohn- und Gewerbeobjekte in der Schweiz. Angebote vergleichen und den passenden Fachbetrieb wählen.",
      intro:
        "Von Sanierung bis Dämmung: Erhalten Sie Offerten von qualifizierten Fassadenbau-Unternehmen mit Erfahrung im Schweizer Markt.",
      bullets: [
        "Sanierung, Dämmung und Fassadeninstandsetzung",
        "Vergleichbare Offerten für bessere Entscheidungsgrundlagen",
        "Prozesse für private und gewerbliche Objekte",
      ],
      faqs: [
        {
          question: "Kann ich auch Teilarbeiten ausschreiben?",
          answer:
            "Ja. Sie können das Gesamtprojekt oder einzelne Abschnitte separat anfragen.",
        },
        {
          question: "Sind Referenzen der Anbieter sichtbar?",
          answer:
            "Sie sehen Profile und können den Anbieter direkt im Vergabeprozess bewerten.",
        },
      ],
    },
    heizung: {
      name: "Heizung",
      title: "Heizungsinstallateur in der Schweiz finden",
      description:
        "Heizungssanierung, Ersatzanlagen und neue Heizsysteme in der Schweiz ausschreiben. Fachbetriebe vergleichen und effizient vergeben.",
      intro:
        "Egal ob Wärmepumpe, Gas oder Fernwärme: Mit ProjektMarkt finden Sie Heizungsbetriebe für Neubau, Sanierung und Service.",
      bullets: [
        "Ausschreibungen für Ersatz und neue Heizlösungen",
        "Angebotsvergleich nach Leistung, Termin und Preis",
        "Geeignet für EFH, MFH und gewerbliche Liegenschaften",
      ],
      faqs: [
        {
          question: "Kann ich mehrere Systemvarianten anfragen?",
          answer:
            "Ja. Sie können im Projekt verschiedene Heizsysteme zur Offertstellung zulassen.",
        },
        {
          question: "Ist die Plattform auch für Sanierungen geeignet?",
          answer:
            "Ja. Viele Heizungsprojekte auf ProjektMarkt betreffen Bestandsobjekte und Ersatzanlagen.",
        },
      ],
    },
    sanitar: {
      name: "Sanitär",
      title: "Sanitärarbeiten in der Schweiz online ausschreiben",
      description:
        "Sanitärfirmen für Badumbau, Leitungsarbeiten und Installationen in der Schweiz finden. Schnell anfragen und Offerten vergleichen.",
      intro:
        "Für Neubau, Umbau und Reparaturen: ProjektMarkt bringt Sie mit Sanitärprofis zusammen, die zu Umfang und Zeitplan Ihres Projekts passen.",
      bullets: [
        "Badumbauten, Leitungsarbeiten und Neuinstallationen",
        "Strukturierte Anfrage mit relevanten Projektdetails",
        "Passend für private und gewerbliche Liegenschaften",
      ],
      faqs: [
        {
          question: "Kann ich dringende Sanitärarbeiten ausschreiben?",
          answer:
            "Ja. In der Anfrage können Sie Dringlichkeit und gewünschten Einsatztermin angeben.",
        },
        {
          question: "Wie verbessere ich die Qualität der Offerten?",
          answer:
            "Fügen Sie Fotos, Pläne und eine klare Leistungsbeschreibung hinzu. Das erhöht die Vergleichbarkeit.",
        },
      ],
    },
  },
  fr: {
    gerust: {
      name: "Échafaudage",
      title: "Échafaudage en Suisse: trouvez des entreprises qualifiées",
      description:
        "Publiez votre projet d'échafaudage en Suisse et comparez des offres d'entreprises vérifiées sur ProjektMarkt.",
      intro:
        "Rénovation de façade, toiture ou chantier neuf: ProjektMarkt vous aide à trouver des spécialistes de l'échafaudage partout en Suisse.",
      bullets: [
        "Publication rapide avec cahier des charges clair",
        "Offres d'entreprises d'échafaudage vérifiées",
        "Comparaison transparente avant attribution",
      ],
      faqs: [
        {
          question: "Quelles informations dois-je préparer?",
          answer:
            "Indiquez la hauteur, la longueur de façade, la durée d'utilisation et la date souhaitée.",
        },
        {
          question: "Puis-je comparer plusieurs offres?",
          answer:
            "Oui, vous comparez prix, prestations et délais avant votre décision.",
        },
      ],
    },
    elektriker: {
      name: "Électricien",
      title: "Électriciens en Suisse pour installations et rénovations",
      description:
        "Trouvez un électricien en Suisse pour vos travaux résidentiels ou professionnels. Offres comparables et réponses rapides.",
      intro:
        "Installation, rénovation, dépannage: ProjektMarkt relie maîtres d'ouvrage et électriciens qualifiés dans toute la Suisse.",
      bullets: [
        "Demandes pour nouvelles installations et transformations",
        "Entreprises d'électricité avec expérience locale",
        "Processus clair de demande et de comparaison",
      ],
      faqs: [
        {
          question: "Les petits travaux sont-ils acceptés?",
          answer:
            "Oui, les interventions ponctuelles peuvent aussi être publiées.",
        },
        {
          question: "Est-ce adapté aux projets d'entreprise?",
          answer:
            "Oui, la plateforme couvre aussi les besoins des surfaces commerciales et bureaux.",
        },
      ],
    },
    reinigung: {
      name: "Nettoyage",
      title: "Services de nettoyage en Suisse: chantier et entretien",
      description:
        "Entreprise de nettoyage en Suisse pour fin de chantier, entretien et nettoyage spécial. Comparez des offres locales.",
      intro:
        "Pour immeubles, entreprises et particuliers, ProjektMarkt facilite la recherche de prestataires de nettoyage fiables.",
      bullets: [
        "Nettoyage de fin de chantier et entretien régulier",
        "Demandes structurées pour des offres comparables",
        "Couverture des régions principales en Suisse",
      ],
      faqs: [
        {
          question: "Puis-je demander un contrat récurrent?",
          answer:
            "Oui, vous pouvez demander des interventions ponctuelles ou régulières.",
        },
        {
          question: "Combien de temps pour recevoir des offres?",
          answer:
            "Les premières réponses arrivent souvent rapidement selon la région et la complexité.",
        },
      ],
    },
    fassade: {
      name: "Façade",
      title: "Travaux de façade en Suisse avec entreprises spécialisées",
      description:
        "Publiez vos besoins en façade en Suisse et comparez des offres d'entreprises qualifiées.",
      intro:
        "Rénovation, isolation et remise en état de façade: ProjektMarkt vous met en relation avec des entreprises adaptées.",
      bullets: [
        "Projets résidentiels et commerciaux",
        "Comparaison des prestations et des coûts",
        "Attribution simplifiée avec communication directe",
      ],
      faqs: [
        {
          question: "Puis-je publier une partie du projet?",
          answer:
            "Oui, vous pouvez publier l'ensemble ou des lots séparés.",
        },
        {
          question: "Les profils des entreprises sont-ils visibles?",
          answer:
            "Oui, vous pouvez consulter leur profil avant d'attribuer le mandat.",
        },
      ],
    },
    heizung: {
      name: "Chauffage",
      title: "Installateurs chauffage en Suisse: rénovation et remplacement",
      description:
        "Trouvez des installateurs chauffage en Suisse pour remplacement d'installation, rénovation énergétique et nouvelles solutions.",
      intro:
        "Pompe à chaleur, gaz ou autres systèmes: publiez votre projet et comparez les offres d'installateurs suisses.",
      bullets: [
        "Demandes pour nouvelles installations et remplacements",
        "Comparaison claire des propositions reçues",
        "Adapté aux logements et bâtiments professionnels",
      ],
      faqs: [
        {
          question: "Puis-je demander plusieurs variantes techniques?",
          answer:
            "Oui, vous pouvez indiquer plusieurs solutions souhaitées dans votre demande.",
        },
        {
          question: "La plateforme convient-elle aux rénovations?",
          answer:
            "Oui, une grande partie des projets concerne des bâtiments existants.",
        },
      ],
    },
    sanitar: {
      name: "Sanitaire",
      title: "Travaux sanitaires en Suisse: demandez et comparez",
      description:
        "Trouvez des entreprises sanitaires en Suisse pour installations, rénovation de salle de bains et interventions techniques.",
      intro:
        "Projet neuf, transformation ou dépannage: ProjektMarkt vous aide à trouver rapidement les bons professionnels sanitaires.",
      bullets: [
        "Installations sanitaires et rénovation de salle de bains",
        "Demandes détaillées pour des offres plus précises",
        "Prestataires adaptés aux projets privés et professionnels",
      ],
      faqs: [
        {
          question: "Puis-je publier un besoin urgent?",
          answer:
            "Oui, indiquez le niveau d'urgence et le délai souhaité dans la demande.",
        },
        {
          question: "Comment améliorer la qualité des offres?",
          answer:
            "Ajoutez des photos, des plans et une description claire des travaux attendus.",
        },
      ],
    },
  },
  it: {
    gerust: {
      name: "Ponteggio",
      title: "Servizi ponteggi in Svizzera con imprese qualificate",
      description:
        "Trova aziende specializzate in ponteggi in Svizzera e confronta offerte trasparenti su ProjektMarkt.",
      intro:
        "Per facciate, tetti e nuove costruzioni, ProjektMarkt collega committenti e imprese ponteggi qualificate in tutta la Svizzera.",
      bullets: [
        "Pubblicazione rapida della richiesta con dettagli tecnici",
        "Offerte da aziende verificate sul mercato svizzero",
        "Confronto chiaro prima dell'assegnazione lavori",
      ],
      faqs: [
        {
          question: "Quali dati servono per una richiesta ponteggi?",
          answer:
            "Altezza edificio, lunghezza facciata, durata del cantiere e data di inizio desiderata.",
        },
        {
          question: "Posso confrontare più preventivi?",
          answer:
            "Sì, puoi confrontare prezzo, contenuti e tempistiche in modo trasparente.",
        },
      ],
    },
    elektriker: {
      name: "Elettricista",
      title: "Elettricisti in Svizzera per impianti e ristrutturazioni",
      description:
        "Trova elettricisti in Svizzera per installazioni, ristrutturazioni e interventi tecnici. Confronta offerte in modo semplice.",
      intro:
        "Dal nuovo impianto ai lavori di adeguamento, ProjektMarkt ti aiuta a selezionare professionisti elettrici affidabili.",
      bullets: [
        "Richieste per abitazioni, uffici e attività commerciali",
        "Aziende elettriche con esperienza locale in CH",
        "Processo digitale rapido per richiesta e confronto",
      ],
      faqs: [
        {
          question: "Posso pubblicare anche piccoli lavori?",
          answer:
            "Sì, anche interventi puntuali o manutenzioni possono essere pubblicati.",
        },
        {
          question: "È adatto anche a progetti aziendali?",
          answer:
            "Sì, la piattaforma supporta anche esigenze professionali e commerciali.",
        },
      ],
    },
    reinigung: {
      name: "Pulizia",
      title: "Servizi di pulizia in Svizzera: cantiere e manutenzione",
      description:
        "Trova imprese di pulizia in Svizzera per fine cantiere, pulizie periodiche e servizi speciali.",
      intro:
        "Per immobili, aziende e privati, ProjektMarkt facilita la ricerca di partner affidabili per servizi di pulizia.",
      bullets: [
        "Pulizia finale di cantiere e manutenzione ordinaria",
        "Richieste strutturate per preventivi comparabili",
        "Copertura nelle principali regioni svizzere",
      ],
      faqs: [
        {
          question: "Posso richiedere un servizio ricorrente?",
          answer:
            "Sì, puoi indicare sia interventi una tantum sia contratti periodici.",
        },
        {
          question: "Quanto tempo serve per ricevere preventivi?",
          answer:
            "Le prime risposte arrivano spesso rapidamente, in base a zona e complessità.",
        },
      ],
    },
    fassade: {
      name: "Facciata",
      title: "Lavori di facciata in Svizzera con imprese specializzate",
      description:
        "Pubblica lavori di facciata in Svizzera e confronta offerte di imprese qualificate.",
      intro:
        "Risanamento, isolamento e manutenzione facciate: ProjektMarkt ti aiuta a trovare il partner giusto.",
      bullets: [
        "Progetti residenziali e commerciali",
        "Confronto prestazioni, prezzi e tempistiche",
        "Assegnazione semplificata tramite piattaforma",
      ],
      faqs: [
        {
          question: "Posso pubblicare solo una parte del progetto?",
          answer:
            "Sì, puoi gestire l'intero progetto o lotti separati.",
        },
        {
          question: "Posso valutare i profili delle imprese?",
          answer:
            "Sì, puoi consultare i profili prima di scegliere l'offerente.",
        },
      ],
    },
    heizung: {
      name: "Riscaldamento",
      title: "Installatori riscaldamento in Svizzera: sostituzione e upgrade",
      description:
        "Trova installatori riscaldamento in Svizzera per sostituzioni impianto, ristrutturazioni energetiche e nuove soluzioni.",
      intro:
        "Pompa di calore, gas o altri sistemi: pubblica il progetto e ricevi offerte da professionisti svizzeri.",
      bullets: [
        "Richieste per impianti nuovi e sostituzioni",
        "Confronto preventivi su basi chiare e trasparenti",
        "Adatto a edifici privati e commerciali",
      ],
      faqs: [
        {
          question: "Posso chiedere più varianti di impianto?",
          answer:
            "Sì, puoi indicare vari scenari tecnici nella stessa richiesta.",
        },
        {
          question: "È utile anche per ristrutturazioni?",
          answer:
            "Sì, molti progetti riguardano edifici esistenti e ammodernamenti.",
        },
      ],
    },
    sanitar: {
      name: "Sanitario",
      title: "Lavori sanitari in Svizzera: trova professionisti affidabili",
      description:
        "Trova imprese sanitarie in Svizzera per bagno, tubazioni e installazioni. Preventivi rapidi e comparabili.",
      intro:
        "Nuove installazioni, ristrutturazioni o riparazioni: ProjektMarkt ti aiuta a selezionare professionisti sanitari adatti al tuo progetto.",
      bullets: [
        "Rifacimento bagno, tubazioni e impianti sanitari",
        "Brief di progetto chiaro per offerte migliori",
        "Soluzioni per clienti privati e aziendali",
      ],
      faqs: [
        {
          question: "Posso inserire richieste urgenti?",
          answer:
            "Sì, specifica l'urgenza e la finestra temporale desiderata.",
        },
        {
          question: "Come ottenere preventivi più precisi?",
          answer:
            "Aggiungi foto, planimetrie e una descrizione dettagliata dei lavori richiesti.",
        },
      ],
    },
  },
  en: {} as Record<ServiceCategorySlug, ServiceCategoryContent>,
};

CONTENT.en = CONTENT.de;

export const SERVICE_CATEGORY_SLUGS: ServiceCategorySlug[] = [
  "gerust",
  "elektriker",
  "reinigung",
  "fassade",
  "heizung",
  "sanitar",
];

export function isServiceCategorySlug(value: string): value is ServiceCategorySlug {
  return SERVICE_CATEGORY_SLUGS.includes(value as ServiceCategorySlug);
}

export function getServiceCategoryContent(locale: Locale, category: ServiceCategorySlug) {
  return CONTENT[locale][category];
}
