import { css } from '../../../styled-system/css';

export const overlay = css({
  background: 'rgba(71, 85, 105, 0.4)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'grid',
  placeItems: 'center',
  overflowY: 'auto'
});

export const confirmOverlay = css({
  background: 'rgba(248, 250, 252, 1)',
});

export const content = css({
  minWidth: '30rem',
  background: 'white',
  borderRadius: 'md',
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
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
});

export const icon = css({
  backgroundColor: 'green.100',
  borderRadius: '4xl',
  padding: '0.8rem',
  width: '4.8rem',
  height: '4.8rem',
  display: 'flex',
  margin: '0 auto',
  alignItems: 'center',
  justifyContent: 'center',

  '& svg': {
    width: '2.4rem',
    height: '2.4rem',
    fill: 'green.900',
  }
});

export const title = css({
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 700,
  color: 'slate.950',
  textAlign: 'center',
});

export const description = css({
  fontSize: '1.4rem',
  lineHeight: '2rem',
  fontWeight: '400',
  color: 'slate.950',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
});

export const actions = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
});

export const inputContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',

  '& label': {
    fontSize: 'sm',
    lineHeight: 'sm',
    fontWeight: '500',
    color: 'slate.950',
    textAlign: 'left',
  }
});

export const primaryButton = css({
  width: '100%',
  backgroundColor: 'slate.950',
  color: 'white',
  borderRadius: 'sm',
  border: 'none',
  fontFamily: 'var(--font-inter)',
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 500,
  height: '4rem',
  cursor: 'pointer',
});

export const secondaryButton = css({
  width: '100%',
  backgroundColor: 'transparent',
  color: 'slate.950',
  border: '0.1rem solid #020617',
  borderRadius: 'sm',
  fontSize: 'base',
  lineHeight: 'base',
  fontFamily: 'var(--font-inter)',
  fontWeight: 500,
  height: '4rem',
  cursor: 'pointer',
});

export const fairLaunchButton = css({
  backgroundColor: 'green.500',
  color: 'white',
  borderRadius: 'sm',
  border: 'none',
  padding: '0.8rem 2.4rem',
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 500,
  height: '5.2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.8rem',
  cursor: 'pointer',
  width: '100%',

  lg: {
    width: '100%',
    maxWidth: '32rem',
    height: '4rem',
  }
});
