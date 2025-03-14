"use client";

import clsx from "clsx";
import * as React from "react";
import * as styles from "./styles";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={clsx(styles.input, className)}
    {...props}
  />
));
Input.displayName = "Input";
