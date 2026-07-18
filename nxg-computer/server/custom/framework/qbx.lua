--[[
  Qbox (qbx_core) server bridge
]]

if NXG.FW.name ~= 'qbx' then return end

local resource = NXG.FrameworkResource('qbx') or 'qbx_core'

CreateThread(function()
    local timeout = GetGameTimer() + 15000
    while GetResourceState(resource) ~= 'started' and GetGameTimer() < timeout do
        Wait(200)
    end
    NXG.FW.ready = true
    NXG.Debug('Qbox server ready')
end)

local function player(src)
    local ok, p = pcall(function()
        return exports[resource]:GetPlayer(src)
    end)
    if ok then return p end
    return nil
end

function NXG.FW.GetIdentifier(src)
    local prefer = Config.FrameworkOptions and Config.FrameworkOptions.identifier
    local p = player(src)
    if p and p.PlayerData then
        if prefer == 'license' or prefer == 'steam' or prefer == 'fivem' or prefer == 'discord' then
            return NXG.PickNativeIdentifier(src, prefer)
        end
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
    if p and p.Functions and p.Functions.GetItemByName then
        local it = p.Functions.GetItemByName(item)
        return it ~= nil and (it.amount or it.count or 0) > 0
    end
    return false
end

function NXG.FW.Notify(src, msg, nType)
    TriggerClientEvent('ox_lib:notify', src, {
        description = msg,
        type = nType == 'error' and 'error' or (nType == 'success' and 'success' or 'inform'),
    })
end

function NXG.FW.RegisterUsableItem(item, cb)
    CreateThread(function()
        local timeout = GetGameTimer() + 15000
        while GetResourceState(resource) ~= 'started' and GetGameTimer() < timeout do
            Wait(200)
        end
        local ok = pcall(function()
            exports[resource]:CreateUseableItem(item, function(source)
                cb(source)
            end)
        end)
        if ok then
            NXG.Debug(('Qbox usable item: %s'):format(item))
        else
            -- ox_inventory item client export fallback documented in README
            NXG.Debug(('Qbox CreateUseableItem failed for %s — use ox_inventory item export'):format(item))
        end
    end)
end
