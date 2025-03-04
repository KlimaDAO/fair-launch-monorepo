import { css } from '../../styled-system/css';

export const trigger = css({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '0.4rem',
  padding: '0 1.5rem',
  fontSize: '1.4rem',
  lineHeight: 1,
  height: '4rem',
  gap: '5px',
  minWidth: '20rem',
  backgroundColor: 'white',
  color: '#64748B',
  cursor: 'pointer',
  border: '0.1rem solid #94A3B8',

  '&:hover': {
    // backgroundColor: 'grey',
  },
  '&:focus': {
    // boxShadow: '0 0 0 0.1rem #94A3B8',
  },
  '&[data-placeholder]': {
    color: '#64748B',
  }
});

export const icon = css({
  fontSize: '2rem',
  color: '#64748B',
});

export const content = css({ 
  cursor: 'pointer',
  overflow: 'hidden',
  backgroundColor: 'white',
  borderRadius: '0.4rem',
  width: 'var(--radix-select-trigger-width)',
	maxHeight: 'var(--radix-select-content-available-height)',
  border: '0.1rem solid #94A3B8',
  boxShadow:
    '0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)',

  '& span > svg': {
    display: 'none !important',
  }
});

export const viewport = css({
  padding: '5px',
});

export const item = css({
  fontSize: '1.4rem',
  lineHeight: '2rem',
  color: '#64748B',
  display: 'flex',
  alignItems: 'center',
  height: '35px',
  padding: '0 10px 0 10px',
  position: 'relative',
  userSelect: 'none',
  '&[data-disabled]': {
    color: 'var(--mauve-8)',
    pointerEvents: 'none',
  },
  '&[data-highlighted]': {
    outline: 'none',
    backgroundColor: '#64748',
    color: '#64748B'
  }
});

export const itemIndicator = css({
  position: 'absolute',
  left: '0',
  width: '25px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const scrollButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '25px',
  backgroundColor: 'white',
  color: '#64748B',
  cursor: 'default',
});
