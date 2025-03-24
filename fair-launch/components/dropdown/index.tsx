'use client';

import { Select } from "radix-ui";
import type { FC } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import * as styles from './styles';
import { useState } from "react";

type KeyValue = {
  value: string;
  label: string;
}

interface Props {
  items: KeyValue[];
  defaultSelected: KeyValue;
  onSelect: (value: string) => void;
}

export const Dropdown: FC<Props> = (props) => {
  const [value, setValue] = useState(props?.defaultSelected?.value);
  return (
    <Select.Root
      value={value}
      onValueChange={(value: string) => {
        props.onSelect(value);
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
            {props.items.map((item) => (
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