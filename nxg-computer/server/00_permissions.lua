--[[
  Server permissions — jobs / gangs / ACE / item
]]

NXG = NXG or {}

---@param src number
---@param computerId string
---@return boolean ok
---@return string|nil reason
function NXG.CanUseComputer(src, computerId)
    if not src or src <= 0 then
        return false, 'unavailable'
    end

    local def = NXG.GetComputerDef(computerId)

    -- Item gate (global laptop item) when opening via item or when Config.ItemRequired
    if Config.Item and Config.Item ~= '' and Config.RequireItem == true then
        if not NXG.FW.HasItem(src, Config.Item) then
            return false, 'no_item'
        end
    end

    if not def then
        -- Unknown / default computer — allow everyone
        return true, nil
    end

    if def.requireAce then
        local ace = Config.AdminAce or 'nxg-computer.admin'
        if not IsPlayerAceAllowed(src, ace) then
            return false, 'no_permission'
        end
    end

    if def.jobs and #def.jobs > 0 then
        local job = NXG.FW.GetJob(src)
        if not NXG.ListContains(def.jobs, job) then
            return false, 'no_permission'
        end
    end

    if def.gangs and #def.gangs > 0 then
        local gang = NXG.FW.GetGang(src)
        if not NXG.ListContains(def.gangs, gang) then
            return false, 'no_permission'
        end
    end

    return true, nil
end

RegisterNetEvent('nxg-computer:server:canOpen', function(computerId, reqId)
    local src = source
    local cid = computerId or Config.DefaultComputerId or 'default'
    local ok, reason = NXG.CanUseComputer(src, cid)
    TriggerClientEvent('nxg-computer:client:canOpenResult', src, {
        ok = ok,
        reason = reason,
        reqId = reqId,
        computerId = cid,
    })
end)

NXG.Debug('Permissions ready')
