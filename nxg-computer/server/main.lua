-- Server bootstrap for NXGos
NXG.Debug('Server started')

RegisterNetEvent('nxg-computer:server:ping', function()
    local src = source
    TriggerClientEvent('nxg-computer:client:pong', src)
end)
