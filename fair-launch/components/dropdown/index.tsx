'use client';

import { Select } from "radix-ui";
import type { FC } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useState } from "react";
import * as styles from './styles';

type KeyValue = {
  value: string;
  label: string;
}

interface Props {
  items: KeyValue[];
  defaultSelected: KeyValue;
  onSelect: (value: string) => void;
}

export const Dropdown: FC<Props> = ({ items, defaultSelected, onSelect }) => {
  const [value, setValue] = useState(defaultSelected?.value);
  return (
    <Select.Root
      value={value}
      onValueChange={(value: string) => {
        onSelect(value);
        setValue(value);
      }}
    >
      <Select.Trigger className={styles.trigger}>
        <Select.Value />
        <MdKeyboardArrowDown className={styles.icon} />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={2} className={styles.content}>
          <Select.Viewport className={styles.viewport}>
            {items.map((item) => (
              <Select.Item className={styles.item} key={item.value} value={item.value}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator className={styles.itemIndicator} />
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.Arrow />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
};