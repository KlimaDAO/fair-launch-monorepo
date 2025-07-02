"use client";

import clsx from "clsx";
import * as React from "react";
import { type RecipeVariantProps } from "../../styled-system/css";
import * as styles from "./styles";

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    RecipeVariantProps<typeof styles.alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={clsx(styles.alertVariants({ variant }), className)}
    {...props}
  />
));
