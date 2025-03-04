
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
  color: '#020617',
  fontSize: '1.4rem',
  textAlign: 'left',
  verticalAlign: 'middle',
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
  color: '#020617',
  borderBottom: '1px solid #E2E8F0',
});