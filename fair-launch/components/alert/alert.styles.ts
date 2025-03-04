import { cva } from '../../styled-system/css';

export const alertVariants = cva({
  base: {
    width: '100%',
    display: 'block',
    fontSize: 'sm',
    lineHeight: 'sm',
    borderRadius: 'sm',
    border: '1px solid',
    padding: '1.2rem',
    textAlign: 'left',
  },
  variants: {
    variant: {
      default: { 
        bg: 'green.50', 
        color: 'black',
        borderColor: 'green.500',
       },
    },
  },
  defaultVariants: {
    variant: 'default',
  }
})