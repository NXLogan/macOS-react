--[[
  QB-Core server bridge
]]

if NXG.FW.name ~= 'qb' then return end

local QBCore = nil
local resource = NXG.FrameworkResource('qb') or 'qb-core'

CreateThread(function()
    local timeout = GetGameTimer() + 30000
    while not QBCore and GetGameTimer() < timeout do
        local ok, obj = pcall(function()
            return exports[resource]:GetCoreObject()
        end)
        if ok and obj then
            QBCore = obj
            NXG.FW._object = obj
            NXG.FW.ready = true
            NXG.Debug('QB-Core server ready')
            break
        end
        Wait(200)
    end
    if not QBCore then
        NXG.Debug('WARNING: QB-Core server object not found')
        NXG.FW.ready = true
    end
end)

local function player(src)
    if not QBCore then return nil end
    return QBCore.Functions.GetPlayer(src)
end

function NXG.FW.GetIdentifier(src)
    local prefer = Config.FrameworkOptions and Config.FrameworkOptions.identifier
    local p = player(src)
    if p and p.PlayerData then
        if prefer == 'license' or prefer == 'steam' or prefer == 'fivem' or prefer == 'discord' then
            return NXG.PickNativeIdentifier(src, prefer)
        end
        -- default / citizenid
        return p.PlayerData.citizenid
            or p.PlayerData.license
            or NXG.PickNativeIdentifier(src, 'license')
    end
    return NXG.PickNativeIdentifier(src, prefer)
end

function NXG.FW.GetPlayerName(src)
    local p = player(src)
    local char = p and p.PlayerData and p.PlayerData.charinfo
    if char and char.firstname then
        return (char.firstname or '') .. ' ' .. (char.lastname or '')
    end
    return GetPlayerName(src) or 'NXG User'
end

function NXG.FW.GetJob(src)
    local p = player(src)
    return p and p.PlayerData and p.PlayerData.job and p.PlayerData.job.name or nil
end

function NXG.FW.GetGang(src)
    local p = player(src)
    return p and p.PlayerData and p.PlayerData.gang and p.PlayerData.gang.name or nil
end

function NXG.FW.HasItemFramework(src, item)
    local p = player(src)
    if not p then return false end
    if p.Functions and p.Functions.GetItemByName then
        local it = p.Functions.GetItemByName(item)
        return it ~= nil and (it.amount or it.count or 0) > 0
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
    local t = nType or 'primary'
    if t == 'inform' then t = 'primary' end
    TriggerClientEvent('QBCore:Notify', src, msg, t)
end

function NXG.FW.RegisterUsableItem(item, cb)
    CreateThread(function()
        while not QBCore do Wait(100) end
        if QBCore.Functions and QBCore.Functions.CreateUseableItem then
            QBCore.Functions.CreateUseableItem(item, function(source)
                cb(source)
            end)
            NXG.Debug(('QB usable item: %s'):format(item))
        end
    end)
end
