local isOpen = false
local currentComputerId = 'default'

local function setNuiFocus(state)
    SetNuiFocus(state, state)
    SetNuiFocusKeepInput(false)
end

local function resolveComputerId(explicit)
    if type(explicit) == 'string' and explicit ~= '' then
        return explicit
    end
    return (Config and Config.DefaultComputerId) or 'default'
end

local function openComputer(computerId)
    if isOpen then return end
    isOpen = true
    currentComputerId = resolveComputerId(computerId)
    setNuiFocus(true)

    TriggerServerEvent('nxg-computer:server:loadProfile', currentComputerId)

    SendNUIMessage({
        action = 'computer:open',
        data = {
            computerId = currentComputerId,
        },
    })
    NXG.Debug(('Computer opened (%s)'):format(currentComputerId))
end

local function closeComputer()
    if not isOpen then return end
    isOpen = false
    setNuiFocus(false)
    SendNUIMessage({ action = 'computer:close', data = {} })
    NXG.Debug('Computer closed')
end

RegisterCommand(Config.OpenCommand or 'computer', function(_, args)
    if isOpen then
        closeComputer()
    else
        openComputer(args[1])
    end
end, false)

if Config.CloseWithEscape then
    RegisterNUICallback('computer:close', function(_, cb)
        closeComputer()
        cb({ ok = true })
    end)
end

RegisterNUICallback('computer:ready', function(_, cb)
    cb({
        ok = true,
        resource = GetCurrentResourceName(),
        computerId = currentComputerId,
    })
end)

RegisterNUICallback('memory:load', function(data, cb)
    local computerId = (data and data.computerId) or currentComputerId or 'default'
    TriggerServerEvent('nxg-computer:server:loadProfile', computerId)
    -- Profile is pushed async via memory:session / memory:profile
    cb({ ok = true, pending = true })
end)

RegisterNUICallback('memory:save', function(data, cb)
    if type(data) == 'table' and data.profile then
        TriggerServerEvent('nxg-computer:server:saveProfile', data)
    end
    cb({ ok = true })
end)

RegisterNetEvent('nxg-computer:client:profile', function(payload)
    if not payload then return end
    SendNUIMessage({
        action = 'memory:session',
        data = {
            computerId = payload.computerId,
            userId = payload.userId,
            userName = payload.userName,
        },
    })
    if payload.profile then
        SendNUIMessage({
            action = 'memory:profile',
            data = {
                computerId = payload.computerId,
                userId = payload.userId,
                userName = payload.userName,
                profile = payload.profile,
            },
        })
    end
end)

exports('OpenComputer', openComputer)
exports('CloseComputer', closeComputer)
exports('IsComputerOpen', function()
    return isOpen
end)
exports('GetComputerId', function()
    return currentComputerId
end)
