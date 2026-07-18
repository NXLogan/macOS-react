Config = Config or {}

Config.Debug = true
Config.Locale = "fr"

-- Open / close the computer NUI
Config.OpenCommand = 'computer' -- /computer (dev). Prefer item / target in prod.
Config.OpenKey = nil            -- e.g. 'F5' or nil to disable keybind

-- Animation while using the PC
Config.Anim = {
    dict = 'anim@heists@prison_heiststation@cop_reactions',
    clip = 'cop_b_idle',
    flag = 49,
}

-- Camera / prop (filled in later)
Config.Prop = {
    enabled = false,
    model = `prop_laptop_01a`,
}

-- Framework bridge: 'auto' | 'esx' | 'qb' | 'qbx' | 'standalone'
Config.Framework = 'auto'

-- Close NUI with Escape
Config.CloseWithEscape = true

-- Default computer id when opening without an explicit PC id
-- Use different ids per desk/prop: exports['nxg-computer']:OpenComputer('bureau-pd')
Config.DefaultComputerId = 'default'
