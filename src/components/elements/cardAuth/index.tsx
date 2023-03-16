import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Typography } from "@mui/material"
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

import LogoCuentaUnica from "../../../../public/assets/logoCuentaUnica.png"
import { TextBody, TextBodyTiny } from '../typography';

export const CardAuth = ({ title, subTitle, subTitle2, children, lading }: any) => {

    return (
        <div>
            {lading &&
                <div style={{ position: "fixed", top: "40vh", left: "10vh", zIndex: "-1" }}>
                    <img src={lading?.src} alt="Lading" width="500" />
                </div>
            }
            <div style={{ textAlign: "center" }}>
                <img src={LogoCuentaUnica.src} alt="Logo" width="300" />
            </div>
            <br />
            <div style={{ background: "white", border: "1px solid #E2E2E2", borderRadius: "4px 4px 0 0" }}>
                <div style={{ display: "flex", background: "#F8F8F8", borderRadius: "4px 4px 0 0", padding: "10px 25px", boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.161)" }}>
                    <AccountCircleOutlinedIcon color="primary" sx={{ margin: "4px 10px 0 0" }} />
                    <Typography variant="h6" color="primary" sx={{ fontWeight: "bold", fontSize: "20px" }}>
                        {title}
                    </Typography>
                </div>
                <div style={{ padding: "25px 10px 10px 10px" }}>
                    {subTitle &&
                        <>
                            <div style={{ padding: "35px 35px 0px 35px" }}>
                                <TextBody textCenter>
                                    {subTitle}
                                </TextBody>
                            </div>
                            <br />
                        </>
                    }
                    {subTitle2 &&
                        <>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <LogoutOutlinedIcon color="primary" sx={{ fontSize: "13px", marginRight: "4px", marginTop: "3px", transform: "rotate(180deg)" }} />
                                <TextBodyTiny colorPrimary textCenter>
                                    <span style={{ fontWeight: "bold" }}>{subTitle2}</span>
                                </TextBodyTiny>
                            </div>
                            <br />
                        </>
                    }
                    <div style={{ padding: "0px 35px 25px 35px" }}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const CardAuthFooter = ({ children }: any) => {

    return (
        <div style={{ padding: "25px 45px 35px 45px", border: "1px solid #E2E2E2", borderRadius: "0px 0px 4px 4px", background: "#F8F8F8" }}>
            {children}
        </div>
    )
}