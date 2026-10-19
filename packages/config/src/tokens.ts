export const tokens = {
  color: {
    ink: "#30251f",
    inkSoft: "#74655a",
    inkMuted: "#958477",
    paper: "#fff8ed",
    surface: "#ffffff",
    line: "#eadcc8",
    butter: "#f6bd4b",
    butterSoft: "#fff1cf",
    coral: "#df804e",
    coralSoft: "#f9e6d7",
    mint: "#cde8d4",
    mintStrong: "#3d7653",
    danger: "#b9473e",
  },
  radius: { sm: "0.75rem", md: "1rem", lg: "1.5rem", xl: "2rem", pill: "999px" },
  space: { 1: "0.25rem", 2: "0.5rem", 3: "0.75rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem", 8: "2rem", 10: "2.5rem", 12: "3rem" },
} as const;

export type WafflrColor = keyof typeof tokens.color;
