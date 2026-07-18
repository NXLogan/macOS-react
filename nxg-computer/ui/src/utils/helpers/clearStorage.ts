const clearStorage = () => {
  const keepSession = localStorage.getItem("nxg-memory:last-session");
  const profileKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("nxg-memory:profile:")) profileKeys.push(key);
  }
  localStorage.clear();
  sessionStorage.clear();
  if (keepSession) {
    localStorage.setItem("nxg-memory:last-session", keepSession);
  }
  // Soft reset: recreate empty defaults on next hydrate
  window.location.reload();
  return profileKeys.length;
};

export default clearStorage;
