Config = Config or {}

--[[
  Desktop apps registry (LB Phone–style).
  UI lives in ui/src/apps/<id>/ — keep in sync with APP_CATALOG / OPENABLE_APP_IDS.
]]
Config.Apps = {
    fichiers = {
        name = 'Fichiers',
        icon = 'fichiers',
        default = true,
        removable = false,
    },
    parametres = {
        name = 'Paramètres',
        icon = 'parametres',
        default = true,
        removable = false,
    },
    calculator = {
        name = 'Calculatrice',
        icon = 'calculator',
        default = true,
        removable = true,
    },
    corbeille = {
        name = 'Corbeille',
        icon = 'corbeille',
        default = true,
        removable = false,
    },
}

Config.CustomApps = {}
