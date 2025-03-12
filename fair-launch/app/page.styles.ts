import { css } from '../styled-system/css';

export const container = css({
  display: 'flex',
  height: '100vh',
  backgroundColor: 'black',
});

export const main = css({
  gap: 0,
  flex: 1,
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
  color: 'white',
  fontSize: '8xl',
  lineHeight: '8xl',
  fontWeight: 700,
});

export const subtitle = css({
  color: 'white',
  fontSize: '3xl',
  lineHeight: '3xl',
  fontWeight: 400,
});

export const description = css({
  color: 'white',
  fontSize: 'xl',
  lineHeight: 'xl',
  fontWeight: 400,
});

export const learnMore = css({
  color: 'white !important',
  textDecoration: 'underline',
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 400,
  width: 'fit-content',
});
