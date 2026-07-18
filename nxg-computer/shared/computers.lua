-- Shared helpers for computers + permissions (client & server)

NXG = NXG or {}

---@param computerId string|nil
---@return table|nil
function NXG.GetComputerDef(computerId)
    if not computerId or not Config or not Config.Computers then
        return nil
    end
    for _, def in ipairs(Config.Computers) do
        if def.id == computerId and def.enabled ~= false then
            return def
        end
    end
    return nil
end

---@param list string[]|nil
---@param value string|nil
---@return boolean
function NXG.ListContains(list, value)
    if not list or #list == 0 then
        return true -- empty = unrestricted
    end
    if not value or value == '' then
        return false
    end
    local needle = value:lower()
    for _, entry in ipairs(list) do
        if type(entry) == 'string' and entry:lower() == needle then
            return true
        end
    end
    return false
end
