import { css } from "../../styled-system/css";

export const connectButtonContainer = css({
  width: "100%",
  lg: {
    width: "unset",
  },
});

export const connectButton = css({
  all: "unset",
  backgroundColor: "green.40",
  color: "void.80",
  borderRadius: "0.4rem",
  height: "4.8rem",
  fontSize: "base",
  lineHeight: "base",
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "center",
  width: "100%",

  lg: {
    padding: "0rem 2.4rem",
    width: "unset",
  },
});

export const wrongNetworkButton = css({
  all: "unset",
  backgroundColor: "red.600",
  color: "white",
  padding: "0rem 2.4rem",
  borderRadius: "0.4rem",
  height: "4.8rem",
  fontSize: "base",
  lineHeight: "base",
  fontWeight: 500,
  cursor: "pointer",
});
