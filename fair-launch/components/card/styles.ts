import { css } from '../../styled-system/css';

export const cardContainer = css({
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

export const card = css({
  flex: 1,
  gap: '0.8rem',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
});