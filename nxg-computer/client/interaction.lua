--[[
  World interactions: ox_target / qb-target / zones / usable item
]]

local zones = {}
local targetSystem = nil -- 'ox' | 'qb' | nil

local function targetEnabled()
    return Config.Target and Config.Target.enabled ~= false
end

local function detectTarget()
    local system = Config.Target and Config.Target.system or 'auto'
    if system == 'zones' then
        return nil
    end
    if system == 'ox_target' then
        return GetResourceState('ox_target') == 'started' and 'ox' or nil
    end
    if system == 'qb-target' then
        return GetResourceState('qb-target') == 'started' and 'qb' or nil
    end
    -- auto
    if GetResourceState('ox_target') == 'started' then
        return 'ox'
    end
    if GetResourceState('qb-target') == 'started' then
        return 'qb'
    end
    return nil
end

local function openFromDef(def)
    if not def or not def.id then return end
    NXG.OpenComputer(def.id, {
        coords = def.coords,
    })
end

local function addOxTarget(def)
    local options = {
        {
            name = 'nxg_computer_' .. def.id,
            icon = (Config.Target and Config.Target.icon) or 'fas fa-laptop',
            label = def.label or _L('open_computer'),
            distance = def.distance or (Config.Target and Config.Target.distance) or 1.8,
            onSelect = function()
                openFromDef(def)
            end,
        },
    }

    if def.model then
        exports.ox_target:addModel(def.model, options)
    elseif def.coords then
        exports.ox_target:addSphereZone({
            name = 'nxg_computer_zone_' .. def.id,
            coords = def.coords,
            radius = def.distance or (Config.Target and Config.Target.distance) or 1.8,
            debug = Config.Debug,
            options = options,
        })
    end
end

local function addQbTarget(def)
    local opts = {
        options = {
            {
                icon = (Config.Target and Config.Target.icon) or 'fas fa-laptop',
                label = def.label or _L('open_computer'),
                action = function()
                    openFromDef(def)
                end,
            },
        },
        distance = def.distance or (Config.Target and Config.Target.distance) or 1.8,
    }

    if def.model then
        exports['qb-target']:AddTargetModel(def.model, opts)
    elseif def.coords then
        exports['qb-target']:AddCircleZone(
            'nxg_computer_' .. def.id,
            def.coords,
            def.distance or (Config.Target and Config.Target.distance) or 1.8,
            {
                name = 'nxg_computer_' .. def.id,
                debugPoly = Config.Debug,
                useZ = true,
            },
            opts
        )
    end
end

local function startZoneFallback(def)
    if not def.coords then return end
    local dist = def.distance or (Config.Target and Config.Target.distance) or 1.8
    local showing = false

    CreateThread(function()
        while true do
            local sleep = 1000
            local ped = PlayerPedId()
            local pcoords = GetEntityCoords(ped)
            local d = #(pcoords - def.coords)

            if d < dist + 8.0 then
                sleep = 0
                if d <= dist then
                    if not showing then
                        showing = true
                    end
                    BeginTextCommandDisplayHelp('STRING')
                    AddTextComponentSubstringPlayerName(
                        ('~INPUT_CONTEXT~ %s'):format(def.label or _L('open_computer'))
                    )
                    EndTextCommandDisplayHelp(0, false, true, -1)

                    if IsControlJustReleased(0, 38) then -- E
                        openFromDef(def)
                    end
                else
                    showing = false
                end
            else
                showing = false
            end

            Wait(sleep)
        end
    end)

    zones[#zones + 1] = def.id
end

local function registerComputers()
    local list = Config.Computers or {}
    if #list == 0 then
        NXG.Debug('No Config.Computers entries — command/exports/item only')
        return
    end

    targetSystem = targetEnabled() and detectTarget() or nil
    NXG.Debug(('Interaction target: %s'):format(tostring(targetSystem)))

    for _, def in ipairs(list) do
        if def.enabled == false or not def.id then
            goto continue
        end

        if targetSystem == 'ox' then
            addOxTarget(def)
        elseif targetSystem == 'qb' then
            addQbTarget(def)
        else
            startZoneFallback(def)
        end

        ::continue::
    end
end

-- Usable item → open default (or Config.ItemComputerId)
local function registerItem()
    local item = Config.Item
    if not item or item == '' then return end

    RegisterNetEvent('nxg-computer:client:useItem', function()
        NXG.OpenComputer(Config.ItemComputerId or Config.DefaultComputerId)
    end)

    -- ESX
    if NXG.FW.name == 'esx' then
        RegisterNetEvent('esx:playerLoaded', function()
            -- item use is registered server-side
        end)
    end

    NXG.Debug(('Item open enabled: %s'):format(item))
end

CreateThread(function()
    Wait(500)
    registerComputers()
    registerItem()
end)

NXG.Debug('Interaction module ready')
