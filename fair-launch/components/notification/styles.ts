import { css } from '../../styled-system/css';

export const container = css({
  position: 'absolute',
  top: 0,
  right: 0,
  zIndex: 100,
  left: '22.4rem', // sidebar width
});

export const titleContainer = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '0.8rem',
});

export const content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
});

export const title = css({
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 700,
  color: 'green.90',
});

export const description = css({
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 400,
  color: 'void.80',
  marginLeft: '3.2rem',
});

export const button = css({
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 700,
  color: 'green.80',
  letterSpacing: '0.02rem',
  width: 'fit-content',
  marginLeft: '3.2rem',
  cursor: 'pointer',
});

export const icon = css({
  color: 'green.50',
  fontSize: '2.4rem',
});