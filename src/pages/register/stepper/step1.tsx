import { yupResolver } from "@hookform/resolvers/yup";
// import ReCAPTCHA from "react-google-recaptcha";
import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
import * as yup from "yup";

import { GridContainer, GridItem } from "@/components/elements/grid";
import LoadingBackdrop from "@/components/elements/loadingBackdrop";
import { CitizensBasicInformationResponse } from "@/pages/api/types";
import { TextBody } from "@/components/elements/typography";
import { AlertWarning } from "@/components/elements/alert";
import { ButtonApp } from "@/components/elements/button";
import { FormControlApp } from "@/components/form/input";
import { InputApp } from "@/themes/form/input";
import { labels } from "@/constants/labels";

// export async function getServerSideProps(context: any) {
//   const NEXT_PUBLIC_SITE_KEY = process.env["NEXT_PUBLIC_SITE_KEY"];
//   return {
//     props: {
//       siteKey: NEXT_PUBLIC_SITE_KEY,
//     },
//   };
// }

interface IFormInputs {
  cedula: string;
}

const schema = yup.object({
  cedula: yup
    .string()
    .trim()
    .required(labels.form.requiredField)
    .min(11, "Debe contener 11 dígitos"),
});

export default function Step1({ setInfoCedula, handleNext /*siteKey*/ }: any) {
  // const captchaRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);

  // const configReCaptcha = {
  //   sitekey: "6LfS1ZUlAAAAAC5zuDE_kO6SDBXM2RLAf2ZmJaZG",
  //   ref: captchaRef,
  // };

  const handleChange = (e: any) => {
    const cedulaValue = e.target.value
      .replace(/\D/g, "")
      .match(/(\d{0,3})(\d{0,7})(\d{0,1})/);
    e.target.value = !cedulaValue[2]
      ? cedulaValue[1]
      : `${cedulaValue[1]}-${cedulaValue[2]}${`${
          cedulaValue[3] ? `-${cedulaValue[3]}` : ""
        }`}${`${cedulaValue[4] ? `-${cedulaValue[4]}` : ""}`}`;
    const numbers = e.target.value.replace(/(\D)/g, "");
    setValue("cedula", numbers);
  };

  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<IFormInputs>({
    reValidateMode: "onSubmit",
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: IFormInputs) => {
    // const tokenCaptcha = captchaRef.current.getValue();

    // if (!tokenCaptcha) {
    //   return AlertWarning(
    //     "Necesitamos verificar que no eres un robot. Por favor complete el control de seguridad"
    //   );
    // }

    setLoading(true);

    const fetcher = async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();

      if (res.status !== 200) {
        throw new Error(data.message);
      }
      return data;
    };

    fetcher(`/api/citizens/${data.cedula}`)
      .then((citizen: CitizensBasicInformationResponse) => {
        setInfoCedula(citizen);
        handleNext();
      })
      .catch(() => {
        AlertWarning("Cédula invalida");
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      {loading && <LoadingBackdrop />}
      <br />
      <TextBody textCenter>Por favor completa el siguiente campo.</TextBody>

      <form onSubmit={handleSubmit(onSubmit)}>
        <GridContainer marginY>
          <GridItem md={12} lg={12}>
            <FormControlApp
              label="Coloca tu Cédula"
              msg={errors.cedula?.message}
              tooltip="Identidad de Usuario"
              tooltipText="Para iniciar el proceso de validar tu identidad, coloca el número de tu cédula."
              required
            >
              <InputApp
                placeholder="*** - **00000 - 0"
                onPaste={(e) => {
                  e.preventDefault();
                  return false;
                }}
                onCopy={(e) => {
                  e.preventDefault();
                  return false;
                }}
                autoComplete="off"
                onChange={(e) => handleChange(e)}
              />
            </FormControlApp>
          </GridItem>

          <GridItem md={12} lg={12}>
            <div
              style={{
                width: "100%",
                margin: "5px 0 22px 0",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {/* <ReCAPTCHA {...configReCaptcha} /> */}
            </div>
          </GridItem>

          <GridItem md={12} lg={12}>
            <ButtonApp submit>CONFIRMAR</ButtonApp>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
