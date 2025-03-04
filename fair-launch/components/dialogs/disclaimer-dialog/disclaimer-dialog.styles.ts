import { css } from '../../../styled-system/css';

export const overlay = css({
  background: 'rgba(71, 85, 105, 0.4)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'grid',
  overflowY: 'auto',
  placeItems: 'center',
});

export const content = css({
  minWidth: '30rem',
  background: 'white',
  borderRadius: '0.4rem',
  zIndex: 1000,
  position: 'fixed',
  top: '20%',
  left: '50%',
  transform: 'translate(-50%, -20%)',
  width: '38.2rem',
  maxWidth: '38.2rem',
  maxHeight: '85vh',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
});

export const title = css({
  fontSize: '1.6rem',
  lineHeight: '2.4rem',
  fontWeight: '700',
  color: 'slate.950',
  textAlign: 'center',
});

export const description = css({
  fontSize: '1.4rem',
  lineHeight: '2rem',
  fontWeight: '400',
  color: 'slate.950',
  textAlign: 'center',
});

export const actions = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
});

export const proceedButton = css({
  width: '100%',
  backgroundColor: 'slate.950',
  color: 'white',
  borderRadius: '0.4rem',
  border: 'none',
  // padding: '1rem',
  fontFamily: 'var(--font-inter)',

  fontSize: '1.6rem',
  fontWeight: '500',
  height: '4rem',
});

export const cancelButton = css({
  width: '100%',
  backgroundColor: 'transparent',
  color: 'slate.950',
  border: '0.1rem solid slate.950',
  borderRadius: '0.4rem',
  fontSize: '1.6rem',
  fontFamily: 'var(--font-inter)',
  fontWeight: '500',
  height: '4rem',
});
