import type { FC, ReactNode } from 'react';
import { card } from './card.styles';

export const Card: FC<{ children: ReactNode }> = (props) => {
  return <div className={card}>{props.children}</div>;
};
