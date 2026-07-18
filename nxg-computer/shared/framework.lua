--[[
  Shared framework detection + helpers
  Supports: standalone | esx | esx_legacy | qb | qbx
]]

NXG = NXG or {}
NXG.FW = NXG.FW or {}

local ALIASES = {
    standalone = 'standalone',
    none = 'standalone',
    esx = 'esx',
    ['esx_legacy'] = 'esx_legacy',
    ['esx-legacy'] = 'esx_legacy',
    esxlegacy = 'esx_legacy',
    qb = 'qb',
    qbcore = 'qb',
    ['qb-core'] = 'qb',
    qbx = 'qbx',
    qbox = 'qbx',
    ['qbx_core'] = 'qbx',
}

local function opts()
    return (Config and Config.FrameworkOptions) or {}
end

function NXG.FrameworkResource(kind)
    local o = opts()
    if kind == 'esx' or kind == 'esx_legacy' then
        return o.esxResource or 'es_extended'
    end
    if kind == 'qb' then
        return o.qbResource or 'qb-core'
    end
    if kind == 'qbx' then
        return o.qbxResource or 'qbx_core'
    end
    return nil
end

---@return string normalized name
function NXG.DetectFramework()
    local raw = (Config and Config.Framework) or 'auto'
    if type(raw) == 'string' then
        raw = raw:lower():gsub('%s+', '')
    end

    if raw ~= 'auto' then
        return ALIASES[raw] or raw
    end

    local qbx = NXG.FrameworkResource('qbx')
    local qb = NXG.FrameworkResource('qb')
    local esx = NXG.FrameworkResource('esx')

    if qbx and GetResourceState(qbx) == 'started' then
        return 'qbx'
    end
    if qb and GetResourceState(qb) == 'started' then
        return 'qb'
    end
    if esx and GetResourceState(esx) == 'started' then
        -- Prefer legacy if export missing (detected later on bridge init)
        return 'esx'
    end
    return 'standalone'
end

---@param name string
---@return boolean
function NXG.IsEsxFamily(name)
    return name == 'esx' or name == 'esx_legacy'
end

---@param name string
---@return boolean
function NXG.IsQbFamily(name)
    return name == 'qb' or name == 'qbx'
end

--- Resolve preferred player identifier from native list
---@param src number
---@param prefer string|nil
---@return string
function NXG.PickNativeIdentifier(src, prefer)
    local ids = GetPlayerIdentifiers(src)
    local order = {}
    if prefer == 'steam' then
        order = { 'steam:', 'license:', 'fivem:', 'discord:' }
    elseif prefer == 'fivem' then
        order = { 'fivem:', 'license:', 'steam:', 'discord:' }
    elseif prefer == 'discord' then
        order = { 'discord:', 'license:', 'steam:', 'fivem:' }
    else
        order = { 'license:', 'license2:', 'fivem:', 'steam:', 'discord:' }
    end
    for _, prefix in ipairs(order) do
        for _, id in ipairs(ids) do
            if id:find(prefix, 1, true) == 1 then
                return id
            end
        end
    end
    return ('src:%s'):format(src)
end
