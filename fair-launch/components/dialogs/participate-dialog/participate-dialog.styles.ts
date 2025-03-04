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

export const dialogTitle = css({
  fontSize: '1.6rem',
  lineHeight: '2.4rem',
  fontWeight: '700',
  color: '#020617',
  textAlign: 'center',
});

export const dialogDescription = css({
  fontSize: '1.4rem',
  lineHeight: '2rem',
  fontWeight: '400',
  color: '#020617',
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
  color: '#fff',
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
  color: '#020617',
  border: '0.1rem solid #020617',
  borderRadius: '0.4rem',
  // padding: '1rem',
  fontSize: '1.6rem',
  fontFamily: 'var(--font-inter)',
  fontWeight: '500',
  height: '4rem',
});

export const fairLaunchButton = css({
  backgroundColor: '#22c55e',
  color: '#fff',
  borderRadius: '0.4rem',
  border: 'none',
  padding: '0.8prem 2.4rem',
  fontSize: '1.6rem',
  fontWeight: '500',
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
