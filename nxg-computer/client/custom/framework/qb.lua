--[[
  QB-Core client bridge
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
            NXG.Debug('QB-Core client ready')
            break
        end
        Wait(200)
    end
    if not QBCore then
        NXG.Debug('WARNING: QB-Core object not found')
        NXG.FW.ready = true
    end
end)

function NXG.FW.Notify(msg, nType)
    local mode = (Config.FrameworkOptions and Config.FrameworkOptions.notify) or 'auto'
    if mode == 'ox_lib' or (mode == 'auto' and GetResourceState('ox_lib') == 'started') then
        local ok = pcall(function()
            exports.ox_lib:notify({
                description = msg,
                type = nType == 'error' and 'error' or (nType == 'success' and 'success' or 'inform'),
            })
        end)
        if ok then return end
    end
    if mode ~= 'gta' and QBCore and QBCore.Functions and QBCore.Functions.Notify then
        local t = nType or 'primary'
        if t == 'inform' then t = 'primary' end
        QBCore.Functions.Notify(msg, t)
        return
    end
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName(tostring(msg))
    EndTextCommandThefeedPostTicker(false, true)
end

function NXG.FW.GetJob()
    if not QBCore then return nil end
    local data = QBCore.Functions.GetPlayerData()
    return data and data.job and data.job.name or nil
end

function NXG.FW.GetGang()
    if not QBCore then return nil end
    local data = QBCore.Functions.GetPlayerData()
    return data and data.gang and data.gang.name or nil
end

function NXG.FW.GetPlayerName()
    if QBCore then
        local data = QBCore.Functions.GetPlayerData()
        local char = data and data.charinfo
        if char and char.firstname then
            return (char.firstname or '') .. ' ' .. (char.lastname or '')
        end
    end
    return GetPlayerName(PlayerId()) or 'NXG User'
end

function NXG.FW.IsDead()
    if QBCore then
        local data = QBCore.Functions.GetPlayerData()
        local meta = data and data.metadata
        if meta and (meta.isdead or meta.inlaststand) then
            return true
        end
    end
    local ped = PlayerPedId()
    return IsEntityDead(ped) or IsPedDeadOrDying(ped, true)
end

function NXG.FW.IsCuffed()
    if QBCore then
        local data = QBCore.Functions.GetPlayerData()
        if data and data.metadata and data.metadata.ishandcuffed then
            return true
        end
    end
    return IsPedCuffed(PlayerPedId())
end
