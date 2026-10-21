# Slikaj z mano

Nova stran za slikajzmano.si, narejena iz izvoza Bloggerja: 147 albumov, 1.406 fotografij.

## Datoteke

- `albums.js` – vsi albumi z Bloggerja (naslov, datum, oznake, lokacija, fotografije).
- `content.js` – nastavitve in besedila: O meni, kontakt, povezave, naslovna fotografija, filtri.
- `index.html`, `style.css`, `app.js` – izgled in delovanje.
- `404.html` – stare povezave z Bloggerja (npr. `/2020/06/....html`) preusmeri na nove albume.
- `prenesi-slike.py` – prenese fotografije z Bloggerja k tebi (glej spodaj).
- `CNAME` – domena za GitHub Pages.

## Fotografije

Zdaj se fotografije nalagajo neposredno z Bloggerjevih strežnikov. Delujejo, dokler blog na Bloggerju obstaja.
**Bloga ne briši**, dokler slik ne preneseš:

    python prenesi-slike.py

Skripta shrani vse v `slike/` in v `albums.js` zamenja povezave z lokalnimi. Skupaj je okoli 1.400 slik,
zato prenos traja nekaj minut in zasede več sto MB.

## Nov album

V `albums.js` dodaj nov zapis na začetek seznama, fotografije pa kot `["slike/ime-albuma/01.jpg", 1600, 1069]`
(pot, širina, višina).

## Objava na GitHub Pages

1. Nov repozitorij `slikajzmano`, naloži vse datoteke.
2. Settings → Pages → Branch: `main`, mapa `/ (root)`.
3. Custom domain: `slikajzmano.si`, nato vklopi Enforce HTTPS.

## DNS pri registrarju (slikajzmano.si)

Najprej izbriši obstoječe A in CNAME zapise za `@` in `www`, nato dodaj:

| Tip | Ime | Vrednost |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | graicevic123.github.io |
