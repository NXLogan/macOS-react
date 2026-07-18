# NXGos Computer

Système PC immersif pour FiveM (GTA RP). Front React/TypeScript + ressource Lua plug & play.

OS : **NXGos** · Version **1.0.0**

## Installation rapide

1. Place le dossier `nxg-computer` dans tes `resources`.
2. Build le NUI (une fois) :

```bash
cd nxg-computer/ui
npm install
npm run build
```

3. *(Optionnel)* Importe [`sql/nxg-computer.sql`](sql/nxg-computer.sql) si tu utilises **oxmysql**. Sinon les profils sont sauvés dans `data/profiles.json`.
4. Dans `server.cfg` :

```cfg
ensure oxmysql          # optionnel
ensure ox_target        # optionnel (sinon zones E)
ensure nxg-computer
```

5. Redémarre / `ensure nxg-computer`.

## Ouvrir le PC

| Méthode | Config |
|---------|--------|
| Commande | `/computer` ou `/computer bureau-pd` (`Config.OpenCommand`) |
| Keybind | `Config.OpenKey = 'F5'` |
| Target | `ox_target` / `qb-target` via [`config/computers.lua`](config/computers.lua) |
| Zone + E | Fallback automatique si pas de target |
| Item | `Config.Item = 'laptop'` (+ item inventaire) |
| Export client | `exports['nxg-computer']:OpenComputer('bureau-pd')` |
| Export serveur | `exports['nxg-computer']:OpenComputer(source, 'bureau-pd')` |

### Exemple `Config.Computers`

```lua
Config.Computers = {
  {
    id = 'bureau-pd',
    label = 'Ordinateur PD',
    coords = vec3(441.18, -978.17, 30.69),
    distance = 1.5,
    jobs = { 'police' },
  },
}
```

### Exports client

```lua
exports['nxg-computer']:OpenComputer(computerId?, opts?)
exports['nxg-computer']:CloseComputer()
exports['nxg-computer']:ToggleComputer(computerId?)
exports['nxg-computer']:IsComputerOpen()
exports['nxg-computer']:GetComputerId()
```

### Exports serveur

```lua
exports['nxg-computer']:OpenComputer(src, computerId?)
exports['nxg-computer']:CloseComputer(src)
exports['nxg-computer']:GetProfile(computerId, identifier)
exports['nxg-computer']:SaveProfile(computerId, identifier, username, profile)
exports['nxg-computer']:CanUseComputer(src, computerId)
```

## Langues (UI)

Paramètres → Réseau → **Langue** : Français, English, العربية (RTL), Русский.

Les menus, apps, écran de verrouillage, App Store et notifications Lua suivent la langue (`Config.Locale` côté FiveM pour les notifs jeu).

| Valeur | Description |
|--------|-------------|
| `'auto'` | Qbox → QBCore → ESX → Standalone |
| `'standalone'` | License FiveM, pas de jobs |
| `'esx'` | ESX moderne (export) |
| `'esx_legacy'` | ESX Legacy (event `esx:getSharedObject`) |
| `'qb'` / `'qbcore'` | QB-Core |
| `'qbx'` / `'qbox'` | Qbox |

Options avancées : `Config.FrameworkOptions` (noms de ressources, identifier, notify, inventaire ox/qs/codem).

Notify, job, gang, identifier et items passent par le bridge `NXG.FW`.

## Structure

```
nxg-computer/
├── fxmanifest.lua
├── config/           # config.lua, apps.lua, computers.lua, locales/
├── client/           # main, anim, interaction + framework bridges
├── server/           # memory, permissions + framework bridges
├── shared/
├── sql/
├── data/profiles.json
└── ui/               # React NUI → build/ pour FiveM
```

## Apps disponibles

| Id | Nom |
|----|-----|
| `fichiers` | Fichiers |
| `parametres` | Paramètres |
| `corbeille` | Corbeille |
| `appstore` | App Store |
| `calculator` | Calculatrice |
| `notes` | Notes |
| `photos` | Photos |
| `web` | Web |
| `musique` | Musique |
| `terminal` | Terminal |
| `plans` | Plans |
| `calendrier` | Calendrier |
| `mail` | Mail |

## Dev UI (localhost)

```bash
cd nxg-computer/ui
npm install
npm start
```

En jeu : Escape ferme les menus puis le PC (`computer:close`). Veille → extinction selon Paramètres.

## Config utile

Voir [`config/config.lua`](config/config.lua) :

- `Config.Anim` / `Config.Prop` — animation + laptop
- `Config.Checks` — mort / menottes / distance
- `Config.Memory` — taille max profil, auto SQL
- `Config.AdminAce` — ACE pour PCs `requireAce = true`
