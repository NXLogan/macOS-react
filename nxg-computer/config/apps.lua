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
    corbeille = {
        name = 'Corbeille',
        icon = 'corbeille',
        default = true,
        removable = false,
    },
    appstore = {
        name = 'App Store',
        icon = 'appstore',
        default = true,
        removable = false,
    },
    calculator = {
        name = 'Calculatrice',
        icon = 'calculator',
        default = true,
        removable = true,
    },
    notes = {
        name = 'Notes',
        icon = 'notes',
        default = true,
        removable = true,
    },
    photos = {
        name = 'Photos',
        icon = 'photos',
        default = true,
        removable = true,
    },
    web = {
        name = 'Web',
        icon = 'web',
        default = true,
        removable = true,
    },
    musique = {
        name = 'Musique',
        icon = 'musique',
        default = true,
        removable = true,
    },
    terminal = {
        name = 'Terminal',
        icon = 'terminal',
        default = true,
        removable = true,
    },
    plans = {
        name = 'Plans',
        icon = 'plans',
        default = true,
        removable = true,
    },
    calendrier = {
        name = 'Calendrier',
        icon = 'calendar',
        default = true,
        removable = true,
    },
    mail = {
        name = 'Mail',
        icon = 'mail',
        default = true,
        removable = true,
    },
}

Config.CustomApps = {}
