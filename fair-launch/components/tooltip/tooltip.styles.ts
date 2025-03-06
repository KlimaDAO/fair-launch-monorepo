import { css } from '../../styled-system/css';

export const tooltipTrigger = css({
  cursor: 'default',
});

export const tooltipContent = css({
  overflow: 'hidden',
  rounded: 'sm',
  padding: '1rem 1.2rem',
  zIndex: '5000',
  maxWidth: '24rem',
  fontSize: 'sm',
  lineHeight: 'sm',
  background: 'slate.500',
  color: 'white',
  textAlign: 'center',
});

export const tooltipArrow = css({
  fill: 'slate.500',
});