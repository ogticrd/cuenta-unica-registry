import {
  TextSubTitle,
  TextSubTitleBody,
  TextTitle,
} from "@/components/elements/typography";
import LadingChica2 from "../../../public/assets/ladingChica2.png";
import { GridContainer, GridItem } from "@/components/elements/grid";
import { CardAuth } from "@/components/elements/cardAuth";
import StepperRegister from "./stepper";
import Image from "next/image";

export default function Index() {
  return (
    <GridContainer spacing={10} flexDirection={{ xs: "column", sm: "row" }}>
      <GridItem sx={{ order: { xs: 2, sm: 1 } }} sm={12} md={6} lg={6}>
        <TextTitle>
          ¡Bienvenido a la Plataforma Única de Autenticación{" "}
          <span className="text-error">Ciudadana!</span>
        </TextTitle>
        <TextSubTitle>
          Accede o regístrate con un único usuario y contraseña, para solicitar
          o consultar todos tus servicios y trámites gubernamentales.
        </TextSubTitle>
        <br />
        <TextSubTitleBody>
          Una manera fácil y cómoda de identificarte, para realizar trámites
          desde tu computadora o celular sin necesidad de trasladarte a los
          organismos gubernamentales.
        </TextSubTitleBody>
        <br />
        <Image src={LadingChica2.src} alt="Lading Home" width="100" />
      </GridItem>

      <GridItem sx={{ order: { xs: 1, sm: 2 } }} sm={12} md={6} lg={6}>
        <CardAuth title="Registrar Cuenta Única Ciudadana">
          <StepperRegister />
        </CardAuth>
      </GridItem>
    </GridContainer>
  );
}
