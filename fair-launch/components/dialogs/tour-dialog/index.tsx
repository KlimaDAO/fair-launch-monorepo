'use client';

import { Dialog } from "radix-ui";
import { MdOutlineClose, MdHelpOutline, MdOutlineHelpCenter } from "react-icons/md";
import { type FC, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import * as styles from './styles';

type InteractOutsideEvent =
  | CustomEvent<{ originalEvent: FocusEvent }>
  | CustomEvent<{ originalEvent: PointerEvent }>;

interface Props {
  onOpen?: (open: boolean) => void;
  onClose: () => void;
}

export const TourDialog: FC<Props> = ({ onClose, onOpen }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onOpen?.(open);
  }, [open]);

  const handleGetStarted = () => {
    setOpen(false);
    onClose();
  }

  if (!pathname.includes('my-rewards')) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={styles.tourButton}>
        <MdHelpOutline />
        Show me around
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          onInteractOutside={(e: InteractOutsideEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
          <Dialog.Close>
            <MdOutlineClose className={styles.closeIcon} />
          </Dialog.Close>
          <div className={styles.icon}>
            <MdOutlineHelpCenter />
          </div>
          <Dialog.Title className={styles.title}>
            Welcome
          </Dialog.Title>
          <div className={styles.description}>
            <div>Welcome to the Klima Fair Launch 2025! We’re so glad you’re here.</div>
            <div>Let’s take a quick tour so you know your way around.</div>
          </div>
          <div className={styles.actions}>
            <button onClick={handleGetStarted} className={styles.button}>
              Get Started
            </button>
          </div>
          <div className={styles.stepText}>Step 1/6</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
};