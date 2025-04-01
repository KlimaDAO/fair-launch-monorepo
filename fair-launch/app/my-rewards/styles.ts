import { css } from '../../styled-system/css';

export const body = css({
  backgroundColor: 'var(--background-secondary)',
});

export const container = css({
  display: 'flex',
  height: '100vh',
});

export const main = css({
  gap: 0,
  flex: 1,
  display: 'flex',
  overflowY: 'auto',
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
  fontSize: '2xl',
  fontWeight: 700,
  lineHeight: '2xl',

  lg: {
    fontSize: '4xl',
    lineHeight: '4xl',
  }
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

export const cardTitle = css({
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 400,
  color: 'void.80',
});

export const cardContents = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'baseline',
  justifyContent: 'space-between',
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

export const userWalletText = css({
  color: 'green.70',
});

export const leaderboardLink = css({
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 400,
  marginTop: '1.2rem',
  width: 'fit-content',
  color: 'green.70 !important',
  textDecoration: 'underline',
});

export const penaltyText = css({
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 400,
  color: 'red.600',
});

export const klimaXTitle = css({
  gap: '0.8rem',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const klimaXHelp = css({
  cursor: 'pointer',
  fontSize: '2rem',
});

export const walletAddress = css({
  display: 'flex',
  flexDirection: 'column',
  fontSize: 'base',
  fontWeight: 400,
  borderTop: '0.1rem solid token(colors.void.20)',
  borderBottom: '0.1rem solid token(colors.void.20)',
  padding: '2rem 0',
  color: 'void.80',
  width: '100%',
  alignItems: 'center',
  hideFrom: 'md',

  '& > span': {
    color: 'void.40 !important',
  }
});

export const stakeHistoryContainer = css({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  marginBottom: "1rem",

  '& div': {
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.8rem'
  }
});