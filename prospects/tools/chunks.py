#!/usr/bin/env python3
"""Affiche les écritures en attente par lots de 50 (JSON compact) pour ArtifactData batch."""
import json, sys
w = json.load(open(sys.argv[1] + "/pending.json"))["writes"]
i = int(sys.argv[2]) if len(sys.argv) > 2 else 0
print(len(w), "writes; lot", i)
print(json.dumps(w[i*50:(i+1)*50], ensure_ascii=False))
