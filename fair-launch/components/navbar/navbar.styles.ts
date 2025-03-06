import { css } from '../../styled-system/css';

export const navbar = css({
  height: '5.2rem',
  backgroundColor: 'slate.950',
  alignItems: 'center',
  display: 'none', // hide for now...
});

export const marquee = css({
  padding: '0 2rem',
  '& div': {
    gap: '2rem',
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.4rem',
    fontWeight: 400,
    color: 'slate.500'
  }
});