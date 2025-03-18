"use client";

import clsx from "clsx";
import * as React from "react";
import * as styles from "./styles";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, onChange, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      onChange={onChange} // Use the onChange prop directly
      className={clsx(styles.input, className)}
      {...props}
    />
  );
});
