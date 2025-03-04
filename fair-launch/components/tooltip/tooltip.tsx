import type { FC } from 'react';
import { Tooltip as TooltipPrimitive } from "radix-ui";

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
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content side="top" align="center" {...rest}>
          {content}
          <TooltipPrimitive.Arrow width={11} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
