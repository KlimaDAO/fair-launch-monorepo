import { cva } from "../../styled-system/css";

export const alertVariants = cva({
  base: {
    width: "100%",
    display: "block",
    fontSize: "sm",
    lineHeight: "sm",
    borderRadius: "sm",
    border: "1px solid",
    padding: "1.2rem",
    textAlign: "left",
  },
  variants: {
    variant: {
      default: {
        bg: "green.10",
        color: "black",
        borderColor: "green.40",
      },
      success: {
        bg: "green.10",
        border: "none",
        color: "black",
        padding: "2rem",
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
