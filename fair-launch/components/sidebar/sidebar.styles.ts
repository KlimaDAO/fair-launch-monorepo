import { css } from '../../styled-system/css';

export const sidebar = css({
  width: '22.4rem',
  display: 'none',
  height: '100%',
  padding: '2.4rem 1.2rem',
  backgroundColor: 'white',
  borderRight: '0.1rem solid #C3C3C3',
  flexDirection: 'column',
  gap: '4rem',

  lg: {
    display: 'flex',
  }
});

export const title = css({
  fontSize: '1.8rem',
  fontWeight: 400,
  color: 'green.70',
  textAlign: 'center',
  fontFamily: 'var(--font-fira-code)',
  borderTop: '0.1rem solid #C3C3C3',
  borderBottom: '0.1rem solid #C3C3C3',
  padding: '2rem 0'
});

export const navLinks = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
});

export const activeLink = css({
  color: 'void.80',
  fontWeight: 700,
  backgroundColor: 'void.10',
  '& svg': {
    fill: 'void.60'
  }
});

export const navLink = css({
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  color: 'void.80',
  padding: '0.6rem 0.4rem',
  borderRadius: '0.4rem',
  
  '& svg': {
    fontSize: '2rem',
    fill: 'void.50'
  }
});