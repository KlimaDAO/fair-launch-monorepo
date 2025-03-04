import { css } from '../styled-system/css';

export const container = css({
  display: 'flex',
  height: '100vh',
});

export const main = css({
  flex: 1,
  gap: 0,
  display: 'flex',
  flexDirection: 'column',
});

export const content = css({
  flex: 1,
  gap: '2rem',
  display: 'flex',
  padding: '8rem',
  flexDirection: 'column',
});

export const title = css({
  color: '#020617',  // todo - variable
  fontSize: '9.6rem',
  lineHeight: '9.6rem',
  fontWeight: '700',
});

export const subtitle = css({
  color: '#020617', // todo - variable
  fontSize: '3rem',
  lineHeight: '3.6rem',
  fontWeight: '400',
});

export const connectButton = css({
  backgroundColor: '#020617',
  color: '#fff',
  borderRadius: '0.4rem',
  border: 'none',
  padding: '0.8rem 2.4rem',
  fontSize: '1.6rem',
  fontWeight: '500',
  height: '4.8rem',
  width: 'max-content',
  cursor: 'pointer',
});

export const learnMore = css({
  color: '#020617',
  textDecoration: 'underline',
  fontSize: '1.4rem',
  fontWeight: '400',
  width: 'fit-content',
});
