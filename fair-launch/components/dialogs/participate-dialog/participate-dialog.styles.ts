import { css } from '../../../styled-system/css';

export const dialogOverlay = css({
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

export const dialogContent = css({
  minWidth: '30rem',
  background: 'white',
  borderRadius: 'sm',
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

export const dialogTitle = css({
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 700,
  color: 'slate.950',
  textAlign: 'center',
});

export const dialogDescription = css({
  fontSize: '1.4rem',
  lineHeight: '2rem',
  fontWeight: '400',
  color: 'slate.950',
  textAlign: 'center',
});

export const dialogActions = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
});

export const proceedButton = css({
  width: '100%',
  backgroundColor: '#020617',
  color: 'white',
  borderRadius: 'sm',
  border: 'none',
  fontFamily: 'var(--font-inter)',
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 500,
  height: '4rem',
});

export const cancelButton = css({
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
