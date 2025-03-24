import { css } from '../../styled-system/css';

export const tableContainer = css({
  width: '100%',
  overflow: 'auto',
  position: 'relative',
});

export const table = css({
  width: '100%',
  overflowX: 'auto',
});

export const tableHead = css({
  color: 'void.40',
  fontSize: 'sm',
  textAlign: 'left',
  verticalAlign: 'middle',
  padding: '2.4rem 0 1.2rem 0',
  borderBottom: '1px solid token(colors.void.20)',
  '& th': {
    fontWeight: 400,
    textAlign: 'right',
    '&:first-child': {
      textAlign: 'left'
    },
    '&[aria-label="leaderboard-table-head"]': { 
      '&:nth-child(2)': {
      textAlign: 'left'
      }
    }
  },
});

export const tableBody = css({
  height: '1rem',
});

export const tableCell = css({
  padding: '1.2rem 0',
  height: '5.3rem',
  fontWeight: 400,
  fontSize: 'sm',
  color: 'void.80',
  borderBottom: '0.1rem solid token(colors.void.20)',
  textAlign: 'right',
  '&:first-child': {
    textAlign: 'left'
  },
  '&[aria-label="leaderboard-table-cell"]': {
    '&:nth-child(1)': {
      textAlign: 'left'
    }
  }
});

export const stakeTableCell = css({
  verticalAlign: 'top',
  '&:first-child': {
    textAlign: 'left'
  }
});

export const penaltyText = css({
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 400,
  color: 'red.600',
});

export const userWalletText = css({
  color: 'green.70',
});

export const pagination = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1.2rem',
  marginTop: '1.8rem',
});

export const paginationButton = css({
  border: '0.1rem solid token(colors.void.40)',
  borderRadius: '0.4rem',
  padding: '0.4rem 0.6rem',
  cursor: 'pointer',
  height: '3.2rem',
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
});

export const paginationText = css({
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 400,
  color: 'void.60',
});

export const title = css({
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 400,
  color: 'void.80',
});

export const sortByLabel = css({
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 500,
  color: 'void.80',
});

export const flexRow = css({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: '1.2rem',
});