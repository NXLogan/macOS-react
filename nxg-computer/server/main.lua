--[[
  NXGos server bootstrap
]]

NXG.Debug(('Server started (fw=%s)'):format(NXG.FW and NXG.FW.name or 'unknown'))

-- Register usable item via framework bridge
CreateThread(function()
    Wait(500)
    local item = Config.Item
    if not item or item == '' then return end

    -- Wait until framework bridge is ready (max ~20s)
    local deadline = GetGameTimer() + 20000
    while not NXG.FW.IsReady() and GetGameTimer() < deadline do
        Wait(200)
    end

    NXG.FW.RegisterUsableItem(item, function(source)
        local cid = Config.ItemComputerId or Config.DefaultComputerId or 'default'
        local allowed, reason = NXG.CanUseComputer(source, cid)
        if not allowed then
            NXG.FW.Notify(source, _L(reason or 'no_permission'), 'error')
            return
        end
        TriggerClientEvent('nxg-computer:client:useItem', source)
    end)
end)

exports('OpenComputer', function(src, computerId)
    if type(src) ~= 'number' then return false end
    TriggerClientEvent('nxg-computer:client:openFromServer', src, computerId)
    return true
end)

exports('CloseComputer', function(src)
    if type(src) ~= 'number' then return false end
    TriggerClientEvent('nxg-computer:client:forceClose', src)
    return true
end)

exports('GetFramework', function()
    return NXG.FW and NXG.FW.name or 'standalone'
end)
