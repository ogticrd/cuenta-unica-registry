import { useState } from "react";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import LockIcon from "@mui/icons-material/Lock";
import PermContactCalendarIcon from "@mui/icons-material/PermContactCalendar";

import LandingChica from "../../../../public/assets/landingChica.png";

import { CardAuth, CardAuthFooter } from "@/components/elements/cardAuth";
import { GridContainer, GridItem } from "@/components/elements/grid";
import {
  TextBodyTiny,
  TextSubTitle,
  TextSubTitleBody,
  TextTitle,
} from "@/components/elements/typography";

import { FormControlApp } from "@/components/form/input";
import { InputApp } from "@/themes/form/input";
import { ButtonApp } from "@/components/elements/button";
import { routes } from "@/constants/routes";
import BoxContentCenter from "@/components/elements/boxContentCenter";
import { labels } from "@/constants/labels";
import { Typography } from "@mui/material";

export default function Index() {
  const router = useRouter();

  return (
    <BoxContentCenter>
      <CardAuth
        title="Seleccionar Método de Acceso"
        subTitle="Selecciona la opción de inicio de sesión"
        subTitle2="correo@usuario.com"
        landing={LandingChica}
      >
        <GridContainer>
          <GridItem md={12} lg={12}>
            <div
              onClick={() => router.push("password")}
              style={{
                border: "1px solid #E5E5E5",
                cursor: "pointer",
                borderRadius: "6px",
                padding: "14px 12px",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              <LockIcon
                sx={{ fontSize: "28px", marginRight: "12px" }}
                color="info"
              />
              <div>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: "bold" }}
                  gutterBottom
                >
                  Contraseña
                </Typography>
                <Typography variant="body2" color="primary">
                  Iniciar sesión ingresando contraseña.
                </Typography>
              </div>
            </div>
          </GridItem>

          <GridItem md={12} lg={12}>
            <div
              onClick={() => router.push("code")}
              style={{
                border: "1px solid #E5E5E5",
                cursor: "pointer",
                borderRadius: "6px",
                padding: "14px 12px",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              <PermContactCalendarIcon
                sx={{ fontSize: "28px", marginRight: "12px" }}
                color="info"
              />
              <div>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: "bold" }}
                  gutterBottom
                >
                  Código Autenticador
                </Typography>
                <Typography variant="body2" color="primary">
                  Ingrese un código de verificación de la aplicación de
                  autenticación activa.
                </Typography>
              </div>
            </div>
          </GridItem>
        </GridContainer>
      </CardAuth>
    </BoxContentCenter>
  );
}
