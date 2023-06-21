import Grid from "@mui/material/Grid";
import React from "react";

interface IPropsContainer {
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
}: IPropsContainer) => (
  <Grid
    container
    spacing={spacing ? spacing : 2}
    direction="row"
    justifyContent={justifyCenter ? "center" : "flex-start"}
    marginY={marginY ? 1 : "none"}
    flexDirection={flexDirection ? flexDirection : null}
  >
    {children}
  </Grid>
);

interface IPropsItem {
  children?: React.ReactNode;
  sx?: any;
  sm?: number;
  md?: number;
  lg?: number;
}

export const GridItem = ({
  children,
  sx,
  sm = 12,
  md = 6,
  lg = 4,
}: IPropsItem) => (
  <Grid item sx={sx ? sx : null} xs={12} sm={sm} md={md} lg={lg}>
    {children}
  </Grid>
);
