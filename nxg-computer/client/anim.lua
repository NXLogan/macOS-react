--[[
  Typing animation + optional laptop prop while NXGos is open
]]

NXG = NXG or {}
NXG.Anim = NXG.Anim or {}

local animActive = false
local propEntity = nil

local function loadAnimDict(dict)
    if HasAnimDictLoaded(dict) then return true end
    RequestAnimDict(dict)
    local timeout = GetGameTimer() + 5000
    while not HasAnimDictLoaded(dict) do
        if GetGameTimer() > timeout then
            return false
        end
        Wait(10)
    end
    return true
end

local function loadModel(model)
    if type(model) == 'string' then
        model = joaat(model)
    end
    if HasModelLoaded(model) then return model end
    RequestModel(model)
    local timeout = GetGameTimer() + 5000
    while not HasModelLoaded(model) do
        if GetGameTimer() > timeout then
            return nil
        end
        Wait(10)
    end
    return model
end

local function clearProp()
    if propEntity and DoesEntityExist(propEntity) then
        DeleteEntity(propEntity)
    end
    propEntity = nil
end

function NXG.Anim.Start()
    local cfg = Config.Anim
    if not cfg or cfg.enabled == false then return end

    local ped = PlayerPedId()
    if not loadAnimDict(cfg.dict) then
        NXG.Debug('Failed to load anim dict: ' .. tostring(cfg.dict))
        return
    end

    TaskPlayAnim(ped, cfg.dict, cfg.clip, 2.0, 2.0, -1, cfg.flag or 49, 0.0, false, false, false)
    animActive = true

    local prop = Config.Prop
    if prop and prop.enabled then
        clearProp()
        local model = loadModel(prop.model)
        if model then
            local coords = GetEntityCoords(ped)
            propEntity = CreateObject(model, coords.x, coords.y, coords.z, true, true, false)
            local bone = prop.bone or 57005
            local o = prop.offset or vec3(0.15, 0.02, -0.03)
            local r = prop.rotation or vec3(-70.0, 0.0, 0.0)
            AttachEntityToEntity(
                propEntity,
                ped,
                GetPedBoneIndex(ped, bone),
                o.x, o.y, o.z,
                r.x, r.y, r.z,
                true, true, false, true, 1, true
            )
            SetModelAsNoLongerNeeded(model)
        end
    end
end

function NXG.Anim.Stop()
    local ped = PlayerPedId()
    if animActive then
        local cfg = Config.Anim
        if cfg and cfg.dict and cfg.clip then
            StopAnimTask(ped, cfg.dict, cfg.clip, 1.0)
        else
            ClearPedTasks(ped)
        end
        animActive = false
    end
    clearProp()
end

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    NXG.Anim.Stop()
end)

NXG.Debug('Anim module ready')
