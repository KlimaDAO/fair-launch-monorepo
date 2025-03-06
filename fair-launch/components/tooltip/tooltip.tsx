'use client';

import type { FC } from 'react';
import { Tooltip as TooltipPrimitive } from "radix-ui";
import * as styles from './tooltip.styles';

interface Props {
  open?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
  content: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const Tooltip: FC<Props> = (props) => {
  const { open, defaultOpen, onOpenChange, children, content, ...rest } = props;
  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <TooltipPrimitive.Trigger asChild>
          <div>{children}</div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={styles.tooltipContent}
            align="center"
            {...rest}
          >
            {content}
            <TooltipPrimitive.Arrow
              width={11}
              height={5}
              className={styles.tooltipArrow}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
