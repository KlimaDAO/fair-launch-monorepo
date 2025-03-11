import { css } from '../../styled-system/css';

export const container = css({
  display: 'flex',
  height: '100vh',
});

export const main = css({
  gap: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  width: 'calc(100% - var(--sidebar-width))'
});

export const tooltip = css({
  maxWidth: '10rem',
});

export const content = css({
  flex: 1,
  gap: '2rem',
  display: 'flex',
  padding: '3.2rem 1.6rem',
  flexDirection: 'column',

  lg: {
    padding: '3.6rem 4rem',
  }
});

export const titleContainer = css({
  width: '100%',
  gap: '2.4rem',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',

  lg: {
    justifyContent: 'flex-start'
  }
});

export const title = css({
  color: 'void.80',
  fontSize: '4xl',
  fontWeight: 700,
  lineHeight: '4xl',
});

export const twoCols = css({
  gap: '2rem',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'space-between',

  lg: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  }
});

export const card = css({
  width: '100%',
  display: 'flex',
  borderRadius: '0.8rem',
  flexDirection: 'column',
  backgroundColor: 'white',
  justifyContent: 'space-between',
  boxShadow: '0 0.1rem 0.2rem -0.1rem rgba(0, 0, 0, 0.1)',
  filter: 'drop-shadow(0 0.1rem 0.3rem rgba(0, 0, 0, 0.1))',

  lg: {
    flexDirection: 'row',
  }
});

export const cardInner = css({
  flex: 1,
  gap: '0.8rem',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
});

export const divider = css({
  width: '100%',
  height: '0.1rem',
  backgroundColor: 'void.20',

  lg: {
    width: '0.1rem',
    height: '100%',
  }
});