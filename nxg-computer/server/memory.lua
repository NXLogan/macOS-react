-- Server-side profile persistence (oxmysql optional, JSON file fallback)

local RESOURCE = GetCurrentResourceName()
local DATA_FILE = 'data/profiles.json'

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

local function getIdentifier(src)
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        if id:find('license:') == 1 then
            return id
        end
    end
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        if id:find('fivem:') == 1 or id:find('steam:') == 1 then
            return id
        end
    end
    return ('src:%s'):format(src)
end

local function getPlayerName(src)
    return GetPlayerName(src) or 'NXG User'
end

local function hasOxMysql()
    return GetResourceState('oxmysql') == 'started'
end

local function dbLoad(computerId, identifier)
    if not hasOxMysql() then return nil end
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
    if ok then return profile end
    return nil
end

local function dbSave(computerId, identifier, username, profile)
    if not hasOxMysql() then return false end
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

function NXG.LoadProfile(computerId, identifier)
    local profile = dbLoad(computerId, identifier)
    if profile then return profile end
    return fileLoad(computerId, identifier)
end

function NXG.SaveProfile(computerId, identifier, username, profile)
    dbSave(computerId, identifier, username, profile)
    fileSave(computerId, identifier, profile)
    return true
end

NXG.GetIdentifier = getIdentifier
NXG.GetPlayerName = getPlayerName

RegisterNetEvent('nxg-computer:server:loadProfile', function(computerId)
    local src = source
    local identifier = getIdentifier(src)
    local username = getPlayerName(src)
    local cid = computerId or 'default'
    local profile = NXG.LoadProfile(cid, identifier)
    TriggerClientEvent('nxg-computer:client:profile', src, {
        computerId = cid,
        userId = identifier,
        userName = username,
        profile = profile,
    })
end)

RegisterNetEvent('nxg-computer:server:saveProfile', function(payload)
    local src = source
    if type(payload) ~= 'table' or type(payload.profile) ~= 'table' then return end
    local identifier = getIdentifier(src)
    local computerId = payload.profile.computerId or payload.computerId or 'default'
    local username = (payload.profile.user and payload.profile.user.name) or getPlayerName(src)
    payload.profile.computerId = computerId
    payload.profile.userId = identifier
    NXG.SaveProfile(computerId, identifier, username, payload.profile)
end)

NXG.Debug('Memory server ready (oxmysql=' .. tostring(hasOxMysql()) .. ')')
