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
  padding: '1.2rem 0 1.2rem 0',
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

export const paginationButtons = css({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',

  lg: {
    width: 'unset',
  }
});

export const paginationButton = css({
  border: '0.1rem solid token(colors.void.40)',
  padding: '0 2.4rem',
  cursor: 'pointer',
  height: '4.8rem',
  minWidth: '4.8rem',
  borderRadius: '0.4rem',
  fontWeight: 500,

  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },

  lg: {
    height: '3.2rem',
    minWidth: '3.4rem',
    borderLeft: 'none',
    borderRadius: '0',
    padding: '0 0.6rem',
    fontWeight: 400,

    '&:first-child': {
      padding: '0.4rem 0.6rem',
      borderLeft: '0.1rem solid token(colors.void.40)',
      borderRadius: '0.4rem 0 0 0.4rem',
    },
    '&:last-child': {
      padding: '0.4rem 0.6rem',
      borderRadius: '0 0.4rem 0.4rem 0',
    },
  }
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
  alignItems: 'flex-start',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: '1.2rem',

  lg: {
    alignItems: 'center',
  }
});

export const active = css({
  backgroundColor: 'void.80',
  color: 'white',
});

export const updatedText = css({
  marginTop: '0.8rem',
  fontSize: 'xs',
  color: 'void.60',
  fontWeight: 400,
  textAlign: 'center',
  width: '100%',

  lg: {
    textAlign: 'left',
    marginTop: '2rem',
  }
});