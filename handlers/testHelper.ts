export const corsGet = (name: string) => {
  if (name.toLowerCase() === "origin") {
    return "http://localhost:5171";
  } else {
    return "";
  }
};

export const corsSet = (_1: string, _2: string) => {};
