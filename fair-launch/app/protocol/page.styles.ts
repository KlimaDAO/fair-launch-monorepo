import { css } from '../../styled-system/css';

export const container = css({
  display: 'flex',
  height: '100vh',
});

export const main = css({
  flex: 1,
  gap: 0,
  display: 'flex',
  flexDirection: 'column',
  width: 'calc(100% - 224px)'
});

export const content = css({
  flex: 1,
  gap: '2rem',
  display: 'flex',
  padding: '3.6rem 4rem',
  flexDirection: 'column',
});

export const titleContainer = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2.4rem',
});

export const title = css({
  color: '#020617',  // todo - variable
  fontSize: '3.6rem',
  lineHeight: '4rem',
  fontWeight: 700,
});

export const twoCols = css({
  display: 'flex',
  gap: '2rem',
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',
});

export const card = css({
  width: '100%',
  backgroundColor: '#fff',

  boxShadow: '0 0.1rem 0.2rem -0.1rem rgba(0, 0, 0, 0.1)',
  filter: 'drop-shadow(0 0.1rem 0.3rem rgba(0, 0, 0, 0.1))',
  borderRadius: '0.8rem',

  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between'
});

export const cardInner = css({
  flex: 1,
  padding: '2rem',
  display: 'flex',
  gap: '0.8rem',
  flexDirection: 'column',
  justifyContent: 'space-between'
});

export const divider = css({
  height: '100%',
  width: '0.1rem',
  backgroundColor: '#cbd5e1',
});

export const fairLaunchButton = css({
  backgroundColor: '#22c55e',
  color: '#fff',
  borderRadius: '0.4rem',
  border: 'none',
  padding: '0.8rem 2.4rem',
  fontSize: '1.6rem',
  fontWeight: 500,
  height: '4rem',
});
