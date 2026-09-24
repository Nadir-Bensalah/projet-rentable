import type { Block, LegalPage } from "./types";

/**
 * Legal pages of Relevéo.
 *
 * WARNING: these texts are DRAFTS written without legal validation. They must be
 * reviewed by a legal professional and every "[À COMPLÉTER : ...]" / "[À CONFIRMER]"
 * field must be filled in before launch.
 */

const UPDATED = "2026-09-24";

const DRAFT_CALLOUT: Block = {
  type: "callout",
  tone: "warning",
  title: "Document à valider",
  text:
    "Ce texte est un **projet** rédigé avant le lancement du service. Il n'a pas encore été validé par un professionnel du droit et doit l'être avant toute mise en ligne commerciale. Les mentions entre crochets (« [À COMPLÉTER : ...] », « [À CONFIRMER] ») sont des champs provisoires qui doivent être complétés ou vérifiés.",
};

const CONTACT_EMAIL = "[À COMPLÉTER : adresse e-mail de contact]";
const PUBLISHER = "[À COMPLÉTER : nom et prénom de l'entrepreneur]";
const STATUS = "[À COMPLÉTER : Entrepreneur individuel (micro-entreprise)]";
const SIREN = "[À COMPLÉTER : SIREN]";
const ADDRESS = "[À COMPLÉTER : adresse de domiciliation]";
const VAT = "TVA non applicable, art. 293 B du CGI [À CONFIRMER]";
const DIRECTOR = "[À COMPLÉTER : directeur de la publication]";
const APP_HOST = "[À COMPLÉTER : hébergeur de l'application]";
const DB_HOST = "[À COMPLÉTER : hébergeur de la base de données]";
const PAYMENT_PROVIDER = "[À COMPLÉTER : Lemon Squeezy ou Stripe selon configuration]";
const EMAIL_PROVIDER = "[À COMPLÉTER : Resend ou fournisseur SMTP]";
const MEDIATOR = "[À COMPLÉTER : médiateur de la consommation]";

export const LEGAL_PAGES: LegalPage[] = [
  // ---------------------------------------------------------------------------
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    description:
      "Mentions légales de Relevéo : éditeur du site, directeur de la publication, hébergeurs et contact.",
    updated: UPDATED,
    blocks: [
      DRAFT_CALLOUT,
      { type: "h2", id: "editeur", text: "Éditeur du site" },
      {
        type: "p",
        text: "Le site et le service Relevéo sont édités par une personne physique exerçant sous le statut d'entrepreneur individuel (micro-entreprise) :",
      },
      {
        type: "ul",
        items: [
          `**Nom et prénom :** ${PUBLISHER}`,
          `**Statut :** ${STATUS}`,
          `**SIREN :** ${SIREN}`,
          `**Adresse :** ${ADDRESS}`,
          `**TVA :** ${VAT}`,
          `**Contact :** ${CONTACT_EMAIL} ou via le [formulaire de contact](/contact)`,
        ],
      },
      { type: "h2", id: "directeur-publication", text: "Directeur de la publication" },
      { type: "p", text: `${DIRECTOR}` },
      { type: "h2", id: "hebergement", text: "Hébergement" },
      {
        type: "table",
        head: ["Rôle", "Prestataire"],
        rows: [
          ["Hébergement de l'application", `${APP_HOST} — [À COMPLÉTER : nom, adresse et téléphone de l'hébergeur]`],
          ["Hébergement de la base de données", `${DB_HOST} — [À COMPLÉTER : adresse et téléphone]`],
        ],
      },
      {
        type: "p",
        text: "Les données du service ont vocation à être hébergées dans l'Union européenne. [À CONFIRMER : région d'hébergement effective de chaque prestataire]",
      },
      { type: "h2", id: "propriete-intellectuelle", text: "Propriété intellectuelle" },
      {
        type: "p",
        text: "La marque Relevéo, le site, ses textes, son interface et son code sont la propriété de l'éditeur, sauf mention contraire (bibliothèques open source utilisées sous leur licence respective, polices de caractères). Toute reproduction non autorisée est interdite. Les noms de banques cités sur le site le sont à titre purement descriptif, pour indiquer les relevés pris en charge ; Relevéo n'est affilié à aucune banque.",
      },
      { type: "h2", id: "documents", text: "Autres documents" },
      {
        type: "ul",
        items: [
          "[Politique de confidentialité](/confidentialite)",
          "[Cookies et traceurs](/cookies)",
          "[Conditions générales d'utilisation](/cgu)",
          "[Conditions générales de vente](/cgv)",
          "[Politique de remboursement](/remboursement)",
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    description:
      "Quelles données Relevéo collecte, pourquoi, combien de temps, et vos droits. Le contenu de vos relevés ne quitte jamais votre navigateur.",
    updated: UPDATED,
    blocks: [
      DRAFT_CALLOUT,
      {
        type: "callout",
        tone: "success",
        title: "L'essentiel",
        text:
          "Vos relevés bancaires sont lus **uniquement dans votre navigateur**. Leur contenu (libellés, montants, numéros de compte) n'est **jamais transmis** à Relevéo ni stocké sur nos serveurs. Nous ne conservons que ce qui est nécessaire pour gérer votre compte, votre facturation et votre quota de pages.",
      },

      { type: "h2", id: "responsable", text: "Responsable du traitement" },
      {
        type: "p",
        text: `Le responsable du traitement est ${PUBLISHER}, ${STATUS}, SIREN ${SIREN}, ${ADDRESS}. Pour toute question relative à vos données : ${CONTACT_EMAIL} ou le [formulaire de contact](/contact).`,
      },

      { type: "h2", id: "releves", text: "Vos relevés bancaires" },
      {
        type: "p",
        text: "Le fichier PDF que vous déposez est ouvert et analysé par le code qui s'exécute dans votre navigateur. Il n'est pas envoyé à nos serveurs. Au moment d'un export, le serveur reçoit **uniquement** les informations suivantes, nécessaires au décompte de votre quota :",
      },
      {
        type: "ul",
        items: [
          "le nombre de pages du fichier ;",
          "une empreinte SHA-256 du fichier (une suite de caractères calculée à partir du fichier, qui ne permet pas d'en reconstituer le contenu), afin de vous permettre de ré-exporter gratuitement le même relevé dans le mois ;",
          "le format d'export choisi (Excel, CSV, OFX, QIF, JSON, écritures) ;",
          "l'identifiant de la banque reconnue (par exemple « bnp-paribas ») ;",
          "le statut du contrôle de cohérence : vérifié, écart constaté ou non vérifiable.",
        ],
      },
      {
        type: "p",
        text: "Les relevés convertis peuvent être conservés **dans votre propre navigateur** (stockage de session) pour ne pas les perdre en rechargeant la page. Ces données restent sur votre appareil et ne nous sont jamais envoyées ; elles disparaissent à la fermeture de l'onglet.",
      },
      {
        type: "p",
        text: "Si vous choisissez de nous signaler un relevé mal lu, le rapport envoyé est **anonymisé** : il contient uniquement la structure détectée (nombre d'éléments, rôle des colonnes, statut, avertissements) et, le cas échéant, le commentaire que vous rédigez. Il ne contient ni texte du relevé ni montant. Cet envoi est facultatif et se fait à votre initiative.",
      },

      { type: "h2", id: "donnees", text: "Données que nous traitons" },
      {
        type: "table",
        head: ["Catégorie", "Données", "Finalité", "Base légale"],
        rows: [
          [
            "Compte",
            "Adresse e-mail, empreinte du mot de passe (algorithme scrypt, le mot de passe lui-même n'est jamais stocké), nom (facultatif), dates de création, de dernière connexion et de vérification de l'e-mail",
            "Créer et gérer votre compte, vous authentifier",
            "Exécution du contrat",
          ],
          [
            "Sessions",
            "Jeton de session (stocké sous forme d'empreinte), navigateur utilisé (user agent), empreinte de l'adresse IP, dates",
            "Maintenir votre connexion, sécuriser le compte",
            "Exécution du contrat ; intérêt légitime (sécurité)",
          ],
          [
            "Jetons e-mail",
            "Jetons de vérification d'adresse et de réinitialisation du mot de passe (stockés sous forme d'empreinte)",
            "Vérifier votre adresse, réinitialiser votre mot de passe",
            "Exécution du contrat",
          ],
          [
            "Utilisation du service",
            "Crédits de pages, événements d'export (nombre de pages, empreinte du fichier, format, banque reconnue, statut du contrôle)",
            "Décompter votre quota, permettre le ré-export gratuit",
            "Exécution du contrat",
          ],
          [
            "Abonnements et commandes",
            "Identifiants chez le prestataire de paiement, offre, montants, statut, lien vers le reçu",
            "Gérer vos achats et abonnements, tenir la comptabilité",
            "Exécution du contrat ; obligation légale (comptabilité)",
          ],
          [
            "Parrainage et acquisition",
            "Code de parrainage, parrain éventuel, première source de visite (paramètres utm source / medium / campaign, page d'arrivée)",
            "Gérer le parrainage, comprendre comment le service est découvert",
            "Exécution du contrat (parrainage) ; intérêt légitime (mesure)",
          ],
          [
            "Communications",
            "Consentement aux e-mails d'information, journal des e-mails envoyés (destinataire, modèle, statut)",
            "Envoyer les e-mails de service et, si vous l'avez accepté, des informations sur le produit",
            "Exécution du contrat ; consentement (e-mails d'information)",
          ],
          [
            "Contact",
            "Adresse e-mail, sujet et contenu du message",
            "Répondre à vos demandes",
            "Intérêt légitime ; exécution du contrat",
          ],
          [
            "Rapports de mise en page",
            "Structure anonymisée d'un relevé mal lu (voir ci-dessus), banque, commentaire facultatif",
            "Améliorer la reconnaissance des relevés",
            "Consentement (envoi volontaire)",
          ],
          [
            "Sécurité",
            "Compteurs de limitation de requêtes (clés contenant une empreinte d'adresse IP ou l'identifiant de compte)",
            "Prévenir les abus et les attaques",
            "Intérêt légitime (sécurité)",
          ],
          [
            "Mesure d'audience",
            "Nom de l'événement, identifiant aléatoire de visite (propre à l'onglet), identifiant de compte si connecté, page visitée, site de provenance, paramètres utm, petites propriétés (ex. format choisi, nombre de pages) — jamais le contenu d'un relevé",
            "Mesurer l'audience et améliorer le service",
            "Intérêt légitime ; voir la page [Cookies et traceurs](/cookies)",
          ],
        ],
        caption: "Bases légales : article 6 du RGPD. [À CONFIRMER]",
      },
      {
        type: "p",
        text: "Nous n'utilisons **aucun cookie publicitaire** ni traceur tiers, et nous ne vendons ni ne louons vos données. Aucune décision automatisée produisant des effets juridiques à votre égard n'est prise.",
      },

      { type: "h2", id: "destinataires", text: "Destinataires et sous-traitants" },
      {
        type: "p",
        text: "Vos données sont accessibles à l'éditeur et aux prestataires strictement nécessaires au fonctionnement du service :",
      },
      {
        type: "table",
        head: ["Prestataire", "Rôle", "Données concernées"],
        rows: [
          [
            PAYMENT_PROVIDER,
            "Paiement, facturation, gestion des abonnements (revendeur officiel « merchant of record » ou prestataire de paiement selon configuration)",
            "E-mail, informations de commande. Les données de carte bancaire sont saisies directement chez le prestataire et ne transitent jamais par Relevéo.",
          ],
          [EMAIL_PROVIDER, "Envoi des e-mails transactionnels", "Adresse e-mail, contenu de l'e-mail"],
          [APP_HOST, "Hébergement de l'application", "Ensemble des données traitées par le serveur"],
          [DB_HOST, "Hébergement de la base de données", "Données stockées décrites ci-dessus"],
        ],
      },
      {
        type: "p",
        text: "Si la mesure d'audience Plausible (sans cookie) est activée par l'éditeur, elle constitue un destinataire supplémentaire pour des données de navigation agrégées. [À CONFIRMER : activé ou non]",
      },
      {
        type: "p",
        text: "Les données ont vocation à être hébergées dans l'Union européenne. Si un prestataire est situé hors de l'Union européenne (notamment le prestataire de paiement), le transfert est encadré par des garanties appropriées (décision d'adéquation ou clauses contractuelles types de la Commission européenne). [À COMPLÉTER : pays et garanties pour chaque prestataire]",
      },

      { type: "h2", id: "conservation", text: "Durées de conservation" },
      {
        type: "table",
        head: ["Données", "Durée"],
        rows: [
          ["Compte, crédits, événements d'export, abonnements, journal des e-mails", "Jusqu'à la suppression du compte"],
          ["Sessions", "30 jours"],
          ["Jetons e-mail", "48 heures (vérification) ou 1 heure (réinitialisation), puis suppression 7 jours après expiration"],
          ["Mesure d'audience", "13 mois, puis suppression automatique"],
          ["Compteurs de limitation de requêtes", "Environ 1 jour"],
          [
            "Commandes",
            "Conservées pour les obligations comptables même après suppression du compte (le lien avec le compte est alors supprimé) — [À CONFIRMER : 10 ans, art. L123-22 du Code de commerce]. Les factures sont détenues par le prestataire de paiement.",
          ],
          ["Messages de contact", "[À COMPLÉTER : durée, ex. 3 ans]"],
          ["Rapports de mise en page anonymisés", "[À COMPLÉTER : durée] (le lien avec le compte est supprimé à la suppression du compte)"],
        ],
      },

      { type: "h2", id: "droits", text: "Vos droits" },
      {
        type: "p",
        text: "Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :",
      },
      {
        type: "ul",
        items: [
          "**accès** à vos données et **portabilité** : un export complet au format JSON est disponible en libre-service dans [Paramètres du compte](/compte/parametres) ;",
          "**rectification** de vos données inexactes ;",
          "**effacement** : vous pouvez supprimer votre compte vous-même dans [Paramètres du compte](/compte/parametres) (confirmation par mot de passe et saisie du mot SUPPRIMER). La suppression résilie l'abonnement éventuel auprès du prestataire de paiement et efface immédiatement les données du compte, à l'exception des commandes conservées pour la comptabilité ;",
          "**opposition** (notamment à la mesure d'audience, depuis la page [Cookies et traceurs](/cookies)) et **limitation** du traitement ;",
          "**retrait du consentement** à tout moment (e-mails d'information, par exemple), sans remettre en cause les traitements antérieurs ;",
          "**directives post-mortem** sur le sort de vos données après votre décès.",
        ],
      },
      {
        type: "p",
        text: `Pour exercer ces droits : ${CONTACT_EMAIL} ou le [formulaire de contact](/contact). Nous répondons dans un délai d'un mois. Une preuve d'identité peut être demandée en cas de doute raisonnable.`,
      },
      {
        type: "p",
        text: "Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL : [www.cnil.fr](https://www.cnil.fr).",
      },

      { type: "h2", id: "securite", text: "Sécurité" },
      {
        type: "p",
        text: "Les mots de passe sont stockés sous forme d'empreinte (scrypt), les jetons de session et d'e-mail sous forme d'empreinte, et les adresses IP sous forme d'empreinte. Les échanges avec le site sont chiffrés (HTTPS). Surtout, le contenu de vos relevés n'étant jamais transmis, il ne peut pas fuiter depuis nos serveurs.",
      },

      { type: "h2", id: "modifications", text: "Modifications" },
      {
        type: "p",
        text: "Cette politique peut évoluer. En cas de changement important, les titulaires d'un compte en seront informés par e-mail. La date de dernière mise à jour figure en haut de la page.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "cookies",
    title: "Cookies et traceurs",
    description:
      "Relevéo n'utilise aucun cookie publicitaire : un cookie de session, un stockage local et une mesure d'audience interne désactivable.",
    updated: UPDATED,
    blocks: [
      DRAFT_CALLOUT,
      {
        type: "p",
        text: "Relevéo n'utilise **aucun cookie publicitaire** et **aucun traceur tiers**. Cette page liste de façon exhaustive ce qui est déposé ou lu sur votre appareil.",
      },

      { type: "h2", id: "cookie", text: "Cookie" },
      {
        type: "table",
        head: ["Nom", "Finalité", "Durée", "Consentement"],
        rows: [
          [
            "Cookie de session",
            "Vous garder connecté à votre compte. Inaccessible aux scripts (httpOnly). Déposé uniquement lorsque vous vous connectez.",
            "30 jours",
            "Non requis (strictement nécessaire)",
          ],
        ],
      },

      { type: "h2", id: "stockage", text: "Stockage dans le navigateur" },
      {
        type: "table",
        head: ["Clé", "Type", "Contenu et finalité", "Durée"],
        rows: [
          ["rv_aid", "sessionStorage", "Identifiant de visite aléatoire, utilisé pour la mesure d'audience", "Jusqu'à la fermeture de l'onglet"],
          ["rv_utm", "sessionStorage", "Première source de visite (paramètres utm), pour la mesure d'audience", "Jusqu'à la fermeture de l'onglet"],
          [
            "releveo:workspace",
            "sessionStorage",
            "Vos relevés convertis, conservés dans votre propre navigateur entre deux chargements de page. **Jamais envoyé** à Relevéo.",
            "Jusqu'à la fermeture de l'onglet",
          ],
          ["rv_theme", "localStorage", "Thème d'affichage choisi (clair ou sombre)", "Jusqu'à suppression par vous"],
          ["rv_optout", "localStorage", "Mémorise votre refus de la mesure d'audience", "Jusqu'à suppression par vous"],
        ],
      },

      { type: "h2", id: "mesure-audience", text: "Mesure d'audience" },
      {
        type: "p",
        text: "Nous mesurons la fréquentation avec un outil **interne** (first-party) : les événements (pages vues, étapes clés comme un export) sont envoyés à nos propres serveurs, avec un identifiant aléatoire propre à l'onglet. Ils ne contiennent jamais le contenu de vos relevés, ne sont pas croisés avec d'autres traitements à des fins publicitaires, ne sont transmis à aucun tiers et sont supprimés automatiquement au bout de 13 mois.",
      },
      {
        type: "p",
        text: "Ce dispositif est conçu pour respecter les conditions d'exemption de consentement définies par la CNIL pour la mesure d'audience. [À CONFIRMER par l'éditeur : conformité effective aux conditions d'exemption de la CNIL] Vous pouvez néanmoins vous y opposer à tout moment avec le bouton ci-dessous ; votre choix est mémorisé dans votre navigateur (clé rv_optout).",
      },
      {
        type: "p",
        text: "L'éditeur peut également activer Plausible, un outil de mesure d'audience sans cookie. [À CONFIRMER : activé ou non]",
      },

      { type: "h2", id: "gerer", text: "Gérer ou supprimer ces données" },
      {
        type: "p",
        text: "Vous pouvez à tout moment effacer les cookies et le stockage local de ce site depuis les réglages de votre navigateur. La suppression du cookie de session vous déconnecte ; celle de « releveo:workspace » efface les relevés convertis encore présents dans l'onglet.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "cgu",
    title: "Conditions générales d'utilisation",
    description:
      "Règles d'utilisation du service Relevéo : compte, fonctionnement, vérification des résultats, responsabilités et droit applicable.",
    updated: UPDATED,
    blocks: [
      DRAFT_CALLOUT,

      { type: "h2", id: "objet", text: "1. Objet" },
      {
        type: "p",
        text: `Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'utilisation du service Relevéo, édité par ${PUBLISHER}, ${STATUS}, SIREN ${SIREN} (voir les [mentions légales](/mentions-legales)). Les conditions d'achat des offres payantes figurent dans les [conditions générales de vente](/cgv).`,
      },
      {
        type: "p",
        text: "L'utilisation du service vaut acceptation des présentes CGU. La création d'un compte requiert leur acceptation expresse.",
      },

      { type: "h2", id: "service", text: "2. Description du service" },
      {
        type: "p",
        text: "Relevéo convertit des relevés bancaires au format PDF en fichiers Excel, CSV, OFX, QIF, JSON ou en journal d'écritures (colonnes au format FEC). Le fichier PDF est lu **uniquement dans votre navigateur** : son contenu n'est ni transmis ni stocké par Relevéo (voir la [politique de confidentialité](/confidentialite)).",
      },
      {
        type: "p",
        text: "Pour chaque relevé, le service tente un contrôle de cohérence (solde de départ + opérations = solde final) et affiche un statut : vérifié, écart constaté ou non vérifiable.",
      },

      { type: "h2", id: "compte", text: "3. Compte utilisateur" },
      {
        type: "ul",
        items: [
          "Vous devez fournir une adresse e-mail valide dont vous avez le contrôle.",
          "Vous êtes responsable de la confidentialité de votre mot de passe et de l'usage fait de votre compte.",
          "Vous pouvez supprimer votre compte à tout moment depuis [Paramètres du compte](/compte/parametres).",
          "Un compte est personnel ; le partage d'un compte pour contourner les quotas est interdit.",
        ],
      },

      { type: "h2", id: "usage", text: "4. Usage autorisé" },
      {
        type: "p",
        text: "Vous vous engagez à n'utiliser le service que pour des documents que vous êtes en droit de traiter (vos propres relevés, ou ceux de vos clients ou mandants dans le cadre de votre activité). Sont notamment interdits :",
      },
      {
        type: "ul",
        items: [
          "tout usage contraire à la loi, notamment la falsification de documents ;",
          "les tentatives de contournement des quotas, des limitations techniques ou des mesures de sécurité ;",
          "les requêtes automatisées massives ou toute action de nature à perturber le service ;",
          "la revente ou la mise à disposition du service à des tiers sans accord écrit.",
        ],
      },

      { type: "h2", id: "resultats", text: "5. Vérification des résultats" },
      {
        type: "callout",
        tone: "info",
        title: "Un outil d'aide à la saisie",
        text:
          "Relevéo est une **aide à la transcription**. La lecture automatique d'un PDF peut comporter des erreurs (mise en page inhabituelle, document scanné, libellés sur plusieurs lignes...). Il vous appartient de **vérifier les données exportées** avant de les utiliser, en particulier lorsque le statut du contrôle n'est pas « vérifié ».",
      },
      {
        type: "p",
        text: "Relevéo ne fournit **aucun conseil comptable, fiscal ou juridique**. Les exports au format journal ou en colonnes FEC sont des aides à la saisie et ne constituent pas à eux seuls un fichier des écritures comptables conforme ; leur intégration dans une comptabilité relève de votre responsabilité ou de celle de votre expert-comptable.",
      },

      { type: "h2", id: "disponibilite", text: "6. Disponibilité" },
      {
        type: "p",
        text: "L'éditeur s'efforce de maintenir le service accessible, sans garantie de disponibilité continue. Le service peut être interrompu pour maintenance, mise à jour ou en cas d'incident chez un prestataire. Le format des relevés pouvant changer à l'initiative des banques, la prise en charge d'une banque donnée n'est pas garantie dans le temps.",
      },

      { type: "h2", id: "responsabilite", text: "7. Responsabilité" },
      {
        type: "p",
        text: "**Utilisateurs professionnels** : dans les limites permises par la loi, l'éditeur n'est tenu que d'une obligation de moyens. Sa responsabilité ne peut être engagée pour des dommages indirects (perte de chiffre d'affaires, de données, pénalités, redressement) et, pour les dommages directs, est limitée au montant payé par l'utilisateur au cours des 12 mois précédant le fait générateur. [À CONFIRMER : plafond et rédaction]",
      },
      {
        type: "p",
        text: "**Consommateurs** : l'éditeur est responsable dans les conditions du droit commun. Aucune clause des présentes ne limite les droits que les consommateurs tiennent des dispositions légales impératives, notamment de la garantie légale de conformité applicable aux contenus et services numériques.",
      },
      {
        type: "p",
        text: "Dans tous les cas, l'éditeur n'est pas responsable des conséquences d'une utilisation des exports sans la vérification prévue à l'article 5, ni des documents traités par l'utilisateur, qui en demeure seul responsable.",
      },

      { type: "h2", id: "propriete", text: "8. Propriété intellectuelle" },
      {
        type: "p",
        text: "Le service, son code et ses contenus restent la propriété de l'éditeur. Vous bénéficiez d'un droit d'utilisation personnel et non exclusif pendant la durée de votre compte. Les fichiers que vous exportez vous appartiennent.",
      },

      { type: "h2", id: "suspension", text: "9. Suspension et résiliation" },
      {
        type: "p",
        text: "En cas de manquement grave aux présentes CGU (fraude, abus, atteinte à la sécurité), l'éditeur peut suspendre ou supprimer le compte concerné, après notification par e-mail sauf urgence. Vous pouvez supprimer votre compte à tout moment.",
      },

      { type: "h2", id: "modification", text: "10. Modification des CGU" },
      {
        type: "p",
        text: "L'éditeur peut modifier les présentes CGU. Les titulaires d'un compte sont informés par e-mail des modifications importantes avant leur entrée en vigueur ; la poursuite de l'utilisation vaut acceptation.",
      },

      { type: "h2", id: "droit", text: "11. Droit applicable et litiges" },
      {
        type: "p",
        text: `Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité (${CONTACT_EMAIL}). Le consommateur peut recourir gratuitement au médiateur de la consommation : ${MEDIATOR}. À défaut d'accord, le litige est porté devant les juridictions compétentes ; pour les professionnels, [À CONFIRMER : tribunal compétent du ressort du siège de l'éditeur].`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    description:
      "Offres, prix, paiement, renouvellement et résiliation des abonnements, droit de rétractation et garanties du service Relevéo.",
    updated: UPDATED,
    blocks: [
      DRAFT_CALLOUT,
      {
        type: "callout",
        tone: "warning",
        title: "Point à valider : vendeur et TVA",
        text: `Si le prestataire de paiement (${PAYMENT_PROVIDER}) agit en tant que revendeur officiel (« merchant of record »), c'est lui qui vend juridiquement l'abonnement, encaisse le paiement, émet la facture et collecte la TVA ; ses propres conditions s'appliquent alors en complément de celles-ci. [À CONFIRMER : rédaction des articles 1, 4 et 5 selon le prestataire retenu]`,
      },

      { type: "h2", id: "parties", text: "1. Parties et champ d'application" },
      {
        type: "p",
        text: `Les présentes conditions générales de vente (CGV) s'appliquent à tout achat d'une offre payante Relevéo, fournie par ${PUBLISHER}, ${STATUS}, SIREN ${SIREN}, ${ADDRESS} (« l'éditeur »), à un client consommateur ou professionnel. Elles complètent les [conditions générales d'utilisation](/cgu). Toute commande implique leur acceptation.`,
      },

      { type: "h2", id: "offres", text: "2. Offres" },
      {
        type: "table",
        head: ["Offre", "Prix TTC", "Pages exportées"],
        rows: [
          ["Gratuit", "0 €", "15 pages par mois"],
          ["Pack 150 pages", "15 € (paiement unique)", "150 pages, valables 12 mois à compter de l'achat"],
          ["Pro", "12 € par mois ou 120 € par an", "400 pages par mois"],
          ["Cabinet", "39 € par mois ou 390 € par an", "2 500 pages par mois"],
        ],
        caption: "Le détail des fonctionnalités de chaque offre figure sur la page [Tarifs](/tarifs).",
      },
      {
        type: "ul",
        items: [
          "Une **page** correspond à une page d'un fichier PDF exporté. Le ré-export du même fichier au cours du même mois n'est pas décompté à nouveau.",
          "Les pages mensuelles non utilisées **ne sont pas reportées** sur le mois suivant.",
          "Les crédits d'un pack sont consommés **après** l'épuisement de l'allocation mensuelle de votre offre.",
        ],
      },

      { type: "h2", id: "prix", text: "3. Prix" },
      {
        type: "p",
        text: `Les prix sont indiqués en euros, toutes taxes comprises. Mention fiscale de l'éditeur : ${VAT}. L'éditeur peut modifier ses prix ; un changement de prix d'abonnement est notifié par e-mail avant son application et ne s'applique qu'à la période suivante, le client pouvant résilier avant cette échéance.`,
      },

      { type: "h2", id: "paiement", text: "4. Commande et paiement" },
      {
        type: "p",
        text: `Le paiement s'effectue en ligne par l'intermédiaire de ${PAYMENT_PROVIDER}. Les données de carte bancaire sont saisies directement chez ce prestataire et ne transitent jamais par Relevéo. La facture ou le reçu est émis par le prestataire de paiement et accessible depuis votre compte. Les pages achetées sont créditées dès la confirmation du paiement.`,
      },

      { type: "h2", id: "abonnements", text: "5. Abonnements : renouvellement et résiliation" },
      {
        type: "ul",
        items: [
          "Les abonnements Pro et Cabinet, mensuels ou annuels, sont **reconduits automatiquement** à chaque échéance, pour une durée identique.",
          "Vous pouvez **résilier à tout moment** depuis le portail client accessible dans votre compte. La résiliation prend effet **à la fin de la période déjà payée** ; vous conservez l'accès à l'offre jusqu'à cette date.",
          "Aucun remboursement au prorata n'est effectué pour une période entamée, sauf lorsque la loi l'impose ou dans le cadre de la [politique de remboursement](/remboursement).",
          "La suppression du compte entraîne la résiliation de l'abonnement auprès du prestataire de paiement.",
          "En cas d'échec de paiement, l'accès à l'offre payante peut être suspendu jusqu'à régularisation.",
        ],
      },
      {
        type: "p",
        text: "[À CONFIRMER : pour les consommateurs, rappel de l'information préalable à la reconduction des abonnements annuels et facilité de résiliation en ligne (art. L215-1 et L215-1-1 du Code de la consommation)]",
      },

      { type: "h2", id: "retractation", text: "6. Droit de rétractation (consommateurs)" },
      {
        type: "callout",
        tone: "warning",
        title: "Clause à faire valider",
        text:
          "La rédaction de cet article et le mécanisme de recueil du consentement au moment du paiement (case à cocher) doivent être validés par un professionnel du droit.",
      },
      {
        type: "p",
        text: "Le consommateur dispose en principe d'un délai de **14 jours** à compter de la conclusion du contrat pour exercer son droit de rétractation, sans avoir à motiver sa décision (article L221-18 du Code de la consommation).",
      },
      {
        type: "p",
        text: "Toutefois, Relevéo fournit un contenu et un service numériques **immédiatement accessibles** après le paiement. Conformément à l'article L221-28, 13° du Code de la consommation, lors de la commande, le consommateur **demande expressément l'exécution immédiate** du contrat et **reconnaît qu'il perd son droit de rétractation** dès qu'il commence à utiliser les pages achetées (premier export décompté sur l'offre payante). Tant qu'aucune page payante n'a été utilisée, le droit de rétractation peut être exercé dans le délai de 14 jours. [À CONFIRMER : fondement exact (L221-28 1° et/ou 13°) et régime pour les abonnements]",
      },
      {
        type: "p",
        text: `Pour exercer ce droit, il suffit d'adresser une déclaration dénuée d'ambiguïté à ${CONTACT_EMAIL} ou via le [formulaire de contact](/contact). Le remboursement intervient dans les 14 jours, par le même moyen de paiement. [À COMPLÉTER : formulaire type de rétractation en annexe]`,
      },
      {
        type: "p",
        text: "Indépendamment du droit légal, l'éditeur applique une [politique de remboursement](/remboursement) commerciale plus souple.",
      },

      { type: "h2", id: "garanties", text: "7. Garanties légales" },
      {
        type: "p",
        text: "Le consommateur bénéficie de la garantie légale de conformité applicable aux contenus et services numériques (articles L224-25-1 et suivants du Code de la consommation). En cas de défaut de conformité, il peut obtenir la mise en conformité ou, à défaut, une réduction du prix ou la résolution du contrat. [À CONFIRMER : rédaction et renvois]",
      },
      {
        type: "p",
        text: "Relevéo étant une aide à la transcription dont les résultats doivent être vérifiés (voir les [CGU](/cgu)), une erreur de lecture signalée par le contrôle de cohérence ne constitue pas à elle seule un défaut de conformité ; l'éditeur s'efforce néanmoins de corriger les relevés mal lus qui lui sont signalés.",
      },

      { type: "h2", id: "professionnels", text: "8. Clients professionnels" },
      {
        type: "p",
        text: "Les dispositions relatives au droit de rétractation et à la médiation de la consommation ne s'appliquent pas aux clients professionnels. La responsabilité de l'éditeur envers eux est limitée dans les conditions prévues à l'article 7 des [CGU](/cgu).",
      },

      { type: "h2", id: "mediation", text: "9. Réclamations et médiation" },
      {
        type: "p",
        text: `Toute réclamation peut être adressée à ${CONTACT_EMAIL} ou via le [formulaire de contact](/contact). Si aucune solution n'est trouvée, le consommateur peut saisir gratuitement le médiateur de la consommation : ${MEDIATOR} [À COMPLÉTER : coordonnées et site internet du médiateur]. Il peut également utiliser la plateforme européenne de règlement en ligne des litiges. [À CONFIRMER : maintien de cette plateforme]`,
      },

      { type: "h2", id: "droit", text: "10. Droit applicable" },
      {
        type: "p",
        text: "Les présentes CGV sont soumises au droit français. Pour les consommateurs, les règles de compétence légales s'appliquent ; pour les professionnels, [À CONFIRMER : tribunal compétent du ressort du siège de l'éditeur].",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "remboursement",
    title: "Politique de remboursement",
    description:
      "Quand et comment obtenir un remboursement d'un pack ou d'un abonnement Relevéo, au-delà des obligations légales.",
    updated: UPDATED,
    blocks: [
      DRAFT_CALLOUT,
      {
        type: "callout",
        tone: "info",
        title: "Geste commercial",
        text:
          "Les règles ci-dessous sont un **choix commercial** de l'éditeur, plus favorable que le minimum légal. Elles peuvent être modifiées pour l'avenir ; les achats déjà effectués restent soumis à la politique en vigueur au moment de l'achat. [À CONFIRMER par l'éditeur : seuils et délais]",
      },

      { type: "h2", id: "pack", text: "Pack 150 pages" },
      {
        type: "p",
        text: "Si vous n'avez utilisé **aucune page** de votre pack, vous pouvez en demander le remboursement intégral dans les **14 jours** suivant l'achat.",
      },

      { type: "h2", id: "abonnement", text: "Abonnements Pro et Cabinet" },
      {
        type: "p",
        text: "Pour un premier abonnement, vous pouvez demander le remboursement du **premier paiement** dans les **14 jours** qui suivent, si vous avez exporté **moins de 20 pages** pendant cette période. L'abonnement est alors résilié immédiatement.",
      },
      {
        type: "p",
        text: "Au-delà, les paiements d'abonnement ne sont pas remboursés au prorata : vous pouvez résilier à tout moment depuis le portail client et conservez l'accès jusqu'à la fin de la période payée (voir les [CGV](/cgv)).",
      },

      { type: "h2", id: "demande", text: "Comment faire une demande" },
      {
        type: "ol",
        items: [
          `Écrivez à ${CONTACT_EMAIL} ou utilisez le [formulaire de contact](/contact), depuis l'adresse e-mail de votre compte.`,
          "Indiquez l'offre concernée et la date d'achat.",
          "Le remboursement est effectué par le prestataire de paiement, sur le moyen de paiement utilisé, en principe sous 14 jours. Le délai d'apparition sur votre compte dépend de votre banque.",
        ],
      },
      {
        type: "p",
        text: "Les pages créditées par la commande remboursée sont retirées de votre compte.",
      },

      { type: "h2", id: "droits-legaux", text: "Vos droits légaux" },
      {
        type: "p",
        text: "Cette politique s'ajoute, sans les remplacer, aux droits que vous tenez de la loi : droit de rétractation dans les conditions de l'article 6 des [CGV](/cgv) et garantie légale de conformité des contenus et services numériques. En cas de désaccord, vous pouvez recourir au médiateur de la consommation : " + MEDIATOR + ".",
      },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | undefined {
  return LEGAL_PAGES.find((p) => p.slug === slug);
}
