const updateSysColor = (color: string) => {
  const map: Record<string, string> = {
    orange: "#ff9f0a",
    green: "#30d158",
    babyblue: "#64d2ff",
    blue: "#0a84ff",
    purple: "#bf5af2",
    violet: "#bf5af2",
    pink: "#ff375f",
    yellow: "#ffd60a",
    graphite: "#8e8e93",
    red: "#ff453a",
  };

  document.documentElement.style.setProperty(
    "--user-color",
    map[color] ?? "#0a84ff"
  );
};

export default updateSysColor;
