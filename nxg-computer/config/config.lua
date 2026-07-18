--[[
==============================================================================
  NXGos Computer — Configuration
  Compatible : Standalone | ESX Legacy | ESX | QBCore | Qbox
==============================================================================
]]

Config = Config or {}

--==============================================================================
-- GENERAL
--==============================================================================

Config.Debug = false
Config.Locale = 'fr' -- 'fr' | 'en' | 'ar' | 'ru'

--==============================================================================
-- FRAMEWORK
--==============================================================================
--[[
  'auto'         → détecte Qbox → QBCore → ESX → Standalone
  'standalone'   → license FiveM, pas de jobs / inventaire
  'esx'          → ESX (export moderne getSharedObject)
  'esx_legacy'   → ESX Legacy (event esx:getSharedObject)
  'qb' / 'qbcore'→ QB-Core
  'qbx' / 'qbox' → Qbox (qbx_core)
]]
Config.Framework = 'auto'

Config.FrameworkOptions = {
    -- Noms de ressources (si renommés sur ton serveur)
    esxResource = 'es_extended',
    qbResource = 'qb-core',
    qbxResource = 'qbx_core',

    -- Identifier pour les profils (server)
    -- 'license' | 'steam' | 'fivem' | 'discord' | 'citizenid' (QB/Qbox)
    -- nil = auto (citizenid sur QB/Qbox, sinon license)
    identifier = nil,

    -- Notifications : 'auto' | 'framework' | 'ox_lib' | 'gta'
    notify = 'auto',

    -- Inventaire item : 'auto' | 'framework' | 'ox_inventory' | 'qs-inventory' | 'codem-inventory'
    inventory = 'auto',
}

--==============================================================================
-- OPEN / CLOSE
--==============================================================================

Config.OpenCommand = 'computer' -- /computer [computerId?]  — nil pour désactiver
Config.OpenKey = nil            -- ex. 'F5'  — nil pour désactiver
Config.CloseWithEscape = true   -- Escape UI → ferme le PC
Config.DefaultComputerId = 'default'

--==============================================================================
-- ITEM (ordinateur portable)
--==============================================================================

Config.Item = nil               -- ex. 'laptop' — nil = pas d'item
Config.ItemComputerId = nil     -- PC ouvert via l'item (défaut = DefaultComputerId)
Config.RequireItem = false      -- true = il faut l'item pour TOUT ouvrir

--==============================================================================
-- TARGET / ZONES  (voir aussi config/computers.lua)
--==============================================================================

Config.Target = {
    enabled = true,
    -- 'auto' | 'ox_target' | 'qb-target' | 'zones' (touche E uniquement)
    system = 'auto',
    icon = 'fas fa-laptop',
    distance = 1.8,
}

--==============================================================================
-- ANIMATION & PROP
--==============================================================================

Config.Anim = {
    enabled = true,
    dict = 'anim@heists@prison_heiststation@cop_reactions',
    clip = 'cop_b_idle',
    flag = 49,
}

Config.Prop = {
    enabled = false,
    model = `prop_laptop_01a`,
    bone = 57005, -- SKEL_R_Hand
    offset = vec3(0.15, 0.02, -0.03),
    rotation = vec3(-70.0, 0.0, 0.0),
}

--==============================================================================
-- SÉCURITÉ (avant ouverture)
--==============================================================================

Config.Checks = {
    dead = true,
    cuffed = true,
    maxDistance = 3.0, -- 0 = pas de check distance
}

-- ACE pour les PC avec requireAce = true dans Config.Computers
-- add_ace group.admin nxg-computer.admin allow
Config.AdminAce = 'nxg-computer.admin'

--==============================================================================
-- MÉMOIRE / PROFILS
--==============================================================================
--[[
  oxmysql démarré → table SQL (auto-créée si autoCreateTable)
  sinon → data/profiles.json
]]
Config.Memory = {
    maxProfileBytes = 512000,
    requireOwnership = true,
    autoCreateTable = true,
}
