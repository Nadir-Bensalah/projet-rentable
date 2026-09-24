import type { Block, FaqItem } from "./types";

export interface FormatPage {
  slug: string;
  format: string;
  title: string;
  metaTitle: string;
  description: string;
  lead: string;
  blocks: Block[];
  faq: FaqItem[];
}

export const FORMAT_PAGES: FormatPage[] = [
  {
    slug: "excel",
    format: "Excel",
    title: "Convertir un relevé bancaire PDF en Excel",
    metaTitle: "Relevé bancaire PDF en Excel (.xlsx), vérifié au centime",
    description:
      "Transformez un relevé bancaire PDF en fichier Excel avec de vraies dates et de vrais montants, contrôlé au centime. Gratuit jusqu'à 15 pages par mois, sans envoi du fichier.",
    lead: "Un vrai classeur .xlsx : les dates sont des dates, les montants sont des nombres. Vous pouvez trier, filtrer et faire vos totaux immédiatement.",
    blocks: [
      { type: "h2", text: "Ce que contient le fichier Excel", id: "contenu" },
      {
        type: "table",
        head: ["Colonne", "Contenu", "Type dans Excel"],
        rows: [
          ["Date", "Date d'opération", "Date (format JJ/MM/AAAA)"],
          ["Date de valeur", "Si le relevé l'indique", "Date"],
          ["Libellé", "Libellé complet, lignes multiples réunies", "Texte"],
          ["Débit / Crédit", "Montant dans la bonne colonne", "Nombre (2 décimales)"],
          ["Montant", "Montant signé (négatif = sortie)", "Nombre"],
          ["Solde", "Solde courant, si le relevé l'imprime", "Nombre"],
        ],
      },
      {
        type: "p",
        text: "La première ligne est figée et un filtre automatique est déjà posé. En cas de plusieurs relevés fusionnés, une colonne « Relevé » indique le fichier d'origine de chaque opération.",
      },
      { type: "h2", text: "Pourquoi pas un simple copier-coller ?", id: "copier-coller" },
      {
        type: "p",
        text: "Copier un tableau depuis un PDF colle souvent tout dans une seule colonne, coupe les libellés sur deux lignes et transforme les montants « 1 234,56 » en texte qu'Excel ne sait pas additionner. Relevéo reconstruit le tableau à partir de la position du texte dans la page, puis vérifie que la somme des opérations correspond aux soldes imprimés.",
      },
      { type: "h2", text: "Étapes", id: "etapes" },
      {
        type: "ol",
        items: [
          "Téléchargez le relevé PDF depuis votre banque en ligne.",
          "Déposez-le dans [le convertisseur](/convertir) : il est lu par votre navigateur.",
          "Contrôlez le badge « Vérifié au centime » et corrigez une ligne si besoin.",
          "Choisissez « Excel (.xlsx) » et téléchargez.",
        ],
      },
      {
        type: "cta",
        title: "Essayez sur votre relevé",
        text: "Gratuit jusqu'à 15 pages par mois. Le fichier ne quitte jamais votre ordinateur.",
        href: "/convertir",
        label: "Convertir en Excel",
      },
    ],
    faq: [
      {
        q: "Le fichier s'ouvre-t-il avec LibreOffice ou Google Sheets ?",
        a: "Oui. Le format .xlsx est un standard ouvert, lu par Excel, LibreOffice Calc, Numbers et Google Sheets.",
      },
      {
        q: "Excel est-il inclus dans l'offre gratuite ?",
        a: "Oui, l'export Excel et le CSV (format français) sont disponibles gratuitement dans la limite de 15 pages par mois.",
      },
    ],
  },
  {
    slug: "csv",
    format: "CSV",
    title: "Convertir un relevé bancaire PDF en CSV",
    metaTitle: "Relevé bancaire PDF en CSV (point-virgule ou virgule)",
    description:
      "Exportez les opérations d'un relevé bancaire PDF en CSV français (point-virgule, virgule décimale) ou international (virgule, point décimal), contrôlées au centime.",
    lead: "Deux variantes pour que le fichier s'ouvre du premier coup : « CSV (Excel France) » et « CSV international ».",
    blocks: [
      { type: "h2", text: "Choisir la bonne variante", id: "variantes" },
      {
        type: "table",
        head: ["Variante", "Séparateur", "Décimales", "Dates", "Pour qui"],
        rows: [
          ["CSV (Excel France)", "Point-virgule", "Virgule", "JJ/MM/AAAA", "Excel en français, la plupart des logiciels français"],
          ["CSV international", "Virgule", "Point", "AAAA-MM-JJ", "Outils anglophones, scripts, bases de données"],
        ],
      },
      {
        type: "p",
        text: "Le CSV français est encodé en UTF-8 avec un indicateur (BOM) pour que les accents s'affichent correctement dans Excel. Pour comprendre les problèmes d'ouverture courants, lisez [notre guide sur les CSV dans Excel](/guides/csv-excel-point-virgule-virgule-decimale).",
      },
      { type: "h2", text: "Protection contre les formules", id: "securite" },
      {
        type: "p",
        text: "Un libellé bancaire qui commence par « = », « + » ou « @ » pourrait être interprété comme une formule par un tableur. Relevéo neutralise ces débuts de cellule à l'export.",
      },
      {
        type: "cta",
        title: "Obtenez votre CSV",
        text: "Le CSV français est inclus dans l'offre gratuite.",
        href: "/convertir",
        label: "Convertir en CSV",
      },
    ],
    faq: [
      {
        q: "Quelles colonnes contient le CSV ?",
        a: "Date, date de valeur, libellé, débit, crédit, montant signé et solde (si imprimé sur le relevé), plus le nom du relevé d'origine en cas de fusion.",
      },
      {
        q: "Mon logiciel demande un format précis. Que faire ?",
        a: "La plupart des imports CSV permettent d'associer chaque colonne. Si votre logiciel accepte l'OFX, c'est souvent plus simple : [voir l'export OFX](/formats/ofx).",
      },
    ],
  },
  {
    slug: "ofx",
    format: "OFX",
    title: "Convertir un relevé bancaire PDF en OFX",
    metaTitle: "Relevé bancaire PDF en OFX pour votre logiciel",
    description:
      "Créez un fichier OFX à partir d'un relevé bancaire PDF pour l'importer dans votre logiciel de comptabilité ou de budget. Identifiants stables, solde final inclus.",
    lead: "L'OFX est le format d'échange bancaire le plus répandu : pas de colonnes à associer, les opérations arrivent directement dans le bon compte.",
    blocks: [
      { type: "h2", text: "Un OFX pensé pour l'import", id: "import" },
      {
        type: "ul",
        items: [
          "Norme OFX 1.0.2 (SGML), la plus largement acceptée",
          "Identifiant unique (FITID) par opération, stable si vous ré-exportez le même relevé : les logiciels détectent ainsi les doublons",
          "Solde final du relevé inclus (LEDGERBAL)",
          "Caractères accentués convertis pour rester compatibles avec les imports les plus anciens",
        ],
      },
      { type: "h2", text: "Quand préférer l'OFX au CSV ?", id: "ofx-ou-csv" },
      {
        type: "p",
        text: "Si votre logiciel propose « importer un relevé bancaire (OFX) », choisissez l'OFX : il n'y a rien à paramétrer. Le CSV est préférable pour une analyse dans un tableur. Notre [guide OFX, QIF et CSV](/guides/importer-releve-ofx-logiciel-comptable) détaille les différences.",
      },
      {
        type: "cta",
        title: "Créer un OFX",
        text: "L'OFX est inclus dans le pack et les forfaits Pro et Cabinet.",
        href: "/convertir",
        label: "Convertir en OFX",
      },
    ],
    faq: [
      {
        q: "L'OFX contient-il mon numéro de compte ?",
        a: "Non. Le fichier contient un identifiant de compte générique (« RELEVE ») que votre logiciel associe au compte de votre choix lors de l'import.",
      },
      {
        q: "Et si mon logiciel refuse le fichier ?",
        a: "Certains logiciels n'acceptent que l'OFX 2 (XML) ou le QIF. Essayez le [QIF](/formats/qif) ou le CSV, et signalez-nous le logiciel concerné via la page [Contact](/contact).",
      },
    ],
  },
  {
    slug: "qif",
    format: "QIF",
    title: "Convertir un relevé bancaire PDF en QIF",
    metaTitle: "Relevé bancaire PDF en QIF (Quicken et compatibles)",
    description:
      "Exportez les opérations d'un relevé bancaire PDF au format QIF, accepté par Quicken et de nombreux logiciels de budget et de gestion. Contrôle du solde inclus.",
    lead: "Le QIF est un format ancien mais encore accepté par beaucoup de logiciels de budget et de gestion.",
    blocks: [
      { type: "h2", text: "Contenu du fichier", id: "contenu" },
      {
        type: "p",
        text: "Chaque opération est écrite avec sa date (JJ/MM/AAAA, ou MM/JJ/AAAA pour un relevé américain), son montant signé et son libellé, dans une section « !Type:Bank ».",
      },
      { type: "h2", text: "Limites du QIF", id: "limites" },
      {
        type: "p",
        text: "Le QIF ne contient pas d'identifiant unique par opération : si vous importez deux fois le même fichier, certains logiciels créeront des doublons. Préférez l'[OFX](/formats/ofx) quand il est accepté.",
      },
      { type: "cta", title: "Créer un QIF", text: "Inclus dans le pack et les forfaits.", href: "/convertir", label: "Convertir en QIF" },
    ],
    faq: [
      {
        q: "Le format de date est-il configurable ?",
        a: "Relevéo choisit l'ordre jour/mois d'après le relevé lui-même : JJ/MM pour un relevé européen, MM/JJ pour un relevé américain.",
      },
    ],
  },
  {
    slug: "ecritures-comptables",
    format: "Écritures",
    title: "Relevé bancaire PDF en écritures comptables (journal de banque)",
    metaTitle: "Relevé PDF en journal de banque 512/471 (colonnes FEC)",
    description:
      "Générez un journal de banque en partie double (compte 512 / compte d'attente 471) aux 18 colonnes du FEC à partir d'un relevé bancaire PDF, contrôlé au centime.",
    lead: "Chaque opération devient une écriture équilibrée : le compte de banque d'un côté, le compte d'attente de l'autre, prête à être importée puis lettrée.",
    blocks: [
      { type: "h2", text: "Structure des écritures", id: "structure" },
      {
        type: "p",
        text: "Pour un encaissement, le compte de banque (512000 par défaut) est débité et le compte d'attente (471000 par défaut) est crédité ; l'inverse pour un décaissement. Vous choisissez le code journal et les deux comptes au moment de l'export.",
      },
      {
        type: "p",
        text: "Le fichier utilise les 18 colonnes définies pour le fichier des écritures comptables (article A47 A-1 du livre des procédures fiscales), séparées par des tabulations, avec des montants à virgule décimale.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "À savoir",
        text: "Ce fichier est un journal de banque au format de colonnes FEC, destiné à l'import. Ce n'est pas le FEC réglementaire de l'entreprise, qui est produit par votre logiciel comptable à partir de l'ensemble des écritures.",
      },
      { type: "h2", text: "Pour qui ?", id: "pour-qui" },
      {
        type: "p",
        text: "Les cabinets et les indépendants qui tiennent leur comptabilité dans un logiciel acceptant l'import d'écritures au format FEC. Voir aussi [notre page dédiée aux cabinets](/cabinets-comptables).",
      },
      {
        type: "cta",
        title: "Générer un journal de banque",
        text: "Inclus dans le pack et les forfaits Pro et Cabinet.",
        href: "/convertir",
        label: "Convertir en écritures",
      },
    ],
    faq: [
      {
        q: "Les numéros d'écriture sont-ils uniques ?",
        a: "Oui dans le fichier exporté : ils sont numérotés à partir du code journal (BQ00001, BQ00002…). Votre logiciel peut les renuméroter à l'import.",
      },
      {
        q: "Puis-je utiliser un autre compte que 512000 ?",
        a: "Oui : le code journal, le compte de banque et le compte d'attente se règlent dans le panneau d'export.",
      },
    ],
  },
];
