"use client";

import clsx from "clsx";
import * as React from "react";
import { type RecipeVariant } from "../../styled-system/css";
import * as styles from "./styles";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    RecipeVariant<typeof styles.buttonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <button
    className={clsx(styles.buttonVariants({ variant, size }), className)}
    ref={ref}
    {...props}
  />
));
