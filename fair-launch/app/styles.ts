import { css } from "../styled-system/css";

export const container = css({
  display: "flex",
  height: "100vh",
  backgroundColor: "transparent",
});

export const main = css({
  gap: 0,
  flex: 1,
  display: "flex",
  flexDirection: "column",
});

export const content = css({
  flex: 1,
  gap: "4rem",
  display: "flex",
  padding: "4rem",
  flexDirection: "column",
  position: "relative",

  lg: {
    gap: "2rem",
    padding: "8rem",
  },
});

export const title = css({
  color: "white",
  fontSize: "7xl",
  lineHeight: "7xl",
  textAlign: "center",

  lg: {
    fontSize: "8xl",
    lineHeight: "8xl",
    fontWeight: 700,
    textAlign: "left",
  },
});

export const subtitle = css({
  color: "white",
  fontSize: "2xl",
  lineHeight: "2xl",
  textAlign: "center",

  lg: {
    fontSize: "3xl",
    lineHeight: "3xl",
    fontWeight: 400,
    textAlign: "left",
  },
});

export const description = css({
  color: "white",
  fontSize: "lg",
  lineHeight: "lg",
  fontWeight: 400,
  textAlign: "center",

  lg: {
    fontSize: "xl",
    lineHeight: "xl",
    textAlign: "left",
  },
});

export const learnMore = css({
  color: "white !important",
  textDecoration: "underline",
  fontSize: "sm",
  lineHeight: "sm",
  fontWeight: 400,
  width: "fit-content",
  margin: "0 auto",

  lg: {
    margin: "0",
  },
});

export const backgroundImage = css({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  zIndex: -1,
});
