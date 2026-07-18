--[[
  Server-side profile persistence (oxmysql optional, JSON file fallback)
]]

local RESOURCE = GetCurrentResourceName()
local DATA_FILE = 'data/profiles.json'
local tableReady = false

local function loadFileStore()
    local raw = LoadResourceFile(RESOURCE, DATA_FILE)
    if not raw or raw == '' then
        return {}
    end
    local ok, data = pcall(json.decode, raw)
    if ok and type(data) == 'table' then
        return data
    end
    return {}
end

local function saveFileStore(store)
    SaveResourceFile(RESOURCE, DATA_FILE, json.encode(store), -1)
end

local function profileKey(computerId, identifier)
    return ('%s::%s'):format(computerId or 'default', identifier or 'unknown')
end

local function hasOxMysql()
    return GetResourceState('oxmysql') == 'started'
end

local function ensureTable()
    if tableReady or not hasOxMysql() then return end
    local mem = Config.Memory or {}
    if mem.autoCreateTable == false then
        tableReady = true
        return
    end
    exports.oxmysql:execute([[
        CREATE TABLE IF NOT EXISTS `nxg_computer_profiles` (
          `id` INT NOT NULL AUTO_INCREMENT,
          `computer_id` VARCHAR(64) NOT NULL,
          `identifier` VARCHAR(64) NOT NULL,
          `username` VARCHAR(64) NOT NULL DEFAULT 'NXG User',
          `profile` LONGTEXT NOT NULL,
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `pc_user` (`computer_id`, `identifier`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ]])
    tableReady = true
    NXG.Debug('SQL table ensured')
end

local function dbLoad(computerId, identifier)
    if not hasOxMysql() then return nil end
    ensureTable()
    local p = promise.new()
    exports.oxmysql:execute(
        'SELECT profile, username FROM nxg_computer_profiles WHERE computer_id = ? AND identifier = ? LIMIT 1',
        { computerId, identifier },
        function(result)
            p:resolve(result and result[1] or nil)
        end
    )
    local row = Citizen.Await(p)
    if not row or not row.profile then return nil end
    local ok, profile = pcall(json.decode, row.profile)
    if ok and type(profile) == 'table' then
        return profile
    end
    return nil
end

local function dbSave(computerId, identifier, username, profile)
    if not hasOxMysql() then return false end
    ensureTable()
    exports.oxmysql:execute(
        [[
        INSERT INTO nxg_computer_profiles (computer_id, identifier, username, profile)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE username = VALUES(username), profile = VALUES(profile), updated_at = CURRENT_TIMESTAMP
        ]],
        { computerId, identifier, username, json.encode(profile) }
    )
    return true
end

local function fileLoad(computerId, identifier)
    local store = loadFileStore()
    return store[profileKey(computerId, identifier)]
end

local function fileSave(computerId, identifier, profile)
    local store = loadFileStore()
    store[profileKey(computerId, identifier)] = profile
    saveFileStore(store)
end

---@param profile table
---@return boolean ok
---@return string|nil reason
local function validateProfile(profile)
    if type(profile) ~= 'table' then
        return false, 'invalid'
    end
    local encoded = json.encode(profile)
    if not encoded then
        return false, 'encode'
    end
    local maxBytes = (Config.Memory and Config.Memory.maxProfileBytes) or 512000
    if #encoded > maxBytes then
        return false, 'too_large'
    end
    return true, nil
end

function NXG.LoadProfile(computerId, identifier)
    local profile = dbLoad(computerId, identifier)
    if profile then return profile end
    return fileLoad(computerId, identifier)
end

function NXG.SaveProfile(computerId, identifier, username, profile)
    local ok = validateProfile(profile)
    if not ok then
        return false
    end
    dbSave(computerId, identifier, username, profile)
    fileSave(computerId, identifier, profile)
    return true
end

-- Prefer framework identifier / name
local function getIdentifier(src)
    return NXG.FW.GetIdentifier(src)
end

local function getPlayerName(src)
    return NXG.FW.GetPlayerName(src)
end

NXG.GetIdentifier = getIdentifier
NXG.GetPlayerName = getPlayerName

RegisterNetEvent('nxg-computer:server:loadProfile', function(computerId)
    local src = source
    local identifier = getIdentifier(src)
    local username = getPlayerName(src)
    local cid = computerId or Config.DefaultComputerId or 'default'

    local allowed, reason = NXG.CanUseComputer(src, cid)
    if not allowed then
        TriggerClientEvent('nxg-computer:client:notify', src, _L(reason or 'no_permission'), 'error')
        return
    end

    local profile = NXG.LoadProfile(cid, identifier)

    -- Always send payload; profile may be nil (first use → UI builds default)
    TriggerClientEvent('nxg-computer:client:profile', src, {
        computerId = cid,
        userId = identifier,
        userName = username,
        profile = profile, -- nil = empty
    })
end)

RegisterNetEvent('nxg-computer:server:saveProfile', function(payload)
    local src = source
    if type(payload) ~= 'table' or type(payload.profile) ~= 'table' then return end

    local identifier = getIdentifier(src)
    local computerId = payload.profile.computerId or payload.computerId or Config.DefaultComputerId or 'default'

    local allowed = NXG.CanUseComputer(src, computerId)
    if not allowed then return end

    local okSize = validateProfile(payload.profile)
    if not okSize then
        NXG.Debug(('Save rejected for %s (size/invalid)'):format(identifier))
        TriggerClientEvent('nxg-computer:client:notify', src, _L('profile_error'), 'error')
        return
    end

    local username = (payload.profile.user and payload.profile.user.name) or getPlayerName(src)
    payload.profile.computerId = computerId

    if not Config.Memory or Config.Memory.requireOwnership ~= false then
        payload.profile.userId = identifier
    end

    local saved = NXG.SaveProfile(computerId, identifier, username, payload.profile)
    if not saved then
        TriggerClientEvent('nxg-computer:client:notify', src, _L('profile_error'), 'error')
    end
end)

-- Server exports for other resources
exports('GetProfile', function(computerId, identifier)
    return NXG.LoadProfile(computerId, identifier)
end)

exports('SaveProfile', function(computerId, identifier, username, profile)
    return NXG.SaveProfile(computerId, identifier, username, profile)
end)

exports('CanUseComputer', function(src, computerId)
    return NXG.CanUseComputer(src, computerId)
end)

CreateThread(function()
    Wait(1000)
    ensureTable()
end)

NXG.Debug('Memory server ready (oxmysql=' .. tostring(hasOxMysql()) .. ')')
