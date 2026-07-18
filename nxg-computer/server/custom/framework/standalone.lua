--[[
  Standalone server bridge
]]

if NXG.FW.name ~= 'standalone' then return end

NXG.FW.ready = true

function NXG.FW.HasItemFramework(src, item)
    return true
end

function NXG.FW.RegisterUsableItem(item, cb)
    -- No inventory framework — item use must be triggered by another resource
    NXG.Debug(('Standalone: item "%s" not auto-registered (use export OpenComputer)'):format(tostring(item)))
end

NXG.Debug('Standalone server ready')
