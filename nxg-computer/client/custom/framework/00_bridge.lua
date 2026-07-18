--[[
  Client framework bootstrap — stubs + detection
]]

NXG = NXG or {}
NXG.FW = NXG.FW or {}

-- Re-detect after config is loaded (shared ran early)
NXG.FW.name = NXG.DetectFramework()
NXG.FW.ready = false
NXG.FW._object = nil

local function gtaNotify(msg)
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName(tostring(msg))
    EndTextCommandThefeedPostTicker(false, true)
end

---@param msg string
---@param nType string|nil
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
    gtaNotify(msg)
end

function NXG.FW.GetJob()
    return nil
end

function NXG.FW.GetGang()
    return nil
end

function NXG.FW.GetPlayerName()
    return GetPlayerName(PlayerId()) or 'NXG User'
end

function NXG.FW.IsDead()
    local ped = PlayerPedId()
    return IsEntityDead(ped) or IsPedDeadOrDying(ped, true)
end

function NXG.FW.IsCuffed()
    return IsPedCuffed(PlayerPedId())
end

function NXG.FW.IsReady()
    return NXG.FW.ready == true
end

NXG.Debug(('Framework client detect: %s'):format(NXG.FW.name))
