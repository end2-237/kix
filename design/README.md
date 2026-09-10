# KIX — maquettes

Direction artistique **Cyber-Urban Dark** : fond `#0B0B0D`, cartes en verre
(`rgba(255,255,255,.055)` + flou 18 px), vert billard `#3DF08A`, violet nuit
`#9B6BFF`. Titres en Space Grotesk 700, interface en Outfit 400/500/600.

## Écrans

| Artboard | Module | Format |
| --- | --- | --- |
| `Main` | Accueil, solde KIX Pass, salles proches | 390 × 844 |
| `Recharge` | Achat de jetons + paiement Orange Money / MTN MoMo | 390 × 844 |
| `Pass` | Portefeuille de jetons, QR + code de secours 4 chiffres | 390 × 844 |
| `Scan` | KIX Scan côté gérant (mobile) | 390 × 844 |
| `Shop` | Boutique vapes et matériel de billard | 390 × 844 |
| `Event` | Détail tournoi + billetterie | 390 × 844 |
| `Rewards` | XP, conversion en jetons, classement | 390 × 844 |
| `WebHome` | Accueil web | 1440 × 900 |
| `WebScan` | Espace gérant web (KPI, scanner, passages) | 1440 × 900 |
| `WebShop` | Boutique web | 1440 × 900 |
| `Systeme` | Palette, typo, composants, rythme | 1280 × 900 |

Rendus dans `docs/`. Les photos viennent d'Unsplash (`assets/img/`).

## Rebuild

```bash
cd design
node tools/fetch-fonts.mjs                 # assets/fonts.css (woff2 en data-URI)
node tools/build.mjs                       # src/ -> build/ (polices + QR injectés)
node tools/preview.mjs                     # build/ -> preview/ (PNG 2x)
PREVIEW_DIR=docs PREVIEW_DPR=1 node tools/preview.mjs
node tools/planches.mjs                    # planches de présentation
```

Les sources d'artboards sont dans `src/*.dc.html` ; `src/canvas.json` décrit la
mise en page du canvas (pages *Écrans mobiles*, *Web*, *Système*).

## Valeurs d'exemple

Prix, noms de salles et de personnes sont des exemples à remplacer. Les chiffres
entre crochets (`[12]` salles, `[4 300]` jetons/mois) sont des placeholders.
