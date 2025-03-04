import { css } from '../../styled-system/css';

export const footer = css({
  width: '100%',
  height: '41.6rem',
  minHeight: '41.6rem',
  backgroundColor: '#020617',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  gap: '3.2rem',

  lg: {
    gap: '4rem',
    height: '21.6rem',
    minHeight: '21.6rem',
  }
});

export const navLinks = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.6rem',

  '& a': {
    color: '#fff',
    fontSize: '1.4rem',
    fontWeight: 400,

    '&:hover': {
      textDecoration: 'underline',
    }
  },

  lg: {
    gap: '4rem',
    flexDirection: 'row',
  }
});

export const socials = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.6rem',

  '& svg': {
    fill: '#CBD5E1',
    fontSize: '2rem',
  }
});

export const copyright = css({
  fontSize: '1.4rem',
  fontWeight: 400,
  color: '#CBD5E1',
});