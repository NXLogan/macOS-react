# NXGos Computer

Système PC immersif pour FiveM (GTA RP). Front React/TypeScript + ressource Lua.

OS : **NXGos**

## Structure

```
nxg-computer/
├── fxmanifest.lua
├── config/                 # config.lua, apps.lua, locales/
├── client/                 # NUI focus, open/close, mémoire
├── server/                 # profils (oxmysql / JSON)
├── shared/
├── sql/
├── data/profiles.json      # fallback fichier
└── ui/                     # React (NUI)
    └── src/
        ├── apps/           # fichiers, parametres, calculator
        ├── desktop/        # bureau, dock, menubar, boot…
        ├── store/          # state (useReducer)
        ├── lib/nui/        # fetchNui / lifecycle
        ├── lib/memory/     # sync profil PC
        └── assets/
```

## Apps disponibles

| Id | Nom |
|----|-----|
| `fichiers` | Fichiers |
| `parametres` | Paramètres |
| `calculator` | Calculatrice |

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

## Commandes / exports

- `/computer` — ouvre / ferme le NUI (`config/config.lua`)
- `exports['nxg-computer']:OpenComputer(computerId?)`
- `exports['nxg-computer']:CloseComputer()`
- Escape ferme les menus, puis le PC (callback `computer:close`)
