import { css } from "../../../styled-system/css";

export const overlay = css({
  background: "rgba(71, 85, 105, 0.4)",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "grid",
  overflowY: "auto",
  placeItems: "center",
});

export const content = css({
  minWidth: "30rem",
  background: "white",
  borderRadius: "0.4rem",
  zIndex: 1000,
  position: "fixed",
  top: "20%",
  left: "50%",
  transform: "translate(-50%, -20%)",
  width: "38.2rem",
  maxWidth: "38.2rem",
  maxHeight: "85vh",
  overflowY: "auto",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "2rem",

  lg: {
    width: "69.2rem",
    maxWidth: "69.2rem",
  },
});

export const icon = css({
  backgroundColor: "void.10",
  borderRadius: "4xl",
  padding: "0.8rem",
  width: "4.8rem",
  minHeight: "4.8rem",
  display: "flex",
  margin: "0 auto",
  alignItems: "center",
  justifyContent: "center",

  "& svg": {
    width: "2rem",
    height: "2rem",
    fill: "void.60",
  },
});

export const title = css({
  fontSize: "base",
  lineHeight: "base",
  fontWeight: 700,
  color: "void.80",
  textAlign: "center",
});

export const description = css({
  fontSize: "sm",
  lineHeight: "sm",
  fontWeight: 400,
  textAlign: "left",
  color: "void.80",
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
});

export const actions = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
});

export const button = css({
  width: "100%",
  backgroundColor: "void.80",
  color: "white",
  borderRadius: "0.4rem",
  border: "none",
  fontSize: "base",
  lineHeight: "base",
  fontWeight: 500,
  height: "4rem",
  cursor: "pointer",
});
