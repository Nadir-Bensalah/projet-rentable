#!/usr/bin/env python3
"""Fusionne les fichiers d'équipes, valide, déduplique et prépare la synchro du tableau de bord.

Usage: merge.py <teams_dir> <state_dir>
Écrit <state_dir>/merged.json et, pour les documents nouveaux ou modifiés depuis la
dernière synchro, des fichiers <state_dir>/out/<collection>__<id>.json + pending.json.
Marquer comme synchronisé : merge.py --ack <state_dir>
"""
import glob, hashlib, json, os, re, sys, unicodedata
from urllib.parse import urlparse

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
BANNED_EMAIL_DOMAINS = {"indeed.com", "malt.fr", "malt.com", "codeur.com", "welcometothejungle.com",
                        "hellowork.com", "example.com", "gmail.co"}
REQUIRED = ["entreprise", "secteur", "ville", "email", "telephone", "source_email", "source_telephone",
            "besoin", "faits", "inference", "opportunite", "service", "signal_achat", "score_detail",
            "objet_email", "email_personnalise", "accroche_tel", "relance", "pourquoi_demain"]
CAPS = {"besoin": 25, "urgence": 20, "fit": 20, "capacite": 10, "accessibilite": 10, "preuves": 15}
EMAIL_ONLY_FROM_DOMAIN = re.compile(r"^(contact|info|bonjour|hello)@")


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\b(sas|sasu|sarl|eurl|sa|sci|groupe|group|france|the|le|la|les)\b", " ", s)
    return re.sub(r"[^a-z0-9]", "", s)


def phone_norm(p):
    d = re.sub(r"\D", "", str(p or ""))
    if d.startswith("33") and len(d) == 11:
        d = "0" + d[2:]
    if d.startswith("0033"):
        d = "0" + d[4:]
    return d


def domain(u):
    try:
        h = urlparse(u if "//" in str(u) else "http://" + str(u)).hostname or ""
    except Exception:
        return ""
    return h.lower().removeprefix("www.")


def level(score):
    return "TRÈS CHAUD" if score >= 90 else "CHAUD" if score >= 80 else "QUALIFIÉ" if score >= 70 else "REJETÉ"


def validate(p):
    errs = []
    for k in REQUIRED:
        if not p.get(k):
            errs.append(f"champ manquant: {k}")
    email = str(p.get("email", "")).strip()
    if not EMAIL_RE.match(email):
        errs.append("email invalide")
    elif email.split("@")[1].lower() in BANNED_EMAIL_DOMAINS:
        errs.append("email de plateforme")
    ph = phone_norm(p.get("telephone"))
    if not (len(ph) == 10 and ph.startswith("0") and ph[1] in "123456789"):
        errs.append("téléphone incomplet ou non français")
    for k in ("source_email", "source_telephone"):
        if not str(p.get(k, "")).startswith("http"):
            errs.append(f"{k} non traçable")
    faits = p.get("faits") or []
    if not any(str(f.get("url", "")).startswith("http") for f in faits if isinstance(f, dict)):
        errs.append("aucun fait sourcé")
    sd = p.get("score_detail") or {}
    try:
        tot = 0
        for k, cap in CAPS.items():
            v = int(sd.get(k, 0))
            if v < 0 or v > cap:
                errs.append(f"score {k} hors borne")
            tot += v
        p["score"] = tot
    except Exception:
        errs.append("score_detail illisible")
        p["score"] = 0
    if p["score"] < 70:
        errs.append("score < 70")
    p["niveau"] = level(p["score"])
    body = str(p.get("email_personnalise", ""))
    if "stop" not in body.lower():
        errs.append("pas de mention d'opposition")
    if "Capmedia" not in body:
        errs.append("Capmedia non identifié dans l'email")
    return errs


def keys(p):
    out = set()
    if p.get("siren"):
        s = re.sub(r"\D", "", p["siren"])[:9]
        if len(s) == 9:
            out.add("siren:" + s)
    d = domain(p.get("site_web", ""))
    if d:
        out.add("dom:" + d)
    out.add("tel:" + phone_norm(p.get("telephone")))
    out.add("mail:" + str(p.get("email", "")).lower().strip())
    n = norm(p.get("entreprise"))
    if n:
        out.add("nom:" + n)
    return out


def h(obj):
    return hashlib.sha1(json.dumps(obj, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def main():
    if sys.argv[1] == "--ack":
        st = sys.argv[2]
        pend = json.load(open(os.path.join(st, "pending.json")))
        synced = json.load(open(os.path.join(st, "synced.json"))) if os.path.exists(os.path.join(st, "synced.json")) else {}
        for k, v in pend["hashes"].items():
            if v is None:
                synced.pop(k, None)
            else:
                synced[k] = v
        json.dump(synced, open(os.path.join(st, "synced.json"), "w"))
        for f in glob.glob(os.path.join(st, "out", "*.json")):
            os.remove(f)
        os.remove(os.path.join(st, "pending.json"))
        print("ack", len(pend["hashes"]))
        return
    teams_dir, st = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.join(st, "out"), exist_ok=True)
    optout_path = os.path.join(st, "opposition.json")
    optout = json.load(open(optout_path)) if os.path.exists(optout_path) else []
    optkeys = set()
    for o in optout:
        optkeys |= {k for k in keys(o) if not k.startswith("tel:") or len(k) > 5}
    qa_path = os.path.join(st, "qa.json")
    qa = json.load(open(qa_path)) if os.path.exists(qa_path) else {}
    kept, rejects, teams, seen = [], [], [], {}
    for f in sorted(glob.glob(os.path.join(teams_dir, "*.json"))):
        try:
            data = json.load(open(f))
        except Exception as e:
            print("WARN illisible", f, e, file=sys.stderr)
            continue
        team = data.get("equipe") or os.path.basename(f)[:-5]
        nk = nr = 0
        for r in data.get("rejets", []):
            r.setdefault("equipe", team)
            rejects.append(r)
            nr += 1
        for p in data.get("retenus", []):
            p = dict(p)
            p.setdefault("equipe", team)
            fix = qa.get(p.get("id"), {})
            for k, v in fix.get("set", {}).items():
                if isinstance(v, dict) and isinstance(p.get(k), dict):
                    p[k].update(v)
                else:
                    p[k] = v
            errs = validate(p)
            if fix.get("rejet"):
                errs.append("QA : " + fix["rejet"])
            ks = keys(p)
            dup = next((seen[k] for k in ks if k in seen), None)
            if ks & optkeys:
                errs.append("liste d'opposition")
            if errs:
                rejects.append({"entreprise": p.get("entreprise", "?"), "etape": "contrôle qualité",
                                "raison": "; ".join(errs), "equipe": team})
                nr += 1
                continue
            if dup is not None:
                other = kept[dup]
                if p["score"] > other["score"]:
                    rejects.append({"entreprise": other["entreprise"], "etape": "doublon",
                                    "raison": f"doublon de {p['id']}", "equipe": other["equipe"]})
                    kept[dup] = p
                    for k in ks:
                        seen[k] = dup
                else:
                    rejects.append({"entreprise": p["entreprise"], "etape": "doublon",
                                    "raison": f"doublon de {other['id']}", "equipe": team})
                nr += 1
                continue
            idx = len(kept)
            kept.append(p)
            for k in ks:
                seen[k] = idx
            nk += 1
        teams.append({"nom": team, "statut": data.get("statut", "terminée" if data.get("termine") else "en cours"), "analysees": int(data.get("analysees") or (nk + nr)),
                      "retenues": nk, "rejetees": nr})
    # recount kept per team after dedup replacement
    for t in teams:
        t["retenues"] = sum(1 for p in kept if p["equipe"] == t["nom"])
    kept.sort(key=lambda p: -p["score"])
    json.dump({"prospects": kept, "rejets": rejects, "equipes": teams, "opposition": optout},
              open(os.path.join(st, "merged.json"), "w"), ensure_ascii=False, indent=1)
    synced = json.load(open(os.path.join(st, "synced.json"))) if os.path.exists(os.path.join(st, "synced.json")) else {}
    docs = {}
    for p in kept:
        docs[f"prospects__{p['id']}"] = p
    docs["synthese__etat"] = {"rejets": rejects, "equipes": teams, "opposition": optout}
    live = set(docs)
    deletes = [k for k in synced if k not in live and k.startswith("prospects__")]
    hashes, writes = {}, []
    for k, d in docs.items():
        hv = h(d)
        if synced.get(k) != hv:
            path = os.path.join(st, "out", k + ".json")
            json.dump(d, open(path, "w"), ensure_ascii=False)
            path = path.replace("/state/out/", "/o/")
            col, did = k.split("__", 1)
            writes.append({"op": "set", "collection": col, "doc_id": did, "file_path": path})
            hashes[k] = hv
    for k in deletes:
        col, did = k.split("__", 1)
        writes.append({"op": "delete", "collection": col, "doc_id": did})
        hashes[k] = None
    json.dump({"writes": writes, "hashes": hashes}, open(os.path.join(st, "pending.json"), "w"))
    lv = {x: sum(1 for p in kept if p["niveau"] == x) for x in ("TRÈS CHAUD", "CHAUD", "QUALIFIÉ")}
    print(f"retenus={len(kept)} rejets={len(rejects)} {lv} writes={len(writes)}")


if __name__ == "__main__":
    main()
