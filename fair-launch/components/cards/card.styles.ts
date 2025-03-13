import { css } from '../../styled-system/css';

export const card = css({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '0.8rem',
  backgroundColor: 'white',
  filter: 'drop-shadow(0 0.1rem 0.3rem rgba(0, 0, 0, 0.1))',
  boxShadow: '0 0.1rem 0.2rem -0.1rem rgba(0, 0, 0, 0.1)',
  justifyContent: 'space-between',

  lg: {
    flexDirection: 'row',
  }
});