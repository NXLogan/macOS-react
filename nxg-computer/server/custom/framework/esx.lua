--[[
  ESX + ESX Legacy server bridge
]]

if not NXG.IsEsxFamily(NXG.FW.name) then return end

local ESX = nil
local resource = NXG.FrameworkResource('esx') or 'es_extended'

local function resolveEsx(cb)
    local ok, obj = pcall(function()
        return exports[resource]:getSharedObject()
    end)
    if ok and obj then
        cb(obj, 'export')
        return
    end

    TriggerEvent('esx:getSharedObject', function(obj)
        if obj then
            cb(obj, 'event')
        end
    end)
end

CreateThread(function()
    local timeout = GetGameTimer() + 30000
    while not ESX and GetGameTimer() < timeout do
        resolveEsx(function(obj, via)
            if ESX then return end
            ESX = obj
            NXG.FW._object = obj
            NXG.FW.ready = true
            NXG.Debug(('ESX server ready (%s via %s)'):format(NXG.FW.name, via))
        end)
        if ESX then break end
        Wait(200)
    end
    if not ESX then
        NXG.Debug('WARNING: ESX server object not found')
        NXG.FW.ready = true
    end
end)

local function xPlayer(src)
    if not ESX then return nil end
    return ESX.GetPlayerFromId(src)
end

function NXG.FW.GetIdentifier(src)
    local prefer = Config.FrameworkOptions and Config.FrameworkOptions.identifier
    if prefer == 'citizenid' then
        prefer = 'license'
    end

    local player = xPlayer(src)
    if player then
        if player.getIdentifier then
            local id = player.getIdentifier()
            if id and id ~= '' then return id end
        end
        if player.identifier and player.identifier ~= '' then
            return player.identifier
        end
    end
    return NXG.PickNativeIdentifier(src, prefer)
end

function NXG.FW.GetPlayerName(src)
    local player = xPlayer(src)
    if player then
        if player.getName then
            local n = player.getName()
            if n and n ~= '' then return n end
        end
        if player.name and player.name ~= '' then
            return player.name
        end
        if player.get and player.get('firstName') then
            return (player.get('firstName') or '') .. ' ' .. (player.get('lastName') or '')
        end
    end
    return GetPlayerName(src) or 'NXG User'
end

function NXG.FW.GetJob(src)
    local player = xPlayer(src)
    if player and player.job then
        return player.job.name
    end
    return nil
end

function NXG.FW.GetGang(src)
    local player = xPlayer(src)
    if player and player.gang and player.gang.name then
        return player.gang.name
    end
    return nil
end

function NXG.FW.HasItemFramework(src, item)
    local player = xPlayer(src)
    if not player then return false end

    if player.getInventoryItem then
        local inv = player.getInventoryItem(item)
        if inv then
            local count = inv.count or inv.amount or inv.quantity or 0
            return count > 0
        end
    end

    if player.hasItem then
        local ok, result = pcall(function()
            return player.hasItem(item)
        end)
        if ok and result then
            if type(result) == 'boolean' then return result end
            if type(result) == 'table' then
                return (result.count or result.amount or 0) > 0
            end
        end
    end

    return false
end

function NXG.FW.Notify(src, msg, nType)
    local mode = (Config.FrameworkOptions and Config.FrameworkOptions.notify) or 'auto'
    if mode == 'ox_lib' or (mode == 'auto' and GetResourceState('ox_lib') == 'started') then
        TriggerClientEvent('ox_lib:notify', src, {
            description = msg,
            type = nType == 'error' and 'error' or (nType == 'success' and 'success' or 'inform'),
        })
        return
    end
    TriggerClientEvent('esx:showNotification', src, msg)
end

function NXG.FW.RegisterUsableItem(item, cb)
    CreateThread(function()
        while not ESX do Wait(100) end
        if ESX.RegisterUsableItem then
            ESX.RegisterUsableItem(item, function(source)
                cb(source)
            end)
            NXG.Debug(('ESX usable item: %s'):format(item))
        else
            NXG.Debug('ESX.RegisterUsableItem missing')
        end
    end)
end
