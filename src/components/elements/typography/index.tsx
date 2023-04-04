import React from 'react'
import { Typography } from "@mui/material"

interface IProps {
    children: React.ReactNode
    required?: boolean
    notBold?: boolean
    notGutterBottom?: boolean
    noWrap?: boolean
    textCenter?: boolean
    colorPrimary?: boolean
    bold?: boolean
}

export const TextTitle = ({ children }: IProps) => {
    return (
        <Typography color="primary" sx={{ fontWeight: "500", fontSize: "34px", lineHeight: "48px" }} gutterBottom>
            {children}
        </Typography>
    )
}

export const TextSubTitle = ({ children }: IProps) => {
    return (
        <Typography color="primary" sx={{ fontWeight: "500", fontSize: "20px", lineHeight: "25px" }}>
            {children}
        </Typography>
    )
}

export const TextSubTitleBody = ({ children }: IProps) => {
    return (
        <Typography sx={{ fontWeight: "400", color: "#433E3E", fontSize: "18px", lineHeight: "27.57px" }}>
            {children}
        </Typography>
    )
}

export const TextBody = ({ children, textCenter, bold }: IProps) => {
    return (
        <Typography variant="body2" color="primary" sx={{ fontSize: "16px", fontWeight: `${bold ? "600" : "500"}`, textAlign: `${textCenter ? 'center' : 'left'}` }}>
            {children}
        </Typography>
    )
}

export const TextBodyTiny = ({ children, textCenter, colorPrimary }: IProps) => {
    return (
        <Typography color={`${colorPrimary ? 'primary' : '#231F20'}`} sx={{ fontSize: "14px", fontWeight: "400",  textAlign: `${textCenter ? 'center' : 'left'}`, lineHeight: "21px" }}>
            {children}
        </Typography>
    )
}

// export const TextLabel = ({ children, required }: IProps) => {
//     return (
//         <Typography sx={{ fontSize: "15px", fontWeight: "500" }}>
//             {children} {required && <span style={{color: "#EE2A24"}}>*</span>}
//         </Typography>
//     )
// }

// export const TextSubTitleCard = ({ children }: IProps) => {
//     return (
//         <Typography variant="h6" sx={{ textTransform: "uppercase", fontSize: "16px", fontWeight: "bold" }}>
//             {children}
//         </Typography>
//     )
// }

// export const TextBodyTiny = ({ children }: IProps) => {
//     return (
//         <Typography variant="body2" style={{color: "#808080"}}>
//             {children}
//         </Typography>
//     )
// }

// export const TextBodyTinyTitle = ({ children, notBold, notGutterBottom, noWrap }: IProps) => {
//     return (
//         <Typography noWrap={noWrap ? true : false} variant="body2" color="primary" sx={{fontWeight: `${notBold ? "normal" : "bold"}`}} gutterBottom={notGutterBottom ? false : true}>
//             {children}
//         </Typography>
//     )
// }

// export const TextBodyTinyDetails = ({ children }: IProps) => {
//     return (
//         <Typography variant="body2">
//             {children}
//         </Typography>
//     )
// }

// export const TextBody = ({ children }: IProps) => {
//     return (
//         <Typography variant="body1" gutterBottom>
//             {children}
//         </Typography>
//     )
// }

// export const TextBodyBig = ({ children }: IProps) => {
//     return (
//         <Typography variant="h6" gutterBottom component="div">
//             {children}
//         </Typography>
//     )
// }

// export const TextErrorLabel = ({ children }: IProps) => {
//     return (
//         <Typography variant="caption" color="error">
//             {children}
//         </Typography>
//     )
// }

// export const TextErrorInput = ({ msg }: any) => {
//     return (
//         <Typography variant="caption" color="error">
//             {msg && msg}{'\u00A0'}
//         </Typography>
//     )
// }
