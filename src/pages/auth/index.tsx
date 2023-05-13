import { useState } from "react";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import Image from "next/image";
import * as yup from "yup";

import {
  TextBodyTiny,
  TextSubTitle,
  TextSubTitleBody,
  TextTitle,
} from "@/components/elements/typography";
import { CardAuth, CardAuthFooter } from "@/components/elements/cardAuth";
import { GridContainer, GridItem } from "@/components/elements/grid";
import LandingHome from "../../../public/assets/landingHome.svg";
import { ButtonApp } from "@/components/elements/button";
import { FormControlApp } from "@/components/form/input";
import { InputApp } from "@/themes/form/input";
import { routes } from "@/constants/routes";
import { labels } from "@/constants/labels";

interface IFormInputs {
  cedulaOrEmail: string;
}

const schema = yup.object({
  cedulaOrEmail: yup.string().trim().required(labels.form.requiredField),
});

export default function Index() {
  const router = useRouter();

  const [dataItem, setDataItem] = useState<any>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<IFormInputs>({
    reValidateMode: "onSubmit",
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: IFormInputs) => {
    router.push(routes.auth.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <GridContainer spacing={10} flexDirection={{ xs: "column", sm: "row" }}>
        <GridItem sx={{ order: { xs: 2, sm: 1 } }} sm={12} md={6} lg={6}>
          <TextTitle>
            ¡Bienvenido al Sistema de Autenticación Gubernamental{" "}
            <span className="text-error">Ciudadana</span>!
          </TextTitle>
          <TextSubTitle>
            Accede o regístrate con un único usuario y contraseña, para
            solicitar o consultar todos tus servicios y trámites
            gubernamentales.
          </TextSubTitle>
          <br />
          <TextSubTitleBody>
            Una manera fácil y cómoda de identificarte, para realizar trámites
            desde tu computadora o celular sin necesidad de trasladarte a los
            organismos gubernamentales.
          </TextSubTitleBody>
          <br />
          <Image
            src={LandingHome.src}
            alt="Landing Home"
            width="100"
            height="40"
          />
        </GridItem>

        <GridItem sx={{ order: { xs: 1, sm: 2 } }} sm={12} md={6} lg={6}>
          <CardAuth
            title="Acceso Cuenta Única"
            subTitle="Puedes acceder a tu cuenta con tu número de identidad “Cédula” o correo electrónico registrado."
          >
            <GridContainer>
              <GridItem md={12} lg={12}>
                <FormControlApp
                  label="Coloca cédula o correo electrónico"
                  msg={errors.cedulaOrEmail?.message}
                  tooltip="Texto de ejemplo"
                  required
                >
                  <InputApp
                    defaultValue={dataItem.cedula}
                    placeholder="Cédula o Correo Electrónico"
                    {...register("cedulaOrEmail")}
                  />
                </FormControlApp>
              </GridItem>

              <GridItem md={12} lg={12}>
                <ButtonApp submit>INICIAR SESIÓN</ButtonApp>
              </GridItem>
            </GridContainer>
          </CardAuth>
          <CardAuthFooter>
            <TextBodyTiny textCenter>
              <span className="text-secondary text-bold">
                ¿No tienes cuenta?
              </span>{" "}
              Registrate, accede a trámites y servicios del estado dominicano
              con un único usuario y contraseña, de forma segura y confiable.
            </TextBodyTiny>
            <br />
            <ButtonApp
              color="info"
              variant="outlined"
              onClick={() => router.push(routes.register.home)}
            >
              CREAR TU CUENTA UNICA CIUDADANA
            </ButtonApp>
          </CardAuthFooter>
        </GridItem>
      </GridContainer>
    </form>
  );
}
