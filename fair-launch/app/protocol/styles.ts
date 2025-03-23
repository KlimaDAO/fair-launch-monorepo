import { css } from '../../styled-system/css';

export const body = css({
  backgroundColor: 'var(--background-secondary)',
});

export const container = css({
  display: 'flex',
  height: '100vh',
});

export const main = css({
  flex: 1,
  gap: 0,
  display: 'flex',
  overflowY: 'auto',
  flexDirection: 'column',
  width: 'calc(100% - var(--sidebar-width))'
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
  display: 'flex',
  borderRadius: '0.8rem',
  flexDirection: 'column',
  backgroundColor: 'white',
  boxShadow: '0 0.1rem 0.2rem -0.1rem rgba(0, 0, 0, 0.1)',
  filter: 'drop-shadow(0 0.1rem 0.3rem rgba(0, 0, 0, 0.1))',
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
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 400,
  color: 'void.80',
});

export const cardContents = css({
  display: 'flex',
  alignItems: 'baseline',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '1.2rem',

  lg: {
    flexDirection: 'row',
  }
});

export const sortByLabel = css({
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 500,
  color: 'void.80',
});

export const mainText = css({
  fontSize: '2rem',
  fontWeight: 700,
  color: 'void.80',
});

export const secondaryText = css({
  fontSize: '1.4rem',
  fontWeight: 400,
  color: 'void.50',
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

export const leaderboardTable = css({
  '& th': {
    textAlign: 'right',
    '&:first-child': {
      textAlign: 'left',
      width: '8rem'
    },
    '&:nth-child(2)': {
      textAlign: 'left',
      width: '50%'
    },
    '&:nth-child(3)': {
      width: '15rem'
    },
  },

  '& td': {
    textAlign: 'right',
    verticalAlign: 'top',
    '&:first-child': {
      textAlign: 'left',
      width: '8rem'
    },
    '&:nth-child(2)': {
      textAlign: 'left',
      width: '50%'
    },
    '&:nth-child(3)': {
      width: '15rem'
    },
  }
});
