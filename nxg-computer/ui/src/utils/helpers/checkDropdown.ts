const checkDropdown = (e: { target: EventTarget | null }) => {
  const target = e.target as HTMLElement;

  if (target.closest?.(".dd") || target.closest?.(".dropdown-menu")) {
    return true;
  }
  if (target.closest?.(".section") || target.classList?.contains("section")) {
    return true;
  }
  return false;
};

export default checkDropdown;
