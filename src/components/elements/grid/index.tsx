import type { SxProps, Theme } from '@mui/material';
import Grid from '@mui/material/Grid';
import React from 'react';

interface GridProps {
  children: React.ReactNode;
  marginY?: boolean;
  spacing?: number;
  justifyCenter?: boolean;
  flexDirection?: any;
}

export const GridContainer = ({
  children,
  spacing,
  marginY,
  justifyCenter,
  flexDirection,
}: GridProps) => (
  <Grid
    container
    spacing={spacing ? spacing : 2}
    direction="row"
    justifyContent={justifyCenter ? 'center' : 'flex-start'}
    marginY={marginY ? 1 : 'none'}
    flexDirection={flexDirection ? flexDirection : null}
  >
    {children}
  </Grid>
);

interface Props {
  children?: React.ReactNode;
  sx?: SxProps<Theme> | undefined;
  sm?: number;
  md?: number;
  lg?: number;
}

export const GridItem = ({ children, sx, sm = 12, md = 6, lg = 4 }: Props) => (
  <Grid item sx={sx ? sx : null} xs={12} sm={sm} md={md} lg={lg}>
    {children}
  </Grid>
);
