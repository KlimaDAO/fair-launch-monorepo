import { css } from '../../styled-system/css';

export const contentContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  fontSize: '1.2rem',
  fontWeight: 400,
  color: 'white',
  fontFamily: 'var(--font-inter)',

  '& div': {
    fontSize: '1.2rem',
    fontWeight: 400
  }
})
