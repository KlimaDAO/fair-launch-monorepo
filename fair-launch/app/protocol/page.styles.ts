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
  color: '#020617',  // todo - variable
  fontSize: '3.6rem',
  lineHeight: '4rem',
  fontWeight: 700,
});

export const twoCols = css({
  gap: '2rem',
  display: 'flex',
  alignItems: 'baseline',
  flexDirection: 'column',
  justifyContent: 'space-between',

  lg: {
    alignItems: 'center',
    flexDirection: 'row',
  }
});

export const card = css({
  width: '100%',
  backgroundColor: '#fff',

  boxShadow: '0 0.1rem 0.2rem -0.1rem rgba(0, 0, 0, 0.1)',
  filter: 'drop-shadow(0 0.1rem 0.3rem rgba(0, 0, 0, 0.1))',
  borderRadius: '0.8rem',

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',

  lg: {
    flexDirection: 'row',
  }
});

export const cardInner = css({
  flex: 1,
  padding: '2rem',
  display: 'flex',
  gap: '0.8rem',
  flexDirection: 'column',
  justifyContent: 'space-between'
});

export const cardTitle = css({
  fontSize: '1.6rem',
  fontWeight: 400,
  color: '#64748B',
});

export const cardContents = css({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between'
})

export const divider = css({
  height: '100%',
  width: '0.1rem',
  backgroundColor: '#cbd5e1',
});