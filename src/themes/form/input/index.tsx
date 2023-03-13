import { alpha, styled } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';

export const InputApp = styled(InputBase)(({ theme }) => ({
  'label + &': {
    fontSize: 10,
    marginTop: theme.spacing(2.7),
  },
  '& .MuiInputBase-input': {
    borderRadius: 4,
    position: 'relative',
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#2b2b2b',
    // backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#2b2b2b',
    border: '.5px solid #dadada',
    color: "#606060",
    fontSize: 12,
    width: '100%',
    padding: '11px 8px',
    marginBottom: '4px',
    transition: theme.transitions.create([
      'border-color',
      'background-color',
      'box-shadow',
    ]),
    '&:focus': {
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
      borderColor: theme.palette.primary.main,
    },
    '&:disabled': {
      backgroundColor: '#f2f2f2'
    },
  },
}));
