fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'nxg-computer'
author 'NXG'
description 'NXG Computer — immersive in-game PC system for FiveM'
version '0.1.0'

shared_scripts {
    'shared/*.lua',
    'config/config.lua',
    'config/apps.lua',
    'config/locales/*.lua',
}

client_scripts {
    'client/custom/framework/*.lua',
    'client/apps/*.lua',
    'client/*.lua',
}

server_scripts {
    'server/custom/framework/*.lua',
    'server/apps/*.lua',
    'server/*.lua',
}

ui_page 'ui/build/index.html'

files {
    'ui/build/index.html',
    'ui/build/**/*',
    'data/profiles.json',
}

dependencies {
    '/server:5848',
    '/onesync',
}
