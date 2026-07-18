const returnColor = (color: string) => {
  switch (color) {
    case "orange":
      return "#ff9d0a";
    case "green":
      return "#2ed157";
    case "babyblue":
      return "#66d4ff";
    case "blue":
      return "#c8f542";
    case "purple":
      return "#5e5ce6";
    case "violet":
      return "#bf5af2";
    case "red":
      return "#ff3860";
    default:
      return "#c8f542";
  }
};

export default returnColor;
