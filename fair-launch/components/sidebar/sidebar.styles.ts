import { css } from '../../styled-system/css';

export const sidebar = css({
  width: '22.4rem',
  display: 'none',
  height: '100%',
  padding: '2.4rem 1.2rem',
  backgroundColor: '#fff',
  borderRight: '0.1rem solid #cbd5e1',
  flexDirection: 'column',
  gap: '4rem',
  
  lg: {
    display: 'flex',
  }
});

export const title = css({
  fontSize: '1.8rem',
  fontWeight: '400',
  color: '#16A34A',
  textAlign: 'center',
  fontFamily: 'var(--font-fira-code)',
  borderTop: '0.1rem solid #CBD5E1',
  borderBottom: '0.1rem solid #CBD5E1',
  padding: '2rem 0'
});

export const navLinks = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
});

export const activeLink = css({
  color: '#020617',
  fontWeight: 700,
  backgroundColor: '#F1F5F9',
  '& svg': {
    fill: '#64748B'
  }
});

export const navLink = css({
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  color: '#020617',
  padding: '0.6rem 0.4rem',
  borderRadius: '0.4rem',
  
  '& svg': {
    fontSize: '2rem',
    fill: '#94A3B8'
  }
});