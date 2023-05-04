import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { Typography } from "@mui/material";
import Image from "next/image";

import LogoDedo from "../../../../public/assets/logoDedo.png";
import { TextBody, TextBodyTiny } from "../typography";

export const CardAuth = ({
  title,
  subTitle,
  subTitle2,
  children,
  lading,
  ladingWidth,
  ladingHeight,
  icon,
}: any) => {
  return (
    <div>
      {lading && (
        <div
          style={{ position: "fixed", top: "40vh", left: "10vh", zIndex: "-1" }}
        >
          <Image
            src={lading?.src}
            alt="Lading"
            width={ladingWidth ? ladingWidth : "500"}
            height={ladingHeight ? ladingHeight : "500"}
          />
        </div>
      )}
      <div
        style={{
          background: "white",
          border: "1px solid #E2E2E2",
          borderRadius: "4px 4px 0 0",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "#F8F8F8",
            borderRadius: "4px 4px 0 0",
            padding: "13px 25px 0px 25px",
            boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.161)",
          }}
        >
          <div style={{ marginRight: "15px", marginTop: "-3px" }}>
            <Image src={LogoDedo.src} alt="Logo" width="40" height="40" />
          </div>
          <Typography
            color="primary"
            sx={{ fontWeight: "700", fontSize: "24px" }}
          >
            {title}
          </Typography>
        </div>
        <div style={{ padding: "25px 10px 10px 10px" }}>
          {icon && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "25px",
              }}
            >
              {icon}
            </div>
          )}
          {subTitle && (
            <>
              <div style={{ padding: "35px 35px 0px 35px" }}>
                <TextBody textCenter>{subTitle}</TextBody>
              </div>
              <br />
            </>
          )}
          {subTitle2 && (
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <LogoutOutlinedIcon
                  color="primary"
                  sx={{
                    fontSize: "13px",
                    marginRight: "4px",
                    marginTop: "3px",
                    transform: "rotate(180deg)",
                  }}
                />
                <TextBodyTiny colorPrimary textCenter>
                  <span style={{ fontWeight: "bold" }}>{subTitle2}</span>
                </TextBodyTiny>
              </div>
              <br />
            </>
          )}
          <div style={{ padding: "0px 15px 25px 15px" }}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export const CardAuthFooter = ({ children }: any) => {
  return (
    <div
      style={{
        padding: "25px 45px 35px 45px",
        border: "1px solid #E2E2E2",
        borderRadius: "0px 0px 4px 4px",
        background: "#F8F8F8",
      }}
    >
      {children}
    </div>
  );
};
