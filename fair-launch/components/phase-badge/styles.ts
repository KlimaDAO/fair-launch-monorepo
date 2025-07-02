import { css } from "../../styled-system/css";

export const badge = css({
  backgroundColor: "green.30",
  borderRadius: "0.4rem",
  padding: "0.4rem 1.2rem",
  fontSize: "1.4rem",
  fontWeight: 500,
  color: "green.100",
});

import { cva } from "../../styled-system/css";

export const badgeVariants = cva({
  base: {
    borderRadius: "0.4rem",
    fontSize: "1.4rem",
    fontWeight: 500,
    maxHeight: "2.8rem",
  },
  variants: {
    variant: {
      default: {
        padding: "0.4rem 1.2rem",
        backgroundColor: "green.30",
        color: "green.100",
        letterSpacing: "0.02rem",
      },
      table: {
        padding: "0.4rem 1.2rem",
        backgroundColor: "green.10",
        color: "green.90",
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
