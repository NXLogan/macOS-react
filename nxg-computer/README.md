# NXG Computer

Système PC immersif pour FiveM (GTA RP). Front React + ressource Lua (structure type LB Phone).

## Structure

```
nxg-computer/
├── fxmanifest.lua
├── config/                 # config.lua, apps.lua, locales/
├── client/                 # NUI focus, open/close, apps/, custom/framework/
├── server/                 # logique serveur, apps/, custom/framework/
├── shared/                 # helpers partagés
├── sql/                    # schéma DB
├── webhooks/               # logs externes (plus tard)
└── ui/                     # React (NUI)
    └── src/
        ├── apps/           # une app = un dossier (finder, photos, …)
        ├── desktop/        # shell OS (bureau, dock, menubar, boot…)
        ├── components/     # UI partagée
        ├── store/          # state
        ├── lib/nui/        # fetchNui / onNuiEvent
        └── assets/
```

## Dev UI (localhost)

```bash
cd nxg-computer/ui
npm install
npm start
```

Build NUI pour FiveM :

```bash
cd nxg-computer/ui
npm run build
```

Puis `ensure nxg-computer` dans le `server.cfg`.

## Commande temporaire

`/computer` — ouvre / ferme le NUI (voir `config/config.lua`).
