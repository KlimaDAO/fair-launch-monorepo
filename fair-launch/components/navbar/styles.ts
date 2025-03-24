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

export const fullScreenMenu = css({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255,255,255,0.98)',
  color: 'black',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: '2rem',
  justifyContent: 'flex-start',
  zIndex: 1000,
});

export const closeButton = css({
  position: 'absolute',
  top: '1.8rem',
  right: '2.2rem',
  background: 'none',
  border: 'none',
  color: 'black',
  fontSize: '2rem',
  cursor: 'pointer',
});

export const nav = css({
  listStyle: 'none',
  padding: '0',
  marginTop: '6.4rem',

  '& li': {
    margin: '1.2rem 0',

    '& a': {
      color: 'black',
      textDecoration: 'none',
      fontSize: '2.4rem',
    }
  },

  '& div': {
    fontSize: '2.4rem',
  }
});