
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
  fontSize: '1.4rem',
  textAlign: 'left',
  verticalAlign: 'middle',
  padding: '2.4rem 0 1.2rem 0',
  borderBottom: '1px solid token(colors.void.20)',
  '& th': {
    fontWeight: '400',
  },
});

export const tableBody = css({
  height: '1rem',
});

export const tableCell = css({
  padding: '1.6rem 0',
  textAlign: 'left',
  verticalAlign: 'middle',
  fontWeight: '400',
  fontSize: '1.4rem',
  color: 'void.80',
  borderBottom: '1px solid token(colors.void.20)',
});