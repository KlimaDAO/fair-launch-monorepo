import { css } from "../../styled-system/css";

export const trigger = css({
  all: "unset",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: "0.4rem",
  padding: "0 1.5rem",
  fontSize: "1.4rem",
  lineHeight: 1,
  height: "4rem",
  gap: "0.5rem",
  minWidth: "20rem",
  backgroundColor: "white",
  color: "void.60",
  cursor: "pointer",
  border: "0.1rem solid #666666",

  "&[data-placeholder]": {
    color: "void.60",
  },
});

export const icon = css({
  fontSize: "2rem",
  color: "void.80",
});

export const content = css({
  cursor: "pointer",
  overflow: "hidden",
  backgroundColor: "white",
  borderRadius: "0.4rem",
  width: "var(--radix-select-trigger-width)",
  maxHeight: "var(--radix-select-content-available-height)",
  border: "0.1rem solid token(colors.void.50)",
  boxShadow:
    "0 0.1rem 3.8rem -0.1rem rgba(22, 23, 24, 0.35), 0 0.1rem 0.2rem -1.5rem rgba(22, 23, 24, 0.2)",

  "& span > svg": {
    display: "none !important",
  },
});

export const viewport = css({
  padding: "0.5rem",
});

export const item = css({
  fontSize: "1.4rem",
  lineHeight: "2rem",
  color: "void.60",
  display: "flex",
  alignItems: "center",
  height: "3.5rem",
  padding: "0 0.1rem",
  position: "relative",
  userSelect: "none",
  "&[data-disabled]": {
    color: "void.10",
    pointerEvents: "none",
  },
  "&[data-highlighted]": {
    outline: "none",
    backgroundColor: "void.40",
    color: "void.60",
  },
});

export const itemIndicator = css({
  position: "absolute",
  left: "0",
  width: "2.5rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});
