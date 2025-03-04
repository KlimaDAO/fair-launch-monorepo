import { css } from '../../styled-system/css';

export const card = css({
  minWidth: '27rem',
  backgroundColor: '#64748B',
  borderRadius: '0.4rem',
  padding: '1.6rem'
});

export const buttons = css({
  margin: '1.6rem 0',
  gap: '0.8rem',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between'
});

export const backButton = css({
  cursor: 'pointer',
  fontSize: '1.4rem',
  fontWeight: '500',
  backgroundColor: 'transparent',
  border: '0.1rem solid white',
  color: '#fff',
  height: '2.8rem',
  width: '100%',
  padding: '0 1.2rem',
  borderRadius: '0.4rem'
});

export const nextButton = css({
  cursor: 'pointer',
  fontSize: '1.4rem',
  fontWeight: '500',
  backgroundColor: '#fff',
  color: '#000',
  height: '2.8rem',
  width: '100%',
  padding: '0 1.2rem',
  border: 'none',
  borderRadius: '0.4rem'
});

export const steps = css({
  fontSize: '1.2rem',
  fontWeight: '400',
  color: '#fff',
  textAlign: 'center'
});