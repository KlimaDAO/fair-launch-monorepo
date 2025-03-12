'use client';

import { Select } from "radix-ui";
import type { FC } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import * as styles from './dropdown.styles';

interface Props {
  // onValueChange: (value: string) => void;
  selected: {
    value: string;
    label: string;
  };
  items: {
    value: string;
    label: string;
  }[];
}

export const Dropdown: FC<Props> = (props) => {
  return (
    <Select.Root defaultValue={props.selected.value}>
      <Select.Trigger className={styles.trigger}>
        <Select.Value />
        <MdKeyboardArrowDown className={styles.icon} />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={2} className={styles.content}>
          <Select.ScrollUpButton className={styles.scrollButton} />
          <Select.Viewport className={styles.viewport}>
            {props.items.map((item) => (
              <Select.Item className={styles.item} key={item.value} value={item.value}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator className={styles.itemIndicator} />
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton />
          <Select.Arrow />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
};  