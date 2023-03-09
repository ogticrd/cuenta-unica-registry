import React from 'react'
import Grid from '@mui/material/Grid';

interface IPropsContainer {
    children: React.ReactNode
    // itemsCenter?: boolean
    marginY?: boolean
    justifyCenter?: boolean
}

export const GridContainer = ({children, marginY, justifyCenter}: IPropsContainer) => (
    <Grid 
        container 
        spacing={2}
        direction="row"
        // alignItems={itemsCenter ? "center" : "flex-start"}
        justifyContent={justifyCenter ? "center" : "flex-start"}
        marginY={marginY ? 1 : "none"}
    >
        {children}
    </Grid>
)

interface IPropsItem {
    children?: React.ReactNode
    sm?: number
    md?: number
    lg?: number
    className?: string
}

export const GridItem = ({children, sm=12, md=6, lg=4}: IPropsItem) => (
    <Grid item xs={12} sm={sm} md={md} lg={lg}>
        {children}
    </Grid>
)