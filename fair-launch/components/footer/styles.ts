import { css } from '../../styled-system/css';

export const footer = css({
  width: '100%',
  height: '27.6rem',
  minHeight: '27.6rem',
  backgroundColor: 'void.80',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  gap: '4rem',

  lg: {
    gap: '4rem',
    height: '10rem',
    minHeight: '10rem',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '0 4rem',
  }
});

export const navLinks = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4rem',

  '& a': {
    color: 'white',
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

export const protocolLink = css({
  fontSize: 'sm !important',
  fontWeight: '700 !important',
  color: 'green.40 !important',
});

export const links = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4rem',

  lg: {
    flexDirection: 'row',
  }
});

export const socialsContainer = css({
  gap: '4rem',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column-reverse',

  lg: {
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
    fill: 'void.20',
    fontSize: '2rem',
  },

  '& a': {
    '& svg': {
      '&:hover': {
        fill: 'white',
        transition: 'all 1s ease',
      }
    }
  }
});

export const copyright = css({
  fontSize: '1.4rem',
  fontWeight: 400,
  color: 'void.20',
});