import type { Guide } from "./types";

export const GUIDES: Guide[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Pilier : PDF → Excel
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "convertir-releve-bancaire-pdf-excel",
    title: "Convertir un relevé bancaire PDF en Excel : méthodes, pièges et vérification",
    metaTitle: "Convertir un relevé bancaire PDF en Excel",
    description:
      "Copier-coller, export CSV, convertisseur en ligne, outil local ou IA : comparez les méthodes pour passer un relevé PDF sur Excel et vérifiez-le par le solde.",
    updated: "2026-09-24",
    readingMinutes: 7,
    category: "Conversion",
    intro:
      "Un relevé bancaire en PDF se lit bien mais se calcule mal. Voici les principales façons de le transformer en tableau Excel exploitable, les erreurs qui reviennent le plus souvent et la seule méthode fiable pour savoir si rien ne manque.",
    blocks: [
      { type: "h2", text: "Pourquoi un PDF ne se colle pas proprement dans Excel", id: "pourquoi-pdf-difficile" },
      {
        type: "p",
        text: "Un PDF n’est pas un tableau : c’est une page sur laquelle des morceaux de texte sont positionnés à des coordonnées précises. Les colonnes « Date », « Libellé », « Débit » et « Crédit » que vous voyez n’existent que visuellement. Pour reconstituer un tableau, il faut regrouper les mots en lignes, deviner à quelle colonne appartient chaque montant et recoller les libellés qui s’étalent sur plusieurs lignes.",
      },
      {
        type: "p",
        text: "C’est pour cela qu’un simple copier-coller donne souvent un bloc de texte sur une seule colonne, ou des montants placés au mauvais endroit.",
      },
      { type: "h2", text: "Les cinq méthodes possibles", id: "cinq-methodes" },
      {
        type: "table",
        head: ["Méthode", "Avantages", "Limites"],
        rows: [
          ["Copier-coller depuis le lecteur PDF", "Gratuit, immédiat", "Colonnes mélangées, retouches manuelles longues, aucun contrôle"],
          [
            "Export CSV ou OFX depuis l’espace client",
            "Données natives de la banque",
            "Historique souvent limité, format variable, indisponible pour un compte clôturé ou un relevé reçu d’un tiers",
          ],
          [
            "Convertisseur en ligne avec envoi du fichier",
            "Rapide, sans installation",
            "Le relevé (IBAN, nom, opérations) est envoyé sur un serveur tiers",
          ],
          [
            "Outil local dans le navigateur (comme Relevéo)",
            "Le PDF reste sur l’appareil, contrôle du solde intégré",
            "Ne lit pas les PDF scannés (images)",
          ],
          [
            "IA généraliste (chatbot)",
            "Souple, comprend des mises en page variées",
            "Peut omettre ou inventer des lignes, résultat à vérifier intégralement, données envoyées au fournisseur",
          ],
        ],
        caption: "Comparatif des méthodes de conversion d’un relevé PDF vers Excel",
      },
      {
        type: "p",
        text: "Si votre banque propose un export CSV couvrant la période voulue, commencez par là : ce sont les données d’origine. Le PDF devient indispensable dès qu’il s’agit d’anciens relevés, d’un compte fermé ou de documents transmis par quelqu’un d’autre (client, associé, succession).",
      },
      { type: "h2", text: "Les pièges les plus fréquents", id: "pieges-frequents" },
      { type: "h3", text: "Colonnes décalées" },
      {
        type: "p",
        text: "Un montant mal aligné bascule de la colonne Débit à la colonne Crédit. L’erreur est invisible à l’œil mais fausse le total du double du montant concerné.",
      },
      { type: "h3", text: "Montants stockés en texte" },
      {
        type: "p",
        text: "« 1 234,56 » avec une espace insécable, ou « 1.234,56 », est souvent lu par Excel comme du texte : la cellule s’aligne à gauche et la fonction SOMME l’ignore sans prévenir.",
      },
      { type: "h3", text: "Dates ambiguës ou incomplètes" },
      {
        type: "p",
        text: "Beaucoup de relevés n’impriment que le jour et le mois (« 03/02 »). Il faut déduire l’année de la période du relevé, en faisant attention aux relevés à cheval sur deux années. Une date mal interprétée peut aussi être inversée jour/mois selon les réglages régionaux.",
      },
      { type: "h3", text: "Libellés sur plusieurs lignes" },
      {
        type: "p",
        text: "Un virement SEPA affiche souvent le nom du donneur d’ordre, puis une référence, puis un motif sur deux ou trois lignes. Mal traitées, ces lignes deviennent de fausses opérations sans montant, ou se rattachent à l’opération suivante.",
      },
      { type: "h3", text: "Lignes parasites" },
      {
        type: "p",
        text: "Reports de solde, totaux de page, mentions légales, en-têtes répétés : ils ressemblent à des opérations et doivent être écartés.",
      },
      { type: "h2", text: "Vérifier que la conversion est complète : le contrôle par le solde", id: "controle-solde" },
      {
        type: "p",
        text: "Le seul contrôle vraiment fiable est arithmétique. Le relevé imprime un solde de début et un solde de fin. Si toutes les opérations ont été extraites correctement, on doit avoir, au centime près :",
      },
      {
        type: "callout",
        tone: "info",
        title: "La formule de contrôle",
        text: "**Solde initial + total des crédits − total des débits = solde final imprimé par la banque.**",
      },
      {
        type: "p",
        text: "Exemple : solde initial 1 250,00 €, crédits 3 400,00 €, débits 2 980,45 €. Le solde calculé est 1 669,55 €. Si le relevé indique 1 669,55 €, la conversion est cohérente. S’il indique 1 629,55 €, il manque 40 € de débits, ou un crédit de 20 € a été lu comme un débit.",
      },
      {
        type: "p",
        text: "Quand le relevé comporte une colonne de solde courant, on peut aller plus loin et vérifier chaque ligne : le solde d’une ligne doit égaler le solde précédent plus ou moins le montant de l’opération. La première ligne qui ne tombe pas juste désigne l’erreur.",
      },
      { type: "h2", text: "Comment fonctionne la conversion avec Relevéo", id: "conversion-releveo" },
      {
        type: "ol",
        items: [
          "Vous déposez un ou plusieurs relevés PDF. L’analyse est faite dans votre navigateur : le fichier ne quitte pas votre appareil.",
          "Les opérations sont reconstituées (date, libellé, débit, crédit), y compris les libellés sur plusieurs lignes.",
          "Le rapprochement avec les soldes s’affiche : **Vérifié**, **Écart de X €** avec les lignes à contrôler, ou **Non vérifiable** si le relevé n’imprime pas de solde (vous pouvez alors saisir les soldes vous-même).",
          "Vous corrigez si besoin : modifier une cellule, exclure une ligne, inverser un signe.",
          "Vous exportez en Excel (.xlsx), CSV, OFX, QIF, JSON ou en journal de banque au format des colonnes du FEC.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "PDF scannés",
        text: "Si votre relevé est une photo ou un scan, il ne contient pas de texte exploitable et Relevéo l’indique clairement. Voir [notre guide sur les relevés scannés](/guides/releve-bancaire-scanne-pdf-image).",
      },
      { type: "h2", text: "Après l’export : quelques bonnes pratiques", id: "bonnes-pratiques" },
      {
        type: "ul",
        items: [
          "Gardez le PDF d’origine à côté du fichier converti : c’est lui qui fait foi.",
          "Préférez le .xlsx au CSV si vous travaillez dans Excel : les montants et dates arrivent déjà typés. Pour le CSV, lisez [notre guide sur le point-virgule et la virgule décimale](/guides/csv-excel-point-virgule-virgule-decimale).",
          "Pour plusieurs mois, fusionnez les relevés en un seul fichier et contrôlez que le solde final d’un mois égale le solde initial du suivant.",
          "Pour la comptabilité, utilisez la conversion comme base du [rapprochement bancaire](/guides/rapprochement-bancaire).",
        ],
      },
      {
        type: "cta",
        title: "Convertissez votre relevé sans l’envoyer sur un serveur",
        text: "Déposez un PDF, vérifiez le solde au centime et téléchargez votre fichier Excel. 15 pages offertes chaque mois.",
        href: "/convertir",
        label: "Convertir un relevé",
      },
    ],
    faq: [
      {
        q: "Peut-on convertir un relevé bancaire PDF en Excel gratuitement ?",
        a: "Oui. Le copier-coller est gratuit mais demande beaucoup de retouches. Relevéo offre 15 pages par mois en Excel et CSV (format français), avec le contrôle du solde inclus.",
      },
      {
        q: "Comment savoir si aucune opération n’a été oubliée ?",
        a: "Vérifiez que solde initial + crédits − débits est égal au solde final imprimé sur le relevé, au centime près. Un écart signale une ligne manquante, en double ou mal classée.",
      },
      {
        q: "Mon relevé est-il envoyé sur Internet ?",
        a: "Avec Relevéo, non : le PDF est lu dans votre navigateur. Le serveur reçoit uniquement le nombre de pages et une empreinte SHA-256 du fichier pour la facturation.",
      },
      {
        q: "Fonctionne-t-il avec toutes les banques ?",
        a: "L’analyse est générique : elle ne dépend pas d’un modèle propre à chaque banque. Elle fonctionne avec la plupart des relevés au format texte ; le contrôle du solde vous dit si le résultat est complet.",
      },
    ],
    related: [
      "csv-excel-point-virgule-virgule-decimale",
      "releve-bancaire-scanne-pdf-image",
      "rapprochement-bancaire",
      "recuperer-anciens-releves-bancaires",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Rapprochement bancaire
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "rapprochement-bancaire",
    title: "Le rapprochement bancaire expliqué pas à pas, avec un exemple chiffré",
    metaTitle: "Rapprochement bancaire : méthode et exemple",
    description:
      "Qu’est-ce que le rapprochement bancaire, comment le faire pas à pas, quels écarts rencontrer et comment un relevé converti en tableau accélère le pointage.",
    updated: "2026-09-24",
    readingMinutes: 6,
    category: "Comptabilité",
    intro:
      "Le rapprochement bancaire consiste à expliquer l’écart entre le solde de votre compte en banque et celui de votre comptabilité. C’est le contrôle de base de toute tenue de comptes, et il devient simple dès que le relevé est sous forme de tableau.",
    blocks: [
      { type: "h2", text: "Définition", id: "definition" },
      {
        type: "p",
        text: "À une date donnée, le solde du compte 512 (Banque) de votre comptabilité et le solde du relevé bancaire sont rarement identiques. Ce n’est pas forcément une erreur : certaines opérations sont connues de vous mais pas encore de la banque (un chèque émis non encaissé), d’autres sont connues de la banque mais pas encore de vous (des frais prélevés). Le rapprochement bancaire est le document qui justifie cet écart, ligne par ligne.",
      },
      {
        type: "p",
        text: "Un rapprochement réussi aboutit à un **solde rapproché** identique des deux côtés. S’il reste un écart inexpliqué, il y a une erreur à chercher.",
      },
      { type: "h2", text: "Les sources d’écart habituelles", id: "sources-ecart" },
      {
        type: "table",
        head: ["Situation", "Connue de", "Traitement"],
        rows: [
          [
            "Chèque émis, pas encore encaissé par le bénéficiaire",
            "Comptabilité seulement",
            "À mentionner dans l’état de rapprochement, pas d’écriture",
          ],
          ["Remise de chèques en cours", "Comptabilité seulement", "À mentionner, apparaîtra sur le relevé suivant"],
          ["Prélèvement automatique non saisi", "Banque seulement", "À comptabiliser"],
          ["Frais et commissions bancaires", "Banque seulement", "À comptabiliser (souvent en 627)"],
          ["Intérêts, agios", "Banque seulement", "À comptabiliser"],
          ["Virement reçu non enregistré", "Banque seulement", "À comptabiliser, éventuellement en attente d’affectation"],
          ["Erreur de saisie (montant inversé, 45,60 saisi 46,50)", "Comptabilité erronée", "À corriger"],
        ],
        caption: "Les écarts classiques entre relevé et comptabilité",
      },
      {
        type: "callout",
        tone: "info",
        title: "Astuce pour les erreurs de saisie",
        text: "Si l’écart est divisible par 9, pensez à une inversion de chiffres (45,60 saisi 46,50 donne un écart de 0,90). S’il est égal au double d’un montant, pensez à une opération passée dans le mauvais sens.",
      },
      { type: "h2", text: "La méthode, étape par étape", id: "methode" },
      {
        type: "ol",
        items: [
          "Partez du dernier rapprochement validé : les éléments en suspens à cette date (chèques non encaissés, par exemple) doivent être repris.",
          "Réunissez le relevé de la période et l’extrait du compte 512 sur la même période.",
          "Pointez chaque opération du relevé avec l’écriture correspondante en comptabilité (même montant, date proche).",
          "Listez les opérations du relevé sans écriture : elles sont à comptabiliser.",
          "Listez les écritures sans opération sur le relevé : ce sont des décalages (chèques, remises) ou des erreurs.",
          "Établissez l’état de rapprochement : partez de chaque solde et appliquez les éléments non pointés.",
          "Passez les écritures manquantes, corrigez les erreurs, et conservez l’état avec les éléments en suspens.",
        ],
      },
      { type: "h2", text: "Un exemple chiffré", id: "exemple-chiffre" },
      {
        type: "p",
        text: "Au 31 mars, le relevé indique un solde créditeur de **4 820,00 €**. Le compte 512 de la comptabilité affiche **5 131,50 €**. Après pointage, on trouve :",
      },
      {
        type: "ul",
        items: [
          "un chèque de 350,00 € émis le 29 mars, pas encore encaissé ;",
          "des frais de tenue de compte de 18,50 € prélevés par la banque, non saisis ;",
          "un virement client de 60,00 € reçu le 31 mars, non saisi ;",
          "un prélèvement d’assurance de 102,00 € saisi 120,00 € (erreur de 18,00 €).",
        ],
      },
      {
        type: "table",
        head: ["Côté banque", "Montant", "Côté comptabilité", "Montant"],
        rows: [
          ["Solde du relevé", "4 820,00", "Solde du compte 512", "5 131,50"],
          ["− Chèque non encaissé", "− 350,00", "− Frais bancaires", "− 18,50"],
          ["", "", "+ Virement client", "+ 60,00"],
          ["", "", "+ Correction prélèvement (120 → 102)", "+ 18,00"],
          ["**Solde rapproché**", "**4 470,00**", "**Solde rapproché**", "**5 191,00**"],
        ],
        caption: "Premier état : les soldes rapprochés ne concordent pas",
      },
      {
        type: "p",
        text: "Il reste 721,00 € d’écart : le pointage n’est pas terminé. En reprenant les écritures, on découvre une remise de chèques de 721,00 € enregistrée en comptabilité le 30 mars et créditée par la banque seulement le 2 avril. Côté banque, on ajoute + 721,00 € : 4 470,00 + 721,00 = **5 191,00 €**. Les deux soldes concordent, le rapprochement est justifié.",
      },
      { type: "h2", text: "Ce qu’apporte un relevé converti en tableau", id: "releve-en-tableau" },
      {
        type: "p",
        text: "Le pointage consiste à comparer deux listes. C’est fastidieux sur papier ou entre deux fenêtres PDF, beaucoup plus rapide quand le relevé est dans un tableur : tri par montant, recherche d’un montant précis, filtre sur les frais, formule RECHERCHEX pour retrouver l’écriture correspondante.",
      },
      {
        type: "p",
        text: "Encore faut-il que le tableau soit complet. Une conversion qui oublie une ligne crée un faux écart, et vous cherchez une erreur qui n’existe pas en comptabilité. C’est pourquoi Relevéo vérifie chaque relevé : solde initial + crédits − débits doit égaler le solde final imprimé, au centime. Tant que le statut n’est pas **Vérifié**, ne commencez pas le pointage.",
      },
      { type: "h2", text: "Quelle fréquence ?", id: "frequence" },
      {
        type: "p",
        text: "Au minimum à chaque clôture, mais un rapprochement mensuel est bien plus confortable : il y a moins de lignes, les souvenirs sont frais et les anomalies (prélèvement inconnu, double débit) sont détectées pendant qu’il est encore temps de réclamer auprès de la banque ou du fournisseur.",
      },
      {
        type: "cta",
        title: "Préparez votre rapprochement en quelques minutes",
        text: "Convertissez le relevé en Excel, avec contrôle du solde au centime, sans envoyer le PDF sur un serveur.",
        href: "/convertir",
        label: "Convertir un relevé",
      },
    ],
    faq: [
      {
        q: "Le rapprochement bancaire est-il obligatoire ?",
        a: "Ce n’est pas un document dont la forme est imposée, mais c’est le moyen usuel de justifier le solde du compte banque. En pratique, tout comptable le réalise au moins à la clôture de l’exercice.",
      },
      {
        q: "Que faire d’une opération bancaire qu’on ne sait pas affecter ?",
        a: "On la comptabilise sur un compte d’attente (471 par exemple) pour que la banque soit juste, puis on la reclasse dès que la pièce justificative est obtenue. Le compte d’attente doit être soldé à la clôture.",
      },
      {
        q: "Pourquoi mon écart est-il égal au double d’un montant ?",
        a: "C’est typiquement une opération saisie dans le mauvais sens : un débit enregistré comme un crédit, ou l’inverse.",
      },
      {
        q: "Relevéo fait-il le rapprochement à ma place ?",
        a: "Non. Relevéo transcrit le relevé en tableau et vérifie que la transcription est complète. Le pointage avec votre comptabilité reste à faire dans votre tableur ou votre logiciel.",
      },
    ],
    related: ["convertir-releve-bancaire-pdf-excel", "expert-comptable-releves-pdf-clients", "importer-releve-ofx-logiciel-comptable"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. OFX / QIF / CSV
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "importer-releve-ofx-logiciel-comptable",
    title: "OFX, QIF ou CSV : quel format pour importer un relevé dans un logiciel ?",
    metaTitle: "OFX, QIF ou CSV : importer un relevé bancaire",
    description:
      "Différences entre OFX, QIF et CSV, choix du bon format, fonctionnement d’un import (colonnes, doublons, FITID) et limites à connaître avant d’importer.",
    updated: "2026-09-24",
    readingMinutes: 6,
    category: "Comptabilité",
    intro:
      "La plupart des logiciels de comptabilité et de gestion de budget savent importer des opérations bancaires, mais pas toujours dans le même format. Voici comment choisir entre OFX, QIF et CSV, et ce qui se passe réellement lors d’un import.",
    blocks: [
      { type: "h2", text: "Trois formats, trois logiques", id: "trois-formats" },
      {
        type: "p",
        text: "**L’OFX** (Open Financial Exchange) est un format structuré conçu pour les échanges bancaires. La version 1.0.2, basée sur une syntaxe proche du SGML, reste la plus répandue à l’import. Chaque opération y porte un type, une date, un montant signé, un libellé et surtout un identifiant unique, le **FITID**.",
      },
      {
        type: "p",
        text: "**Le QIF** (Quicken Interchange Format) est un format texte plus ancien, ligne par ligne : une lettre en début de ligne indique le champ (D pour la date, T pour le montant, P pour le bénéficiaire…). Il est simple, mais ne contient pas d’identifiant unique par opération.",
      },
      {
        type: "p",
        text: "**Le CSV** est un simple tableau texte. Il n’a pas de structure imposée : l’ordre des colonnes, le séparateur, le format des dates et des montants varient d’un fichier à l’autre. C’est le plus universel et le plus fragile à la fois.",
      },
      { type: "h2", text: "Comparatif", id: "comparatif" },
      {
        type: "table",
        head: ["Critère", "OFX 1.0.2", "QIF", "CSV"],
        rows: [
          ["Structure imposée", "Oui", "Oui (simple)", "Non"],
          ["Identifiant unique par opération", "Oui (FITID)", "Non", "Non (sauf colonne dédiée)"],
          ["Soldes inclus", "Oui (solde de fin)", "Non", "Selon le fichier"],
          ["Paramétrage à l’import", "Généralement aucun", "Format de date parfois", "Correspondance des colonnes"],
          ["Lisible dans un tableur", "Non", "Non", "Oui"],
          [
            "Usage typique",
            "Logiciels comptables et de gestion",
            "Logiciels de budget personnels, anciens outils",
            "Tableurs, outils sur mesure, imports paramétrables",
          ],
        ],
        caption: "OFX, QIF et CSV comparés",
      },
      { type: "h2", text: "Lequel choisir ?", id: "lequel-choisir" },
      {
        type: "ul",
        items: [
          "**Votre logiciel accepte l’OFX** : prenez-le en priorité. Pas de correspondance de colonnes à régler, et la gestion des doublons s’appuie sur le FITID.",
          "**Votre logiciel ne propose que le QIF** : c’est souvent le cas des outils de budget plus anciens. Vérifiez le format de date attendu.",
          "**Votre logiciel propose un import CSV paramétrable** : c’est une bonne solution si vous maîtrisez le paramétrage (séparateur, colonnes, format des montants).",
          "**Vous voulez retravailler les données avant import** : passez par Excel ou CSV, puis importez.",
        ],
      },
      {
        type: "p",
        text: "En cas de doute, consultez l’aide de votre logiciel : la plupart des logiciels de comptabilité acceptent l’OFX ou le CSV, mais les options exactes diffèrent d’un éditeur et d’une version à l’autre.",
      },
      { type: "h2", text: "Comment se passe un import", id: "deroulement-import" },
      { type: "h3", text: "La correspondance des colonnes (CSV)" },
      {
        type: "p",
        text: "Pour un CSV, le logiciel demande quelle colonne contient la date, le libellé, le montant, ou le débit et le crédit séparés. Il faut aussi préciser le séparateur de champs (point-virgule ou virgule), le séparateur décimal et le format de date (JJ/MM/AAAA ou AAAA-MM-JJ). Une erreur à cette étape donne des montants multipliés par 100 ou des dates inversées. Voir [notre guide sur le CSV dans Excel](/guides/csv-excel-point-virgule-virgule-decimale).",
      },
      { type: "h3", text: "La détection des doublons" },
      {
        type: "p",
        text: "Si vous importez deux fois la même période, ou deux fichiers qui se chevauchent, le logiciel doit reconnaître les opérations déjà présentes. Avec l’OFX, il compare les FITID : une opération déjà importée avec le même identifiant est ignorée. Avec le QIF ou le CSV, il ne peut comparer que date, montant et libellé, ce qui laisse passer des doublons ou, à l’inverse, écarte deux opérations réellement identiques (deux tickets de métro le même jour, par exemple).",
      },
      {
        type: "callout",
        tone: "info",
        title: "FITID et fichiers convertis",
        text: "Un fichier OFX produit à partir d’un PDF n’a pas les identifiants internes de la banque. Relevéo génère des FITID déterministes, calculés à partir de la date, du montant, du libellé et de la position de chaque opération : exporter à nouveau le même relevé, sans modification, redonne les mêmes identifiants. Si vous excluez ou ajoutez des lignes, ou fusionnez d’autres relevés, ils peuvent changer. Et ils ne correspondent pas à ceux d’un OFX téléchargé directement depuis la banque : ne mélangez pas les deux sources sur la même période.",
      },
      { type: "h3", text: "Le compte cible" },
      {
        type: "p",
        text: "L’OFX contient un identifiant de compte. Certains logiciels l’utilisent pour choisir automatiquement le compte de destination, d’autres le demandent à chaque import. Vérifiez-le avant de valider, surtout si vous gérez plusieurs comptes.",
      },
      { type: "h2", text: "Limites à connaître", id: "limites" },
      {
        type: "ul",
        items: [
          "L’OFX 1.0.2 ne transporte pas de catégorie comptable : l’affectation des comptes reste à faire dans le logiciel.",
          "Les libellés peuvent être tronqués par certains logiciels à l’import.",
          "Le QIF ne contient pas de solde : impossible pour le logiciel de vérifier la cohérence de l’import.",
          "Un import ne remplace pas le [rapprochement bancaire](/guides/rapprochement-bancaire) : il faut toujours comparer le solde obtenu avec le relevé.",
        ],
      },
      { type: "h2", text: "Avant d’importer un relevé converti", id: "avant-import" },
      {
        type: "ol",
        items: [
          "Vérifiez que le statut du relevé est **Vérifié** : solde initial + crédits − débits = solde final.",
          "Excluez les lignes que vous ne voulez pas importer (report de solde mal interprété, par exemple).",
          "Si vous fusionnez plusieurs relevés qui se chevauchent, laissez la suppression des doublons agir avant d’exporter.",
          "Faites un premier import test sur un compte ou un dossier d’essai si votre logiciel le permet.",
        ],
      },
      {
        type: "p",
        text: "Pour une saisie directe en écritures comptables plutôt qu’un import de relevé, Relevéo propose aussi un journal de banque au format des 18 colonnes du FEC : voir [le guide pour les cabinets](/guides/expert-comptable-releves-pdf-clients).",
      },
      {
        type: "cta",
        title: "Obtenez un OFX, un QIF ou un CSV à partir de vos PDF",
        text: "La conversion se fait dans votre navigateur, avec contrôle du solde avant export.",
        href: "/convertir",
        label: "Convertir un relevé",
      },
    ],
    faq: [
      {
        q: "Quelle version d’OFX Relevéo produit-il ?",
        a: "L’OFX 1.0.2, la version la plus couramment acceptée à l’import par les logiciels de gestion et de comptabilité.",
      },
      {
        q: "Pourquoi mon logiciel importe-t-il des doublons ?",
        a: "Soit le fichier n’a pas d’identifiant unique (QIF, CSV), soit vous avez mélangé des fichiers de sources différentes dont les FITID ne correspondent pas. Importez une période donnée depuis une seule source.",
      },
      {
        q: "Le format OFX est-il disponible dans l’offre gratuite ?",
        a: "Non. L’offre gratuite comprend Excel et CSV (format français). L’OFX, le QIF, le JSON et le journal de banque sont inclus dans le pack 150 pages et les abonnements.",
      },
      {
        q: "Puis-je ouvrir un fichier OFX dans Excel ?",
        a: "Ce n’est pas prévu pour : l’OFX est un format d’échange entre logiciels. Pour travailler dans un tableur, exportez plutôt en .xlsx.",
      },
    ],
    related: ["csv-excel-point-virgule-virgule-decimale", "rapprochement-bancaire", "expert-comptable-releves-pdf-clients"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Anciens relevés
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "recuperer-anciens-releves-bancaires",
    title: "Récupérer d’anciens relevés bancaires et les rendre exploitables",
    metaTitle: "Récupérer d’anciens relevés bancaires",
    description:
      "Où trouver vos anciens relevés, que faire pour un compte clôturé, comment demander des copies et transformer des PDF archivés en tableau exploitable.",
    updated: "2026-09-24",
    readingMinutes: 6,
    category: "Pratique",
    intro:
      "Contrôle fiscal, succession, litige, reprise d’une comptabilité en retard : il arrive qu’on ait besoin de relevés de plusieurs années. Voici où les chercher, comment les demander et comment en tirer des données utilisables.",
    blocks: [
      { type: "h2", text: "Pourquoi l’export CSV de la banque ne suffit pas toujours", id: "limites-export" },
      {
        type: "p",
        text: "La plupart des banques proposent, dans l’espace client, un téléchargement des opérations en CSV, Excel ou OFX. Cet export est pratique, mais il couvre généralement une période récente seulement, et la profondeur d’historique varie selon les établissements. Vérifiez dans votre espace client ce qui est proposé pour votre compte.",
      },
      {
        type: "p",
        text: "Les relevés mensuels en PDF, eux, restent souvent consultables plus longtemps dans l’espace « documents » ou « e-relevés ». Pour aller au-delà, ou pour un compte fermé, il faut s’adresser à la banque.",
      },
      { type: "h2", text: "Où chercher en premier", id: "ou-chercher" },
      {
        type: "ol",
        items: [
          "**L’espace client en ligne**, rubrique documents ou relevés : téléchargez tout ce qui est disponible, mois par mois.",
          "**Vos propres archives** : boîte mail (certaines banques envoient une notification, rarement le relevé lui-même), dossier de téléchargements, sauvegardes, cloud personnel.",
          "**Votre expert-comptable**, si vous en avez eu un : il conserve souvent les relevés transmis pour les exercices passés.",
          "**Les relevés papier** : ils peuvent être scannés, mais la conversion demandera alors un outil de reconnaissance de caractères (voir plus bas).",
        ],
      },
      { type: "h2", text: "Demander des copies à la banque", id: "demander-copies" },
      {
        type: "p",
        text: "Les banques ont l’obligation de conserver les documents relatifs aux opérations de leurs clients pendant plusieurs années : au moins cinq ans, y compris après la clôture du compte, au titre notamment de la lutte contre le blanchiment. Dans la limite de ce qu’elle a conservé, vous pouvez demander à votre banque une copie d’anciens relevés.",
      },
      {
        type: "ul",
        items: [
          "Faites la demande par écrit (messagerie sécurisée, courrier ou agence) en précisant le compte et la période exacte.",
          "Cette prestation est souvent facturée : consultez la brochure tarifaire de votre banque, rubrique « recherche de documents » ou « duplicata ».",
          "Demandez si possible des copies au format PDF numérique plutôt que papier : elles seront directement convertibles.",
          "Prévoyez un délai, en particulier pour des périodes anciennes.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Compte clôturé",
        text: "Un compte fermé disparaît en général de l’espace client, mais la banque reste tenue de conserver les documents pendant la durée légale. La demande se fait alors auprès du service client ou de l’agence qui gérait le compte. Pour une succession, les héritiers ou le notaire doivent justifier de leur qualité.",
      },
      { type: "h2", text: "Quels relevés garder, et combien de temps ?", id: "duree-conservation" },
      {
        type: "p",
        text: "Pour un particulier, il est d’usage de conserver ses relevés au moins cinq ans. Pour une entreprise, les documents comptables et pièces justificatives se conservent dix ans (article L123-22 du Code de commerce), et l’administration fiscale peut exercer son droit de contrôle sur plusieurs années. Les délais exacts dépendent de votre situation : en cas de doute, rapprochez-vous de votre comptable.",
      },
      { type: "h2", text: "Des PDF archivés aux données exploitables", id: "pdf-vers-donnees" },
      {
        type: "p",
        text: "Une fois les relevés rassemblés, il reste à en faire un tableau unique. C’est l’usage typique d’une conversion par lot :",
      },
      {
        type: "ol",
        items: [
          "Classez les PDF par compte et par ordre chronologique. Repérez les mois manquants.",
          "Convertissez-les en une fois. Chaque relevé est contrôlé : solde initial + crédits − débits = solde final.",
          "Fusionnez-les dans un seul fichier. Si des relevés se chevauchent (un relevé annuel et des relevés mensuels, par exemple), les doublons sont retirés.",
          "Vérifiez la continuité : le solde final de chaque relevé doit être le solde initial du suivant. Une rupture signale un relevé manquant.",
          "Exportez au format utile : Excel pour une analyse, OFX ou journal de banque pour la comptabilité.",
        ],
      },
      {
        type: "table",
        head: ["Mois", "Solde initial", "Solde final", "Continuité"],
        rows: [
          ["Janvier", "2 140,32", "1 875,10", "—"],
          ["Février", "1 875,10", "2 402,66", "OK"],
          ["Avril", "2 218,04", "1 990,00", "Rupture : mars manquant"],
        ],
        caption: "Exemple de contrôle de continuité entre relevés successifs",
      },
      { type: "h2", text: "Cas des vieux relevés au format particulier", id: "formats-anciens" },
      {
        type: "p",
        text: "Les mises en page évoluent : un relevé d’il y a dix ans n’a pas forcément les mêmes colonnes qu’aujourd’hui. Une analyse générique, qui ne dépend pas d’un modèle par banque, s’adapte mieux à ces variations. Le contrôle du solde reste le juge de paix : s’il est **Vérifié**, la transcription est complète, quelle que soit la mise en page.",
      },
      {
        type: "p",
        text: "Si certains relevés sont des scans (relevés papier numérisés, copies envoyées par la banque sous forme d’image), ils ne contiennent pas de texte. Lisez [notre guide sur les relevés scannés](/guides/releve-bancaire-scanne-pdf-image) pour les options possibles.",
      },
      {
        type: "cta",
        title: "Transformez vos archives en un seul tableau",
        text: "Convertissez plusieurs relevés PDF à la fois, contrôlez chaque solde et fusionnez-les sans doublons.",
        href: "/convertir",
        label: "Convertir mes relevés",
      },
    ],
    faq: [
      {
        q: "Combien de temps la banque conserve-t-elle mes relevés ?",
        a: "Au moins cinq ans, y compris après la clôture du compte. Au-delà, cela dépend de la politique d’archivage de chaque établissement : renseignez-vous auprès de votre banque.",
      },
      {
        q: "La demande de copie est-elle gratuite ?",
        a: "Pas toujours. Beaucoup de banques facturent la recherche de documents anciens ; le tarif figure dans leur brochure tarifaire.",
      },
      {
        q: "Puis-je fusionner plusieurs années de relevés dans un seul fichier Excel ?",
        a: "Oui, avec une offre payante de Relevéo : les relevés sont convertis ensemble, fusionnés et les doublons des périodes qui se chevauchent sont supprimés.",
      },
      {
        q: "Mes relevés papier scannés sont-ils compatibles ?",
        a: "Non, Relevéo ne fait pas de reconnaissance de caractères (OCR). Il faut soit obtenir une version PDF numérique, soit passer d’abord par un outil d’OCR et vérifier soigneusement le résultat.",
      },
    ],
    related: ["convertir-releve-bancaire-pdf-excel", "releve-bancaire-scanne-pdf-image", "expert-comptable-releves-pdf-clients"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Expert-comptable
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "expert-comptable-releves-pdf-clients",
    title: "Expert-comptable : traiter les relevés PDF envoyés par vos clients",
    metaTitle: "Relevés PDF des clients : méthode pour cabinets",
    description:
      "Conversion par lot, fusion, contrôle des soldes, journal 512/471 au format FEC : une méthode pour traiter les relevés PDF de vos clients sans ressaisie.",
    updated: "2026-09-24",
    readingMinutes: 7,
    category: "Comptabilité",
    intro:
      "Malgré les flux bancaires automatisés, beaucoup de dossiers arrivent encore avec des relevés en PDF : banque non connectée, compte secondaire, reprise de dossier, exercice antérieur. Voici une méthode pour les intégrer proprement, sans ressaisie ligne à ligne.",
    blocks: [
      { type: "h2", text: "Quand les relevés PDF restent incontournables", id: "cas-usage" },
      {
        type: "ul",
        items: [
          "Le client utilise une banque ou un compte que votre outil de synchronisation ne couvre pas.",
          "Vous reprenez un dossier et devez reconstituer un exercice passé.",
          "Le flux bancaire a été interrompu (changement de mandat, expiration d’un consentement) et il manque des mois.",
          "Le client vous transmet ses relevés en fin d’année, en une fois.",
          "Vous devez justifier un solde lors d’un contrôle et n’avez que les PDF.",
        ],
      },
      { type: "h2", text: "Étape 1 : collecter et trier", id: "collecter-trier" },
      {
        type: "p",
        text: "Demandez des relevés PDF téléchargés depuis l’espace client plutôt que des scans ou des photos : ce sont des PDF texte, directement exploitables. Classez-les par compte, puis par période. Un nommage simple (client_banque_compte_AAAA-MM.pdf) évite bien des confusions.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Relevés scannés",
        text: "Un relevé imprimé puis scanné ne contient que des images. Relevéo ne fait pas d’OCR et le signale. Demandez au client la version numérique, disponible dans la plupart des espaces clients.",
      },
      { type: "h2", text: "Étape 2 : convertir par lot", id: "conversion-lot" },
      {
        type: "p",
        text: "Déposez tous les relevés d’un compte en une fois. Chaque fichier est analysé dans le navigateur du poste de travail : les PDF, qui contiennent IBAN, noms et opérations de vos clients, ne sont pas envoyés sur un serveur. C’est un point à faire valoir dans votre registre de traitements et auprès des clients attentifs à la confidentialité.",
      },
      { type: "h2", text: "Étape 3 : contrôler chaque relevé", id: "controle-soldes" },
      {
        type: "p",
        text: "Pour chaque relevé, Relevéo vérifie que solde initial + crédits − débits est égal au solde final imprimé, au centime. Trois statuts possibles :",
      },
      {
        type: "table",
        head: ["Statut", "Signification", "Action"],
        rows: [
          ["Vérifié", "La transcription est arithmétiquement complète", "Passer à la suite"],
          [
            "Écart de X €",
            "Une ligne manque, est en double ou mal classée",
            "Contrôler les lignes signalées, corriger la cellule, exclure ou inverser un signe",
          ],
          [
            "Non vérifiable",
            "Le relevé n’imprime pas de soldes",
            "Saisir les soldes à partir d’une autre source (relevé précédent, attestation)",
          ],
        ],
        caption: "Les statuts de contrôle et la conduite à tenir",
      },
      {
        type: "p",
        text: "Quand le relevé comporte une colonne de solde courant, le contrôle se fait aussi ligne par ligne, ce qui localise précisément l’anomalie. Le rapport de contrôle imprimable (offres payantes) récapitule ces résultats : utile pour le dossier de travail.",
      },
      { type: "h2", text: "Étape 4 : fusionner les périodes", id: "fusion" },
      {
        type: "p",
        text: "Les relevés d’un même compte peuvent être fusionnés en un seul fichier. Si des périodes se chevauchent (relevé de quinzaine et relevé mensuel, ou deux envois du même mois), les opérations en double sont retirées. Vérifiez ensuite la continuité : le solde final de chaque relevé doit égaler le solde initial du suivant.",
      },
      { type: "h2", text: "Étape 5 : générer le journal de banque", id: "journal-banque" },
      {
        type: "p",
        text: "Plutôt qu’un simple tableau d’opérations, vous pouvez exporter un journal de banque en partie double, au format des 18 colonnes du fichier des écritures comptables (FEC) défini par l’article A47 A-1 du Livre des procédures fiscales, en fichier texte séparé par des tabulations. Chaque opération produit deux lignes :",
      },
      {
        type: "table",
        head: ["Opération", "Compte 512000 (Banque)", "Compte 471000 (Attente)"],
        rows: [
          ["Encaissement de 1 200,00 €", "Débit 1 200,00", "Crédit 1 200,00"],
          ["Prélèvement de 89,90 €", "Crédit 89,90", "Débit 89,90"],
        ],
        caption: "Principe du journal de banque 512 / 471",
      },
      {
        type: "p",
        text: "Le compte 512000 est ainsi juste dès l’import, et toutes les contreparties sont regroupées en 471000. Le travail d’affectation consiste ensuite à reclasser chaque ligne du compte d’attente vers le bon compte de tiers ou de charge, avec vos règles d’affectation habituelles.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Import dans votre logiciel",
        text: "Le fichier reprend les noms de colonnes du FEC (JournalCode, EcritureDate, CompteNum, EcritureLib, Debit, Credit…). Les options d’import d’écritures varient selon les logiciels : faites un premier essai sur un dossier de test pour valider la correspondance.",
      },
      { type: "h2", text: "Étape 6 : solder le compte d’attente", id: "solder-attente" },
      {
        type: "p",
        text: "Le 471 doit être soldé avant la clôture. Filtrez-le par libellé : les opérations récurrentes (loyer, abonnements, URSSAF, frais bancaires) se reclassent en masse. Les lignes restantes font l’objet d’une liste de questions au client, qui est bien plus claire quand elle cite le libellé bancaire exact, la date et le montant.",
      },
      { type: "h2", text: "Ce que la méthode change au quotidien", id: "gains" },
      {
        type: "ul",
        items: [
          "Plus de ressaisie des opérations : le temps se déplace vers l’affectation et l’analyse, là où se trouve la valeur ajoutée.",
          "Moins de risque d’erreur de frappe, et un contrôle arithmétique systématique au lieu d’une vérification visuelle.",
          "Une piste d’audit simple : PDF d’origine, statut de contrôle, fichier exporté.",
          "Une réexportation gratuite du même relevé dans le mois, pour produire un autre format sans consommer de pages.",
        ],
      },
      {
        type: "p",
        text: "L’offre Cabinet (39 € par mois ou 390 € par an) inclut 2 500 pages par mois, la fusion et le rapport de contrôle. Relevéo reste une aide à la transcription : l’analyse et la validation comptables demeurent de votre ressort.",
      },
      {
        type: "cta",
        title: "Testez sur un dossier client",
        text: "Convertissez un lot de relevés, contrôlez les soldes et exportez le journal 512/471, sans envoyer les PDF sur un serveur.",
        href: "/convertir",
        label: "Essayer sur un lot",
      },
    ],
    faq: [
      {
        q: "Le fichier exporté est-il un FEC complet ?",
        a: "Non. C’est un journal de banque qui utilise les 18 colonnes du FEC, pour faciliter l’import. Le FEC réglementaire est produit par votre logiciel de comptabilité à partir de l’ensemble des écritures du dossier.",
      },
      {
        q: "Pourquoi utiliser le compte 471 plutôt que des comptes définitifs ?",
        a: "Parce que l’affectation d’une opération nécessite de connaître la pièce justificative. Le compte d’attente permet d’avoir une banque juste immédiatement, puis de reclasser avec vos propres règles.",
      },
      {
        q: "Les relevés de mes clients transitent-ils par vos serveurs ?",
        a: "Non. L’analyse se fait dans le navigateur. Le serveur ne reçoit que le nombre de pages et une empreinte SHA-256 du fichier, pour la facturation.",
      },
      {
        q: "Que se passe-t-il si je reconvertis un relevé déjà traité ?",
        a: "Réexporter le même relevé au cours du même mois ne consomme pas de pages supplémentaires.",
      },
    ],
    related: [
      "rapprochement-bancaire",
      "importer-releve-ofx-logiciel-comptable",
      "recuperer-anciens-releves-bancaires",
      "releve-bancaire-scanne-pdf-image",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. PDF scanné
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "releve-bancaire-scanne-pdf-image",
    title: "Relevé bancaire scanné : pourquoi la conversion échoue et que faire",
    metaTitle: "Relevé bancaire scanné (PDF image) : que faire ?",
    description:
      "Comment savoir si votre relevé PDF est un scan, pourquoi il ne se convertit pas en Excel, et les solutions : version numérique, espace client, OCR ou ressaisie.",
    updated: "2026-09-24",
    readingMinutes: 5,
    category: "Pratique",
    intro:
      "Tous les PDF ne se ressemblent pas : certains contiennent du texte, d’autres seulement une image de la page. Un relevé scanné ne peut pas être converti directement en tableau, et il vaut mieux le savoir avant de chercher l’erreur ailleurs.",
    blocks: [
      { type: "h2", text: "PDF texte et PDF image : la différence", id: "texte-ou-image" },
      {
        type: "p",
        text: "Un **PDF texte** est généré directement par un logiciel, comme les relevés téléchargés depuis un espace client. Il contient les caractères eux-mêmes, avec leur position sur la page : un programme peut les lire exactement.",
      },
      {
        type: "p",
        text: "Un **PDF image** (ou PDF scanné) contient une photographie de la page, produite par un scanner, un copieur ou une application photo. Pour un ordinateur, ce n’est qu’une grille de pixels : il n’y a aucun caractère à lire.",
      },
      { type: "h2", text: "Le test en dix secondes", id: "test-selection" },
      {
        type: "ol",
        items: [
          "Ouvrez le PDF dans votre lecteur habituel.",
          "Essayez de sélectionner un montant ou un libellé avec la souris.",
          "Si le texte se surligne mot par mot et que vous pouvez le copier, c’est un PDF texte.",
          "Si vous ne pouvez tracer qu’un rectangle, ou si rien ne se sélectionne, c’est une image.",
        ],
      },
      {
        type: "p",
        text: "Autres indices : la page est légèrement de travers, le fond est grisé, les caractères sont un peu flous quand on zoome, ou la recherche (Ctrl+F) ne trouve aucun mot pourtant visible.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Cas intermédiaire",
        text: "Certains scans ont déjà subi une reconnaissance de caractères : le texte se sélectionne, mais il a été deviné par un logiciel et peut contenir des erreurs. Le contrôle du solde permet de le détecter.",
      },
      { type: "h2", text: "Pourquoi la conversion échoue", id: "pourquoi-echec" },
      {
        type: "p",
        text: "Un convertisseur de relevés lit les caractères et leurs coordonnées pour reconstituer les colonnes. Sur un scan, il n’y a rien à lire. Relevéo ne fait pas de reconnaissance optique de caractères (OCR) : quand il détecte qu’un PDF ne contient pas de texte, il vous l’indique clairement plutôt que de produire un tableau vide ou approximatif.",
      },
      { type: "h2", text: "Solution 1 : obtenir la version numérique", id: "version-numerique" },
      {
        type: "p",
        text: "C’est de loin la meilleure option. La plupart des banques mettent les relevés à disposition en PDF dans l’espace client, souvent sur plusieurs années. Si le relevé a été imprimé puis scanné, retournez à la source : téléchargez-le de nouveau, ou demandez à la personne qui vous l’a transmis (client, associé, proche) de vous envoyer le fichier d’origine.",
      },
      {
        type: "p",
        text: "Pour des périodes plus anciennes ou un compte clôturé, la banque peut fournir des copies ; précisez que vous souhaitez un PDF numérique. Voir [notre guide pour récupérer d’anciens relevés](/guides/recuperer-anciens-releves-bancaires).",
      },
      { type: "h2", text: "Solution 2 : utiliser un outil d’OCR", id: "ocr" },
      {
        type: "p",
        text: "Des logiciels de reconnaissance de caractères transforment l’image en texte. Ils fonctionnent bien sur des documents propres, mais les relevés bancaires sont un cas difficile, parce que chaque caractère compte :",
      },
      {
        type: "table",
        head: ["Erreur typique d’OCR", "Conséquence"],
        rows: [
          ["« 8 » lu « 3 », « 1 » lu « 7 »", "Montant faux, écart de solde"],
          ["Virgule décimale perdue", "Montant multiplié par 100"],
          ["Signe ou colonne mal détecté", "Débit transformé en crédit"],
          ["Ligne sautée sur une page mal numérisée", "Opération manquante"],
        ],
        caption: "Les erreurs d’OCR ont un impact direct sur les montants",
      },
      {
        type: "p",
        text: "Si vous passez par un OCR, gardez le PDF d’origine à côté, et vérifiez impérativement le résultat par le solde : solde initial + crédits − débits doit égaler le solde final. Un OCR qui produit un PDF avec couche texte peut ensuite être lu par Relevéo, dont le contrôle signalera un éventuel écart. Attention aussi à la confidentialité : beaucoup de services d’OCR en ligne traitent le document sur leurs serveurs.",
      },
      { type: "h2", text: "Solution 3 : ressaisir", id: "ressaisie" },
      {
        type: "p",
        text: "Pour un ou deux relevés courts, la ressaisie manuelle dans un tableur reste raisonnable. Saisissez les débits et crédits dans deux colonnes distinctes, puis contrôlez le total avec le solde imprimé. Au-delà de quelques pages, cherchez plutôt à obtenir la version numérique.",
      },
      { type: "h2", text: "Mieux vaut prévenir", id: "prevenir" },
      {
        type: "ul",
        items: [
          "Téléchargez les relevés en PDF depuis l’espace client au lieu de les imprimer.",
          "Si vous devez transmettre un relevé, envoyez le fichier d’origine, pas un scan.",
          "Archivez vos relevés numériques régulièrement : les espaces clients ne gardent pas tout indéfiniment.",
        ],
      },
      {
        type: "cta",
        title: "Vous avez la version numérique ?",
        text: "Déposez-la : Relevéo la convertit dans votre navigateur et vérifie le solde au centime.",
        href: "/convertir",
        label: "Convertir un relevé",
      },
    ],
    faq: [
      {
        q: "Relevéo fait-il de l’OCR ?",
        a: "Non. Relevéo lit uniquement les PDF qui contiennent du texte. Lorsqu’un fichier est une image, l’application le signale clairement.",
      },
      {
        q: "Une photo de relevé prise avec mon téléphone peut-elle être convertie ?",
        a: "Pas directement : c’est une image. Téléchargez plutôt le relevé en PDF depuis l’application ou le site de votre banque.",
      },
      {
        q: "Comment savoir si un PDF est scanné ?",
        a: "Essayez de sélectionner un mot : si c’est impossible, ou si Ctrl+F ne trouve rien, le PDF est une image.",
      },
      {
        q: "Un PDF protégé par mot de passe est-il un PDF scanné ?",
        a: "Non, ce sont deux choses différentes. Un PDF protégé peut très bien contenir du texte : Relevéo vous demande alors le mot de passe, qui est utilisé localement dans votre navigateur pour ouvrir le fichier.",
      },
    ],
    related: ["convertir-releve-bancaire-pdf-excel", "recuperer-anciens-releves-bancaires", "expert-comptable-releves-pdf-clients"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. CSV / Excel France
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "csv-excel-point-virgule-virgule-decimale",
    title: "CSV dans Excel : point-virgule, virgule décimale et encodage",
    metaTitle: "CSV dans Excel : point-virgule et virgule décimale",
    description:
      "Votre CSV s’ouvre sur une seule colonne ou avec des montants faux ? Séparateurs, virgule décimale, UTF-8 avec BOM et dates : comment l’importer proprement.",
    updated: "2026-09-24",
    readingMinutes: 6,
    category: "Conversion",
    intro:
      "Un fichier CSV qui s’affiche parfaitement chez un collègue peut arriver tout sur une colonne, avec des accents cassés ou des montants transformés en dates dans votre Excel. Rien n’est corrompu : c’est une question de conventions régionales.",
    blocks: [
      { type: "h2", text: "Qu’est-ce qu’un CSV, exactement ?", id: "definition-csv" },
      {
        type: "p",
        text: "Un CSV (« comma-separated values ») est un fichier texte brut : une ligne par enregistrement, des champs séparés par un caractère. Il ne contient ni mise en forme, ni type de données, ni indication sur la façon de le lire. C’est le logiciel qui l’ouvre qui doit deviner le séparateur, le format des nombres, celui des dates et l’encodage des caractères. Et Excel devine d’après les réglages régionaux de votre ordinateur.",
      },
      { type: "h2", text: "Symptôme 1 : tout s’affiche dans une seule colonne", id: "une-seule-colonne" },
      {
        type: "p",
        text: "Dans les pays anglophones, le séparateur de champs est la virgule. Mais en français, la virgule sert de séparateur décimal : les paramètres régionaux français utilisent donc le **point-virgule** comme séparateur de liste. Un CSV séparé par des virgules, ouvert par double-clic dans un Excel réglé en français, apparaît alors sur une seule colonne : « 03/02/2026,Loyer,-850.00 ».",
      },
      {
        type: "table",
        head: ["Convention", "Séparateur de champs", "Séparateur décimal", "Exemple de ligne"],
        rows: [
          ["Française (Excel France)", "; (point-virgule)", ", (virgule)", "03/02/2026;Loyer;-850,00"],
          ["Internationale", ", (virgule)", ". (point)", "2026-02-03,Loyer,-850.00"],
        ],
        caption: "Les deux conventions CSV les plus courantes",
      },
      { type: "h2", text: "Symptôme 2 : des montants faux ou devenus des dates", id: "montants-casses" },
      {
        type: "p",
        text: "Si le séparateur décimal du fichier ne correspond pas à celui d’Excel, les montants sont mal interprétés. « 850.00 » dans un Excel français peut rester du texte (aligné à gauche, ignoré par les sommes), et certaines valeurs comme « 3.12 » peuvent même être converties en date (3 décembre). À l’inverse, « 1 234,56 » avec une espace comme séparateur de milliers est lu comme du texte dans un Excel anglophone.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Le piège silencieux",
        text: "Un montant stocké en texte ne provoque aucune erreur : il est simplement ignoré par SOMME. Votre total est faux sans que rien ne vous alerte. Vérifiez toujours qu’un total calculé correspond à une référence, comme le solde du relevé.",
      },
      { type: "h2", text: "Symptôme 3 : des accents illisibles", id: "encodage" },
      {
        type: "p",
        text: "« PrÃ©lÃ¨vement » au lieu de « Prélèvement » : le fichier est encodé en UTF-8, mais Excel l’a lu avec un autre encodage (souvent Windows-1252). La solution côté producteur du fichier est d’ajouter un **BOM** (Byte Order Mark), une signature invisible en tête de fichier qui indique à Excel qu’il s’agit d’UTF-8. Côté utilisateur, on choisit l’encodage à l’import (voir ci-dessous).",
      },
      { type: "h2", text: "Symptôme 4 : des dates inversées", id: "dates" },
      {
        type: "p",
        text: "« 03/02/2026 » signifie 3 février en France et 2 mars aux États-Unis. Excel l’interprète selon vos réglages régionaux, et peut aussi laisser en texte les dates qui ne « rentrent » pas (13/02 lu comme mois 13). Le format **AAAA-MM-JJ** (ISO 8601, par exemple 2026-02-03) évite toute ambiguïté.",
      },
      { type: "h2", text: "Importer un CSV correctement dans Excel", id: "importer-dans-excel" },
      {
        type: "p",
        text: "Plutôt que de double-cliquer sur le fichier, passez par l’assistant d’import, qui vous laisse choisir chaque paramètre :",
      },
      {
        type: "ol",
        items: [
          "Ouvrez un classeur vide, onglet **Données**, puis **À partir d’un fichier texte/CSV**.",
          "Sélectionnez le fichier. Un aperçu s’affiche.",
          "Dans **Origine du fichier**, choisissez « 65001 : Unicode (UTF-8) » si les accents sont mal affichés.",
          "Dans **Délimiteur**, choisissez Point-virgule ou Virgule selon le fichier ; l’aperçu doit se répartir en colonnes.",
          "Si les montants ou les dates sont mal reconnus, cliquez sur **Transformer les données** et définissez le type de chaque colonne avec les « paramètres régionaux » adaptés (par exemple Anglais (États-Unis) pour des montants avec point décimal).",
          "Cliquez sur **Charger**.",
        ],
      },
      {
        type: "p",
        text: "Selon votre version d’Excel, les libellés exacts peuvent différer légèrement, mais le principe est le même : l’import guidé vous rend maître des conventions au lieu de les laisser deviner.",
      },
      { type: "h2", text: "Les formats proposés par Relevéo", id: "formats-releveo" },
      {
        type: "ul",
        items: [
          "**Excel (.xlsx)** : le choix le plus sûr pour travailler dans un tableur. Les dates sont de vraies dates, les montants de vrais nombres ; aucun séparateur ni encodage à régler.",
          "**CSV (Excel France)** : point-virgule, virgule décimale, UTF-8 avec BOM. Il s’ouvre correctement par double-clic dans un Excel réglé en français.",
          "**CSV international** : virgule comme séparateur, point décimal. Adapté aux logiciels anglophones, aux scripts et à de nombreux outils d’import paramétrables.",
        ],
      },
      {
        type: "p",
        text: "Pour un logiciel de comptabilité ou de budget, l’OFX évite souvent tout paramétrage : voir [OFX, QIF ou CSV](/guides/importer-releve-ofx-logiciel-comptable).",
      },
      {
        type: "cta",
        title: "Des fichiers qui s’ouvrent du premier coup",
        text: "Convertissez votre relevé PDF en .xlsx ou en CSV au format Excel France, gratuitement jusqu’à 15 pages par mois.",
        href: "/convertir",
        label: "Convertir un relevé",
      },
    ],
    faq: [
      {
        q: "Pourquoi mon CSV s’ouvre-t-il sur une seule colonne ?",
        a: "Parce que son séparateur (souvent la virgule) ne correspond pas à celui attendu par votre Excel réglé en français (le point-virgule). Importez-le via Données > À partir d’un fichier texte/CSV et choisissez le bon délimiteur.",
      },
      {
        q: "Faut-il préférer le CSV ou le .xlsx ?",
        a: "Pour travailler dans Excel, le .xlsx : il conserve les types (dates, nombres). Le CSV est utile pour importer dans un autre logiciel qui le demande.",
      },
      {
        q: "Qu’est-ce que l’UTF-8 avec BOM ?",
        a: "C’est un encodage Unicode précédé d’une courte signature qui permet à Excel de reconnaître l’UTF-8 et d’afficher correctement les accents.",
      },
      {
        q: "Mes montants sont alignés à gauche, est-ce grave ?",
        a: "Oui : ils sont probablement stockés en texte et ignorés par les formules de somme. Réimportez le fichier en précisant le séparateur décimal, ou utilisez le format .xlsx.",
      },
    ],
    related: ["convertir-releve-bancaire-pdf-excel", "importer-releve-ofx-logiciel-comptable", "rapprochement-bancaire"],
  },
];
