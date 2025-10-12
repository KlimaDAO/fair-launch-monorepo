import { css } from "../../styled-system/css";

export const container = css({
  position: "relative",
  zIndex: 100,
  boxShadow:
    "0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)",
});

export const titleContainer = css({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "0.8rem",
});

export const content = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
});

export const title = css({
  fontSize: "base",
  lineHeight: "base",
  fontWeight: 700,
});

export const description = css({
  fontSize: "sm",
  lineHeight: "sm",
  fontWeight: 400,
  color: "void.80",
  marginLeft: "3rem",

  '&.closed': {
    color: "white",
  },
  '&.claim': {
    color: "green.90",
  },
});

export const button = css({
  fontSize: "sm",
  lineHeight: "sm",
  fontWeight: 700,
  color: "green.80",
  letterSpacing: "0.02rem",
  width: "fit-content",
  marginLeft: "3.2rem",
  cursor: "pointer",
});

export const icon = css({
  color: "green.50",
  fontSize: "2rem",
  '&.closed': {
    color: "white",
  },
});
