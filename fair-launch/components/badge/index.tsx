'use client';

import clsx from "clsx";
import * as React from "react";
import { type RecipeVariantProps } from "../../styled-system/css";
import * as styles from './styles';

export const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
  RecipeVariantProps<typeof styles.badgeVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="badge"
    className={clsx(styles.badgeVariants({ variant }), className)}
    {...props}
  >
    {props.title}
  </div>
));
