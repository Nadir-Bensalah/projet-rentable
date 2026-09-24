#!/usr/bin/env python3
"""Génère les livrables de prospects/ à partir de merged.json (sortie de merge.py).

Usage: export.py <state_dir> <prospects_dir>
"""
import collections, csv, json, os, sys
from urllib.parse import urlparse

COLS = ["id", "entreprise", "siren", "secteur", "ville", "departement", "region", "site_web", "email",
        "telephone", "source_email", "source_telephone", "contact_nom", "contact_fonction", "linkedin",
        "effectif", "capital", "actualite", "site_existant", "app_ios", "app_android", "besoin", "faits",
        "inference", "opportunite", "service", "signal_achat", "urgence", "score", "score_besoin",
        "score_urgence", "score_fit", "score_capacite", "score_accessibilite", "score_preuves", "niveau",
        "sources", "date_verification", "objet_email", "email_personnalise", "accroche_tel", "relance",
        "pourquoi_demain", "equipe"]


def flat(p):
    r = {c: p.get(c, "") for c in COLS}
    r["faits"] = " | ".join(f"{f.get('fait')} [{f.get('source_type', '')}, {f.get('date', '')}] {f.get('url', '')}"
                            for f in p.get("faits", []))
    r["sources"] = " | ".join(p.get("sources", []))
    for k, v in (p.get("score_detail") or {}).items():
        r["score_" + k] = v
    return r


def host(u):
    return (urlparse(u).hostname or "").removeprefix("www.")


def table(counter, title, total):
    lines = [f"### {title}", "", "| Valeur | Nombre | % |", "|---|---:|---:|"]
    for k, v in counter.most_common():
        lines.append(f"| {k or 'Non précisé'} | {v} | {v / max(total, 1) * 100:.1f} % |")
    return "\n".join(lines) + "\n"


def card(i, p, long):
    f = p.get("faits", [])
    out = [f"### {i}. {p['entreprise']} — {p['score']}/100 · {p['niveau']}",
           f"*{p.get('secteur')} · {p.get('ville')} ({p.get('departement')}) · {p['id']}*", "",
           f"**Pourquoi l'appeler demain matin :** {p.get('pourquoi_demain')}", "",
           f"- **Signal d'achat :** {p.get('signal_achat')} — urgence {p.get('urgence')}",
           f"- **Service à proposer :** {p.get('service')}",
           f"- **Email :** `{p.get('email')}` ([source]({p.get('source_email')})) · **Tél :** `{p.get('telephone')}` ([source]({p.get('source_telephone')}))"]
    if p.get("contact_nom"):
        out.append(f"- **Contact :** {p['contact_nom']} — {p.get('contact_fonction', '')}")
    out.append("- **Faits observés :**")
    for x in f[: (4 if long else 2)]:
        out.append(f"  - {x.get('fait')} ([{x.get('source_type', 'source')}]({x.get('url')}), {x.get('date', '')})")
    if long:
        out += [f"- **Inférence :** {p.get('inference')}", f"- **Proposition Capmedia :** {p.get('opportunite')}", "",
                f"**Objet :** {p.get('objet_email')}", "", "```text", p.get("email_personnalise", ""), "```", "",
                f"**Accroche téléphone :** {p.get('accroche_tel')}", "", f"**Relance :** {p.get('relance')}"]
    return "\n".join(out) + "\n"


def main():
    st, outd = sys.argv[1], sys.argv[2]
    m = json.load(open(os.path.join(st, "merged.json")))
    P, R, T = m["prospects"], m["rejets"], m["equipes"]
    P.sort(key=lambda p: (-p["score"], -(p.get("score_detail", {}).get("urgence", 0))))
    with open(os.path.join(outd, "prospects.csv"), "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=COLS, delimiter=";")
        w.writeheader()
        for p in P:
            w.writerow(flat(p))
    json.dump(P, open(os.path.join(outd, "prospects.json"), "w"), ensure_ascii=False, indent=1)
    with open(os.path.join(outd, "rejetes.csv"), "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=["entreprise", "etape", "raison", "equipe"], delimiter=";", extrasaction="ignore")
        w.writeheader()
        for r in R:
            w.writerow(r)
    opp = os.path.join(outd, "opposition.csv")
    if not os.path.exists(opp):
        open(opp, "w", encoding="utf-8").write("entreprise;domaine;email;telephone;date;motif\n")

    top100 = P[:100]
    md = ["# Top 100 — opportunités à contacter en priorité", "",
          f"Sélection des {len(top100)} meilleures combinaisons besoin + timing + preuve + accessibilité + fit Capmedia "
          f"parmi {len(P)} prospects retenus. Classement par score puis par urgence.", ""]
    md += [card(i + 1, p, True) for i, p in enumerate(top100)]
    open(os.path.join(outd, "top-100.md"), "w").write("\n".join(md))
    md = ["# Top 500", "", f"{min(500, len(P))} prospects retenus, du score le plus élevé au plus bas.", ""]
    md += [card(i + 1, p, False) for i, p in enumerate(P[:500])]
    open(os.path.join(outd, "top-500.md"), "w").write("\n".join(md))

    src = collections.Counter()
    stype = collections.Counter()
    for p in P:
        for f in p.get("faits", []):
            src[host(f.get("url", ""))] += 1
            stype[f.get("source_type", "")] += 1
        src[host(p.get("source_email", ""))] += 0
    lines = ["# Sources", "", "Toutes les URLs sont reprises fiche par fiche dans `prospects.csv` (colonnes `faits`, "
             "`sources`, `source_email`, `source_telephone`).", "", table(stype, "Nature des sources des faits", sum(stype.values())),
             table(collections.Counter({k: v for k, v in src.items() if v}), "Domaines les plus cités (faits)", sum(src.values())),
             table(collections.Counter(host(p.get("source_email", "")) for p in P), "Où les emails ont été trouvés", len(P)),
             table(collections.Counter(host(p.get("source_telephone", "")) for p in P), "Où les téléphones ont été trouvés", len(P))]
    open(os.path.join(outd, "sources.md"), "w").write("\n".join(lines))

    n = len(P)
    analysed = max(sum(t.get("analysees", 0) for t in T), n + len(R))
    rej_step = collections.Counter(r.get("etape", "") for r in R)
    buckets = collections.Counter(("90-100" if p["score"] >= 90 else "80-89" if p["score"] >= 80 else "70-79") for p in P)
    email_fail = sum(v for k, v in rej_step.items() if "mail" in k.lower())
    phone_fail = sum(v for k, v in rej_step.items() if "léphone" in k.lower() or "telephone" in k.lower())
    s = ["# Statistiques", "",
         f"- Entreprises analysées : **{analysed}**",
         f"- Entreprises rejetées : **{analysed - n}** (dont {len(R)} rejets documentés dans `rejetes.csv`)",
         f"- Prospects retenus : **{n}**",
         f"- 90+ (TRÈS CHAUD) : **{buckets['90-100']}** · 80-89 (CHAUD) : **{buckets['80-89']}** · 70-79 (QUALIFIÉ) : **{buckets['70-79']}**",
         f"- Taux d'échec email (rejets à l'étape email / entreprises analysées) : **{email_fail / max(analysed, 1) * 100:.1f} %** ({email_fail})",
         f"- Taux d'échec téléphone : **{phone_fail / max(analysed, 1) * 100:.1f} %** ({phone_fail})", "",
         table(rej_step, "Rejets par étape du pipeline", len(R)),
         table(collections.Counter(p.get("secteur") for p in P), "Répartition par secteur", n),
         table(collections.Counter(p.get("region") for p in P), "Répartition géographique (région)", n),
         table(collections.Counter(p.get("service") for p in P), "Répartition par besoin / service proposé", n),
         table(buckets, "Répartition par score", n),
         table(collections.Counter(p.get("signal_achat") for p in P), "Principaux signaux d'achat", n),
         table(stype, "Principales sources utilisées", sum(stype.values())),
         "### Par équipe", "", "| Équipe | Analysées | Retenus | Rejets |", "|---|---:|---:|---:|"]
    s += [f"| {t['nom']} | {t['analysees']} | {t['retenues']} | {t['rejetees']} |" for t in T]
    open(os.path.join(outd, "statistiques.md"), "w").write("\n".join(s) + "\n")
    print("export ok", n)


if __name__ == "__main__":
    main()
