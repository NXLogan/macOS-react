Config = Config or {}

--[[
==============================================================================
  Ordinateurs du monde (bureaux / laptops)

  Champs :
    id          string     id unique (lié au profil joueur)
    label       string     texte target / aide E
    coords      vector3    point d'interaction
    model       hash?      prop pour target par modèle
    distance    number?    override Config.Target.distance
    jobs        string[]?  jobs autorisés (nil/{} = tout le monde)
    gangs       string[]?  gangs autorisés (QB / Qbox)
    requireAce  boolean?   exige Config.AdminAce
    enabled     boolean?   défaut true

  Laisse {} si tu ouvres uniquement via commande / exports / item.
==============================================================================
]]

Config.Computers = {
    -- Exemples (décommente et adapte les coords) :
    --
    -- {
    --     id = 'bureau-pd',
    --     label = 'Ordinateur PD',
    --     coords = vec3(441.18, -978.17, 30.69),
    --     distance = 1.5,
    --     jobs = { 'police' },
    -- },
    -- {
    --     id = 'bureau-ems',
    --     label = 'Ordinateur EMS',
    --     coords = vec3(311.0, -590.0, 43.0),
    --     distance = 1.5,
    --     jobs = { 'ambulance' },
    -- },
    -- {
    --     id = 'laptop-public',
    --     label = 'Ordinateur public',
    --     coords = vec3(0.0, 0.0, 0.0),
    --     distance = 1.5,
    -- },
}
