import { css } from '../../styled-system/css';

export const navbar = css({
  height: '6.4rem',
  backgroundColor: 'white',
  padding: '1.7rem 1.6rem',
  boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',

  md: {
    display: 'none',
  }
});

export const menuContainer = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '4rem',
  height: '4rem',
  borderRadius: '50%',
  backgroundColor: 'void.80',
});

export const menuIcon = css({
  fontSize: '2rem',
  color: 'white',
});
