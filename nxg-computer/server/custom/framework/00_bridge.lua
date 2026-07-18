--[[
  Server framework bootstrap — stubs + detection + shared inventory helpers
]]

NXG = NXG or {}
NXG.FW = NXG.FW or {}

NXG.FW.name = NXG.DetectFramework()
NXG.FW.ready = false
NXG.FW._object = nil

---@param src number
---@return string
function NXG.FW.GetIdentifier(src)
    local prefer = Config.FrameworkOptions and Config.FrameworkOptions.identifier
    return NXG.PickNativeIdentifier(src, prefer)
end

---@param src number
---@return string
function NXG.FW.GetPlayerName(src)
    return GetPlayerName(src) or 'NXG User'
end

---@param src number
---@return string|nil
function NXG.FW.GetJob(src)
    return nil
end

---@param src number
---@return string|nil
function NXG.FW.GetGang(src)
    return nil
end

--- Inventory helpers used by all frameworks
---@param src number
---@param item string
---@return boolean
function NXG.FW.HasItem(src, item)
    if not item or item == '' then return true end

    local mode = (Config.FrameworkOptions and Config.FrameworkOptions.inventory) or 'auto'

    if mode == 'ox_inventory' or (mode == 'auto' and GetResourceState('ox_inventory') == 'started') then
        local ok, count = pcall(function()
            return exports.ox_inventory:Search(src, 'count', item)
        end)
        if ok and type(count) == 'number' then
            return count > 0
        end
        if mode == 'ox_inventory' then return false end
    end

    if mode == 'qs-inventory' or (mode == 'auto' and GetResourceState('qs-inventory') == 'started') then
        local ok, count = pcall(function()
            return exports['qs-inventory']:GetItemTotalAmount(src, item)
        end)
        if ok and type(count) == 'number' then
            return count > 0
        end
        if mode == 'qs-inventory' then return false end
    end

    if mode == 'codem-inventory' or (mode == 'auto' and GetResourceState('codem-inventory') == 'started') then
        local ok, count = pcall(function()
            return exports['codem-inventory']:GetItemsTotalAmount(src, item)
        end)
        if ok and type(count) == 'number' then
            return count > 0
        end
        if mode == 'codem-inventory' then return false end
    end

    -- Framework-specific override set by bridge
    if NXG.FW.HasItemFramework then
        return NXG.FW.HasItemFramework(src, item)
    end

    -- Standalone / no inventory: allow
    if NXG.FW.name == 'standalone' then
        return true
    end
    return false
end

---@param src number
---@param msg string
---@param nType string|nil
function NXG.FW.Notify(src, msg, nType)
    TriggerClientEvent('nxg-computer:client:notify', src, msg, nType or 'inform')
end

--- Register usable item — overridden per framework
---@param item string
---@param cb fun(src: number)
function NXG.FW.RegisterUsableItem(item, cb)
    NXG.Debug(('RegisterUsableItem skipped (fw=%s) for %s'):format(NXG.FW.name, tostring(item)))
end

function NXG.FW.IsReady()
    return NXG.FW.ready == true
end

NXG.Debug(('Framework server detect: %s'):format(NXG.FW.name))
