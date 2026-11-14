# Kaffefilm på forsiden

`public/video/coffee-origins.mp4` er en lokal H.264-film på højst 10 sekunder uden lyd.
Filmen er klippet fra to dokumentarfilm udgivet af Finca Project i 2007 under
CC BY 2.0. Kilder, licens og ændringer står i den offentlige
`public/video/coffee-origins.CREDITS.txt` og på `/information/filmen`, som er
linket fra forsiden. Filmene handler om kaffe i Costa Rica og er illustrative
arkivoptagelser. De må ikke præsenteres som Ristet Aalborgs egne leverandører.

Originalernes metadata:

- https://archive.org/metadata/Fincaproject-FairTradeCoffeePart1TheHarvest229
- https://archive.org/metadata/Fincaproject-FairTradeCoffeePart2TheBeneficio640

Originale filer:

- https://archive.org/download/Fincaproject-FairTradeCoffeePart1TheHarvest229/Fincaproject-FairTradeCoffeePart1TheHarvest229.mov
- https://archive.org/download/Fincaproject-FairTradeCoffeePart2TheBeneficio640/Fincaproject-FairTradeCoffeePart2TheBeneficio640.mov

Eksportér igen med `node scripts/prepare-origin-film.mjs <høst.mov> <forarbejdning.mov>`.
Scriptet bruger `ffmpeg-static`, som kun er en udviklingsafhængighed. Originalerne
er ikke med i projektet. De er 320 × 240; eksporten skalerer og beskærer materialet,
men skaber ikke nye detaljer. Udskift gerne med egne optagelser i højere opløsning,
når de findes. Bevar krediteringen, så længe uddrag fra disse film bruges.

Forsidens høstfoto og grundlæggerportræt er leveret af ejeren og optimeret til WebP
uden EXIF-oplysninger. De eksisterende produktlabels og tidslinjefotos er bevaret.
