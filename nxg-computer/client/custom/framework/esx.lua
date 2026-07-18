--[[
  ESX + ESX Legacy client bridge
]]

if not NXG.IsEsxFamily(NXG.FW.name) then return end

local ESX = nil
local resource = NXG.FrameworkResource('esx') or 'es_extended'

--- Resolve ESX shared object (modern export + legacy event)
local function resolveEsx(cb)
    -- Modern / ESX 1.9+
    local ok, obj = pcall(function()
        return exports[resource]:getSharedObject()
    end)
    if ok and obj then
        cb(obj, 'export')
        return
    end

    -- Legacy event (ESX 1.1 / 1.2 / old forks)
    local done = false
    TriggerEvent('esx:getSharedObject', function(obj)
        if done then return end
        if obj then
            done = true
            cb(obj, 'event')
        end
    end)

    -- Some forks use this export name
    local ok2, obj2 = pcall(function()
        return exports[resource]:getSharedObject()
    end)
    if not done and ok2 and obj2 then
        done = true
        cb(obj2, 'export')
    end
end

CreateThread(function()
    local timeout = GetGameTimer() + 30000
    while not ESX and GetGameTimer() < timeout do
        resolveEsx(function(obj, via)
            ESX = obj
            NXG.FW._object = obj
            -- If user forced esx but only legacy works (or reverse), keep name as configured
            if NXG.FW.name == 'esx' and via == 'event' then
                NXG.Debug('ESX loaded via legacy event (getSharedObject)')
            elseif NXG.FW.name == 'esx_legacy' and via == 'export' then
                NXG.Debug('ESX Legacy config but export available — using export')
            end
            NXG.FW.ready = true
            NXG.Debug(('ESX client ready (%s via %s)'):format(NXG.FW.name, via))
        end)
        if ESX then break end
        Wait(200)
    end
    if not ESX then
        NXG.Debug('WARNING: ESX object not found — falling back to native checks')
        NXG.FW.ready = true
    end
end)

-- Auto-promote: if Config was 'esx' but only event works, already handled.
-- If Config was 'auto' and we detected 'esx', legacy still works via same bridge.

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
    if mode ~= 'gta' and ESX then
        if ESX.ShowNotification then
            ESX.ShowNotification(msg)
            return
        end
        if ESX.ShowAdvancedNotification then
            ESX.ShowAdvancedNotification('NXGos', '', msg, 'CHAR_DEFAULT', 1)
            return
        end
    end
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName(tostring(msg))
    EndTextCommandThefeedPostTicker(false, true)
end

function NXG.FW.GetJob()
    if not ESX or not ESX.GetPlayerData then return nil end
    local data = ESX.GetPlayerData()
    return data and data.job and data.job.name or nil
end

function NXG.FW.GetGang()
    -- Some ESX forks expose gang
    if not ESX or not ESX.GetPlayerData then return nil end
    local data = ESX.GetPlayerData()
    if data and data.gang and data.gang.name then
        return data.gang.name
    end
    return nil
end

function NXG.FW.GetPlayerName()
    if ESX and ESX.GetPlayerData then
        local data = ESX.GetPlayerData()
        if data then
            if data.firstName or data.lastName then
                return ((data.firstName or '') .. ' ' .. (data.lastName or '')):gsub('^%s+', ''):gsub('%s+$', '')
            end
            if data.name and data.name ~= '' then
                return data.name
            end
        end
    end
    return GetPlayerName(PlayerId()) or 'NXG User'
end

function NXG.FW.IsDead()
    if ESX and ESX.GetPlayerData then
        local data = ESX.GetPlayerData()
        if data then
            if data.dead == true then return true end
            if data.isDead == true then return true end
        end
    end
    -- esx_ambulancejob / wasabi style
    if LocalPlayer and LocalPlayer.state and LocalPlayer.state.isDead then
        return true
    end
    local ped = PlayerPedId()
    return IsEntityDead(ped) or IsPedDeadOrDying(ped, true)
end

function NXG.FW.IsCuffed()
    if ESX and ESX.GetPlayerData then
        local data = ESX.GetPlayerData()
        if data and (data.cuffed or data.isCuffed) then
            return true
        end
    end
    return IsPedCuffed(PlayerPedId())
end
