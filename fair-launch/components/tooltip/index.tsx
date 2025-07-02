"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { FC } from "react";
import { useState } from "react";
import * as styles from "./styles";

interface Props {
  open?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
  content: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const Tooltip: FC<Props> = (props) => {
  const { open, defaultOpen, onOpenChange, children, content, ...rest } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipPrimitive.Provider delayDuration={10}>
      <TooltipPrimitive.Root
        open={isOpen}
        defaultOpen={defaultOpen}
        onOpenChange={setIsOpen}
      >
        <TooltipPrimitive.Trigger className={styles.tooltipTrigger} asChild>
          <div onClick={() => setIsOpen(true)}>{children}</div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={styles.tooltipContent}
            side="top"
            align="end"
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
