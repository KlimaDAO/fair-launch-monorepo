import { css } from "../../styled-system/css";

export const navbar = css({
  height: "6.4rem",
  backgroundColor: "white",
  padding: "1.7rem 1.6rem",
  boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",

  '& img': {
    width: '24rem',
  },

  md: {
    display: "none",
  },
});

export const menuContainer = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "4rem",
  height: "4rem",
  borderRadius: "50%",
  backgroundColor: "void.80",
});

export const menuIcon = css({
  fontSize: "2rem",
  color: "white",
});

export const flyoutMenu = css({
  position: "fixed",
  top: "6.4rem",
  left: 0,
  width: "100%",
  height: "auto",
  backgroundColor: "rgba(255,255,255,0.98)",
  boxShadow:
    "0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)",
  color: "black",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "2rem",
  justifyContent: "flex-start",
  zIndex: 1000,
});

export const closeButton = css({
  position: "absolute",
  top: "1.8rem",
  right: "2.2rem",
  background: "none",
  border: "none",
  color: "black",
  fontSize: "2rem",
  cursor: "pointer",
});

export const navLinks = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
  width: "100%",
});

export const navLink = css({
  display: "flex",
  gap: "0.8rem",
  color: "void.80",
  padding: "0.6rem 0.4rem",
  borderRadius: "0.4rem",

  "& svg": {
    fontSize: "2rem",
    fill: "void.50",
  },
});

export const activeLink = css({
  color: "void.80",
  fontWeight: 700,
  backgroundColor: "void.10",
  "& svg": {
    fill: "void.60",
  },
});

export const logoutButton = css({
  cursor: "pointer",
  backgroundColor: "transparent",
  color: "void.80",
  borderRadius: "sm",
  height: "4rem",
  width: "100%",
  fontSize: "base",
  lineHeight: "base",
  fontWeight: 500,
  border: "0.1rem solid token(colors.void.80)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.8rem",
  fontFamily: "var(--font-inter)",

  "& svg": {
    fontSize: "1.6rem",
    fill: "void.80",
  },
});

export const buttonContainer = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.2rem",
  width: "100%",
  padding: "4rem 0 0.4rem 0",
});
