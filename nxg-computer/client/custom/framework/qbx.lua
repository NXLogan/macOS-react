--[[
  Qbox (qbx_core) client bridge
]]

if NXG.FW.name ~= 'qbx' then return end

local resource = NXG.FrameworkResource('qbx') or 'qbx_core'

CreateThread(function()
    local timeout = GetGameTimer() + 15000
    while GetResourceState(resource) ~= 'started' and GetGameTimer() < timeout do
        Wait(200)
    end
    NXG.FW.ready = true
    NXG.Debug('Qbox client ready')
end)

local function playerData()
    local ok, data = pcall(function()
        return exports[resource]:GetPlayerData()
    end)
    if ok then return data end
    return nil
end

function NXG.FW.Notify(msg, nType)
    local mode = (Config.FrameworkOptions and Config.FrameworkOptions.notify) or 'auto'
    if mode == 'ox_lib' or mode == 'auto' then
        local ok = pcall(function()
            exports.ox_lib:notify({
                description = msg,
                type = nType == 'error' and 'error' or (nType == 'success' and 'success' or 'inform'),
            })
        end)
        if ok then return end
    end
    pcall(function()
        exports[resource]:Notify(msg, nType or 'inform')
    end)
end

function NXG.FW.GetJob()
    local data = playerData()
    return data and data.job and data.job.name or nil
end

function NXG.FW.GetGang()
    local data = playerData()
    return data and data.gang and data.gang.name or nil
end

function NXG.FW.GetPlayerName()
    local data = playerData()
    if data and data.charinfo and data.charinfo.firstname then
        return (data.charinfo.firstname or '') .. ' ' .. (data.charinfo.lastname or '')
    end
    return GetPlayerName(PlayerId()) or 'NXG User'
end

function NXG.FW.IsDead()
    local data = playerData()
    if data and data.metadata then
        if data.metadata.isdead or data.metadata.inlaststand then
            return true
        end
    end
    local ped = PlayerPedId()
    return IsEntityDead(ped) or IsPedDeadOrDying(ped, true)
end

function NXG.FW.IsCuffed()
    local data = playerData()
    if data and data.metadata and data.metadata.ishandcuffed then
        return true
    end
    return IsPedCuffed(PlayerPedId())
end
