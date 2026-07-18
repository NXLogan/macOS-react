NXG = NXG or {}
Locales = Locales or {}

---@param key string
---@return string
function _L(key, ...)
    local lang = (Config and Config.Locale) or 'fr'
    local pack = Locales[lang] or Locales['en'] or {}
    local str = pack[key] or (Locales['en'] and Locales['en'][key]) or key
    if select('#', ...) > 0 then
        return string.format(str, ...)
    end
    return str
end

---@param msg string
function NXG.Debug(msg)
    if Config and Config.Debug then
        print(('[nxg-computer] %s'):format(msg))
    end
end
