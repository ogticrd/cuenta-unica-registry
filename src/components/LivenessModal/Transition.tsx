import { TransitionProps } from '@mui/material/transitions';
import { Slide } from '@mui/material';
import { forwardRef } from 'react';

export const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});
