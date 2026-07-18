--[[
  NXGos client core — NUI focus, open/close, memory callbacks, exports
]]

local isOpen = false
local opening = false
local currentComputerId = 'default'
local profileWaiters = {}
local canOpenWaiter = nil
local canOpenReqId = 0

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

---@param computerId string|nil
---@param coords vector3|nil
---@return boolean ok
---@return string|nil reasonKey
local function canOpenLocally(computerId, coords)
    if isOpen or opening then
        return false, 'busy'
    end

    local checks = Config.Checks or {}
    if checks.dead ~= false and NXG.FW.IsDead and NXG.FW.IsDead() then
        return false, 'dead'
    end
    if checks.cuffed ~= false and NXG.FW.IsCuffed and NXG.FW.IsCuffed() then
        return false, 'cuffed'
    end

    local maxDist = checks.maxDistance or 0
    if coords and maxDist > 0 then
        local ped = PlayerPedId()
        local pcoords = GetEntityCoords(ped)
        if #(pcoords - coords) > maxDist then
            return false, 'too_far'
        end
    end

    return true, nil
end

local function pushOpenMessage(computerId, userId, userName)
    SendNUIMessage({
        action = 'computer:open',
        data = {
            computerId = computerId,
            userId = userId,
            userName = userName,
        },
    })
end

local function requestCanOpen(computerId)
    canOpenReqId = canOpenReqId + 1
    local reqId = canOpenReqId
    local p = promise.new()
    canOpenWaiter = { id = reqId, promise = p }

    TriggerServerEvent('nxg-computer:server:canOpen', computerId, reqId)

    SetTimeout(4000, function()
        if canOpenWaiter and canOpenWaiter.id == reqId and p.state == 'pending' then
            NXG.Debug('canOpen timed out — allowing open')
            p:resolve({ ok = true, reqId = reqId })
        end
    end)

    return Citizen.Await(p)
end

---@param computerId string|nil
---@param opts table|nil { coords = vector3, skipPermission = boolean }
function NXG.OpenComputer(computerId, opts)
    opts = opts or {}
    local cid = resolveComputerId(computerId)

    local ok, reason = canOpenLocally(cid, opts.coords)
    if not ok then
        if NXG.FW.Notify then
            NXG.FW.Notify(_L(reason or 'unavailable'), 'error')
        end
        return false
    end

    opening = true

    local allowed = true
    local denyReason = 'no_permission'
    if not opts.skipPermission then
        local result = requestCanOpen(cid)
        if type(result) == 'table' then
            allowed = result.ok == true
            denyReason = result.reason or denyReason
        end
    end

    if not allowed then
        opening = false
        if NXG.FW.Notify then
            NXG.FW.Notify(_L(denyReason), 'error')
        end
        return false
    end

    isOpen = true
    opening = false
    currentComputerId = cid
    setNuiFocus(true)

    if NXG.Anim and NXG.Anim.Start then
        NXG.Anim.Start()
    end

    local userName = NXG.FW.GetPlayerName and NXG.FW.GetPlayerName() or GetPlayerName(PlayerId())
    pushOpenMessage(cid, nil, userName)

    TriggerServerEvent('nxg-computer:server:loadProfile', cid)
    NXG.Debug(('Computer opened (%s)'):format(cid))
    return true
end

function NXG.CloseComputer()
    if not isOpen then return false end
    isOpen = false
    opening = false
    setNuiFocus(false)

    if NXG.Anim and NXG.Anim.Stop then
        NXG.Anim.Stop()
    end

    SendNUIMessage({ action = 'computer:close', data = {} })
    NXG.Debug('Computer closed')
    return true
end

function NXG.ToggleComputer(computerId, opts)
    if isOpen then
        return NXG.CloseComputer()
    end
    return NXG.OpenComputer(computerId, opts)
end

function NXG.IsComputerOpen()
    return isOpen
end

function NXG.GetComputerId()
    return currentComputerId
end

-- Resolve profile waiters when server pushes profile
local function resolveProfileWaiters(payload)
    local cid = payload and payload.computerId
    if not cid then return end
    local list = profileWaiters[cid]
    if not list then return end
    profileWaiters[cid] = nil
    for _, p in ipairs(list) do
        p:resolve(payload)
    end
end

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

    -- Always push memory:profile (profile may be nil → UI builds default)
    SendNUIMessage({
        action = 'memory:profile',
        data = {
            computerId = payload.computerId,
            userId = payload.userId,
            userName = payload.userName,
            profile = payload.profile,
            empty = payload.profile == nil,
        },
    })

    resolveProfileWaiters(payload)
end)

RegisterNetEvent('nxg-computer:client:notify', function(msg, nType)
    if NXG.FW.Notify then
        NXG.FW.Notify(msg, nType)
    end
end)

RegisterNetEvent('nxg-computer:client:canOpenResult', function(result)
    if not canOpenWaiter or not result then return end
    if result.reqId and result.reqId ~= canOpenWaiter.id then return end
    if canOpenWaiter.promise.state == 'pending' then
        canOpenWaiter.promise:resolve(result)
    end
end)

RegisterNetEvent('nxg-computer:client:forceClose', function()
    NXG.CloseComputer()
end)

RegisterNetEvent('nxg-computer:client:openFromServer', function(computerId)
    NXG.OpenComputer(computerId)
end)

-- NUI callbacks (always registered)
RegisterNUICallback('computer:ready', function(_, cb)
    cb({
        ok = true,
        resource = GetCurrentResourceName(),
        computerId = currentComputerId,
        open = isOpen,
    })
end)

RegisterNUICallback('computer:close', function(_, cb)
    NXG.CloseComputer()
    cb({ ok = true })
end)

RegisterNUICallback('memory:load', function(data, cb)
    local computerId = (data and data.computerId) or currentComputerId or 'default'
    local p = promise.new()
    profileWaiters[computerId] = profileWaiters[computerId] or {}
    profileWaiters[computerId][#profileWaiters[computerId] + 1] = p

    TriggerServerEvent('nxg-computer:server:loadProfile', computerId)

    SetTimeout(5000, function()
        if p.state == 'pending' then
            p:resolve(nil)
        end
    end)

    local payload = Citizen.Await(p)
    if payload then
        cb({
            ok = true,
            profile = payload.profile,
            empty = payload.profile == nil,
            computerId = payload.computerId,
            userId = payload.userId,
            userName = payload.userName,
        })
    else
        cb({ ok = true, pending = true, profile = nil })
    end
end)

RegisterNUICallback('memory:save', function(data, cb)
    if type(data) == 'table' and data.profile then
        TriggerServerEvent('nxg-computer:server:saveProfile', data)
    end
    cb({ ok = true })
end)

-- Command
RegisterCommand(Config.OpenCommand or 'computer', function(_, args)
    NXG.ToggleComputer(args[1])
end, false)

-- Optional keybind
if Config.OpenKey and Config.OpenKey ~= '' then
    local keyCmd = 'nxg_computer_key'
    RegisterCommand(keyCmd, function()
        NXG.ToggleComputer()
    end, false)
    RegisterKeyMapping(keyCmd, 'NXGos — Open / close computer', 'keyboard', Config.OpenKey)
end

-- Resource stop safety
AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    if isOpen then
        setNuiFocus(false)
        if NXG.Anim and NXG.Anim.Stop then
            NXG.Anim.Stop()
        end
    end
end)

exports('OpenComputer', function(computerId, opts)
    return NXG.OpenComputer(computerId, opts)
end)
exports('CloseComputer', function()
    return NXG.CloseComputer()
end)
exports('ToggleComputer', function(computerId, opts)
    return NXG.ToggleComputer(computerId, opts)
end)
exports('IsComputerOpen', function()
    return NXG.IsComputerOpen()
end)
exports('GetComputerId', function()
    return NXG.GetComputerId()
end)

NXG.Debug('Client main ready')
