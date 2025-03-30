import { css } from '../../../styled-system/css';

export const overlay = css({
  background: 'rgba(70, 70, 70, 0.6)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'grid',
  placeItems: 'center',
  overflowY: 'auto'
});

export const confirmOverlay = css({
  backgroundColor: 'void.10',
});

export const content = css({
  minWidth: '30rem',
  background: 'white',
  borderRadius: 'md',
  zIndex: 1000,
  position: 'fixed',
  top: '20%',
  left: '50%',
  transform: 'translate(-50%, -20%)',
  width: '38.2rem',
  maxWidth: '38.2rem',
  maxHeight: '85vh',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
});

export const icon = css({
  backgroundColor: 'red.100',
  borderRadius: '4xl',
  padding: '0.8rem',
  width: '4.8rem',
  height: '4.8rem',
  display: 'flex',
  margin: '0 auto',
  alignItems: 'center',
  justifyContent: 'center',

  '& svg': {
    width: '2rem',
    height: '2rem',
    fill: 'red.600',
  }
});

export const title = css({
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 700,
  color: 'void.80',
  textAlign: 'center',
});

export const description = css({
  fontSize: '1.4rem',
  lineHeight: '2rem',
  fontWeight: '400',
  color: 'void.80',
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
});

export const altDescription = css({
  display: 'block',
  fontSize: '1.4rem',
  lineHeight: '2rem',
  fontWeight: '400',
  color: 'void.80',
  textAlign: 'left',
  flexDirection: 'column',
  gap: '2rem',

  '& div:not(:last-child)': {
    marginBottom: '2rem',
  },

  '& a': {
    color: 'green.70 !important',
    textDecoration: 'underline',
  },
});

export const actions = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
});

export const inputContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',

  '& label': {
    fontSize: 'sm',
    lineHeight: 'sm',
    fontWeight: '500',
    color: 'void.80',
    textAlign: 'left',
  }
});

export const input = css({
  flex: 1,
  gap: '0.8rem',
  display: 'flex',
  height: '4rem',
  width: '100%',
  borderRadius: 'sm',
  border: 'none',
  background: 'void.10',
  padding: '1rem 0.8rem',
  fontSize: 'base',

  '&:focus': {
    outline: 'none',
  }
});

export const primaryButton = css({
  width: '100%',
  backgroundColor: 'red.600',
  color: 'white',
  borderRadius: 'sm',
  border: 'none',
  fontFamily: 'var(--font-inter)',
  fontSize: 'base',
  lineHeight: 'base',
  fontWeight: 500,
  height: '4rem',
  cursor: 'pointer',
});

export const secondaryButton = css({
  width: '100%',
  backgroundColor: 'transparent',
  color: 'void.80',
  border: '0.1rem solid #020617',
  borderRadius: 'sm',
  fontSize: 'base',
  lineHeight: 'base',
  fontFamily: 'var(--font-inter)',
  fontWeight: 500,
  height: '4rem',
  cursor: 'pointer',
});

export const unstakeButton = css({
  backgroundColor: 'transparent',
  color: 'void.80',
  fontSize: 'sm',
  lineHeight: 'sm',
  height: '2.8rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0.4rem',
  gap: '0.8rem',
  cursor: 'pointer',
  width: '100%',
  maxWidth: '8.1rem',
  border: '0.1rem solid token(colors.void.80)',

  '&:hover': {
    color: 'void.80',
  },
});

export const klimaLogo = css({
  fontSize: '2rem',
});

export const inputRow = (error: boolean) => css({
  gap: '0',
  paddingLeft: '1.2rem',
  display: 'flex',
  borderRadius: 'sm',
  flexDirection: 'row',
  justifyContent: 'space-between',
  ...(error ? { border: '0.1rem solid token(colors.red.600)' } : {
    border: '0.1rem solid token(colors.void.50)',
  }),
});

export const infoRowContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
});

export const infoRow = css({
  gap: '0',
  display: 'flex',
  color: 'void.60',
  flexDirection: 'row',
  justifyContent: 'space-between',
});

export const maxButton = css({
  backgroundColor: 'void.60',
  textTransform: 'uppercase',
  padding: '0.8rem 1rem',
  color: 'white',
  borderRadius: '0.3rem',
  border: 'none',
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 700,
  cursor: 'pointer',
});

export const disabled = css({
  opacity: 0.65,
  cursor: 'not-allowed',
});

export const row = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const availableBalance = css({
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 400,
  color: 'void.50',
});

export const errorText = css({
  color: 'red.600',
  fontSize: 'sm',
  lineHeight: 'sm',
  fontWeight: 500,
  textAlign: 'left',
});