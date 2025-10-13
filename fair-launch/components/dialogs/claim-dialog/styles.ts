import { css } from "../../../styled-system/css";

export const overlay = css({
  background: "rgba(70, 70, 70, 0.6)",
  position: "fixed",
  zIndex: 100,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "grid",
  placeItems: "center",
  overflowY: "auto",
});

export const confirmOverlay = css({
  backgroundColor: "void.10",
});

export const disabled = css({
  opacity: 0.65,
  cursor: "not-allowed",
});

export const content = css({
  minWidth: "30rem",
  background: "white",
  borderRadius: "md",
  zIndex: 1000,
  position: "fixed",
  top: "20%",
  left: "50%",
  transform: "translate(-50%, -20%)",
  width: "38.2rem",
  maxWidth: "38.2rem",
  maxHeight: "85vh",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
});

export const icon = css({
  backgroundColor: "green.20",
  borderRadius: "4xl",
  padding: "0.8rem",
  width: "4.8rem",
  height: "4.8rem",
  display: "flex",
  margin: "0 auto",
  alignItems: "center",
  justifyContent: "center",

  "& svg": {
    width: "2.4rem",
    height: "2.4rem",
    fill: "green.80",
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
  fontSize: "1.4rem",
  lineHeight: "2rem",
  fontWeight: "400",
  color: "void.80",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  textAlign: "left",
});

export const descriptionItem = css({
  width: "100%",
  fontSize: "1.4rem",
  lineHeight: "2rem",
  fontWeight: "400",
  color: "void.80",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.4rem",
});

export const tgeInfo = css({
  color: "void.50",
  fontSize: "1.2rem",
});

export const txInfo = css({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.8rem",
  fontSize: "1.2rem",
  marginTop: "1rem",
});

export const txLink = css({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.4rem",
  color: "green.70 !important",
  fontWeight: 500,
  textDecoration: "underline",
});

export const aerodrome = css({
  width: "100%",
  height: "100%",
  backgroundColor: "void.10",
  borderRadius: "sm",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  margin: "1rem 0 0",
});

export const aerodromeTitle = css({
  fontSize: "1.2rem",
  fontWeight: 500,
  color: "void.40",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "0.4rem",
  textTransform: "uppercase",

  "& svg": {
    width: "2rem",
    height: "2rem",
    fill: "green.70 !important",
  },
});

export const nextSteps = css({
  padding: "2rem",
  backgroundColor: "green.10",
  fontSize: "1.4rem",
  lineHeight: "1.8rem",
  fontWeight: 400,
  color: "void.80",
});

export const link = css({
  color: "green.70 !important",
  fontWeight: 500,
  fontSize: "1.2rem",
  textDecoration: "underline",
});

export const actions = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
});

export const inputContainer = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",

  "& label": {
    fontSize: "sm",
    lineHeight: "sm",
    fontWeight: "500",
    color: "void.80",
    textAlign: "left",
  },
});

export const primaryButton = css({
  width: "100%",
  backgroundColor: "void.80",
  color: "white",
  borderRadius: "sm",
  border: "none",
  fontFamily: "var(--font-inter)",
  fontSize: "base",
  lineHeight: "base",
  fontWeight: 500,
  height: "4rem",
  cursor: "pointer",

  "&:disabled": {
    opacity: 0.85,
    cursor: "not-allowed",
  },
});

export const secondaryButton = css({
  width: "100%",
  backgroundColor: "transparent",
  color: "void.80",
  border: "0.1rem solid #020617",
  borderRadius: "sm",
  fontSize: "base",
  lineHeight: "base",
  fontFamily: "var(--font-inter)",
  fontWeight: 500,
  height: "4rem",
  cursor: "pointer",
});

export const aerodromeButtons = css({
  fontSize: "1.4rem",
  fontWeight: 500,
  height: "3.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.4rem",
});

export const participateButton = css({
  backgroundColor: "green.40",
  color: "white",
  borderRadius: "sm",
  border: "none",
  padding: "0.8rem",
  fontSize: "base",
  lineHeight: "base",
  fontWeight: 500,
  height: "5.2rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.8rem",
  cursor: "pointer",
  width: "100%",

  lg: {
    width: "100%",
    maxWidth: "15rem",
    height: "4rem",
  },
});

export const disclaimerText = css({
  fontSize: "1.2rem",
  fontWeight: 400,
  color: "void.50",
  textAlign: "left",
});

export const closedButton = css({
  backgroundColor: "void.60",
  opacity: 0.4,
  cursor: "not-allowed",
  color: "white",
  borderRadius: "sm",
  border: "none",
  minWidth: "34rem",
  padding: "0.8rem 2.4rem",
});

export const input = css({
  flex: 1,
  gap: "0.8rem",
  display: "flex",
  height: "4rem",
  width: "100%",
  borderRadius: "sm",
  border: "none",
  background: "void.10",
  padding: "1rem 0.8rem",
  fontSize: "base",

  "&:focus": {
    outline: "none",
  },
});

export const klimaLogo = css({
  fontSize: "2rem",
});

export const inputRow = (error: boolean) =>
  css({
    gap: "0",
    paddingLeft: "1.2rem",
    display: "flex",
    borderRadius: "sm",
    flexDirection: "row",
    justifyContent: "space-between",
    ...(error
      ? { border: "0.1rem solid token(colors.red.600)" }
      : {
          border: "0.1rem solid token(colors.void.50)",
        }),
  });

export const maxButton = css({
  backgroundColor: "void.60",
  textTransform: "uppercase",
  padding: "0.8rem 1rem",
  color: "white",
  borderRadius: "0.3rem",
  border: "none",
  fontSize: "sm",
  lineHeight: "sm",
  fontWeight: 700,
  cursor: "pointer",
});

export const confirmTitle = css({
  fontSize: "lg",
  lineHeight: "lg",
  textAlign: "left",
  fontWeight: 700,
  color: "void.80",
});

export const confirmDescription = css({
  fontSize: "base",
  lineHeight: "base",
  textAlign: "left",
  fontWeight: 400,
  color: "void.80",
});

export const confirmContainer = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.2rem",
});

export const errorText = css({
  color: "red.600",
  fontSize: "sm",
  lineHeight: "sm",
  fontWeight: 500,
  textAlign: "left",
});

export const errorField = css({
  border: "0.1rem solid token(colors.red.600)",
});

export const row = css({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
});

export const availableBalance = css({
  fontSize: "sm",
  lineHeight: "sm",
  fontWeight: 400,
  color: "void.50",
});
