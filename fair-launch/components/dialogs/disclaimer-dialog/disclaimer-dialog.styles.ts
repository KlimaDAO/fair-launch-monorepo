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
  color: '#020617',
  textAlign: 'center',
});

export const description = css({
  fontSize: '1.4rem',
  lineHeight: '2rem',
  fontWeight: '400',
  color: '#020617',
  textAlign: 'center',
});

export const actions = css({
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
  borderRadius: '4px',
  border: 'none',
  padding: '8px 24px',
  fontSize: '16px',
  fontWeight: '500',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
});
