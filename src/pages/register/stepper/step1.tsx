import { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from "yup";

import { GridContainer, GridItem } from "@/components/elements/grid";
import { TextBody } from "@/components/elements/typography";
import { FormControlApp } from "@/components/form/input";
import { InputApp } from "@/themes/form/input";
import { labels } from '@/constants/labels';
import { ButtonApp } from '@/components/elements/button';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { cedulaApi } from '@/services/cedula';
import { AlertError, AlertWarning } from '@/components/elements/alert';
import { authApi } from '@/services/app/auth';

interface IFormInputs {
    cedula: string
    // birthDate: string
}

const schema = yup.object({
    cedula: yup.string().trim().required(labels.form.requiredField).min(11, "Debe contener 11 dígitos"),
    // birthDate: yup.string().trim().required(labels.form.requiredField),
})

export default function Step1({ handleNext }: any) {

    const captchaRef = useRef<any>(null);

    const [loading, setLoading] = useState(false)

    const configReCaptcha = {
        sitekey: process.env.NEXT_PUBLIC_SITE_KEY || "",
        ref: captchaRef
    }

    const handleChange = (e: any) => {
        const cedulaValue = e.target.value.replace(/\D/g, '')
            .match(/(\d{0,3})(\d{0,7})(\d{0,1})/);
        e.target.value = !cedulaValue[2]
            ? cedulaValue[1]
            : `${cedulaValue[1]}-${cedulaValue[2]}${`${cedulaValue[3] ? `-${cedulaValue[3]}` : ''
            }`}${`${cedulaValue[4] ? `-${cedulaValue[4]}` : ''}`}`;
        const numbers = e.target.value.replace(/(\D)/g, '');
        setValue("cedula", numbers);
    };

    const { handleSubmit, formState: { errors }, setValue } = useForm<IFormInputs>({
        reValidateMode: 'onSubmit',
        shouldFocusError: false,
        resolver: yupResolver(schema)
    });

    const onSubmit = (data: IFormInputs) => {
        const tokenCaptcha = captchaRef.current.getValue()

        if (!tokenCaptcha) {
            return AlertWarning("Necesitamos verificar que no eres un robot. Por favor complete el control de seguridad")
        }

        setLoading(true)

        authApi.getVerifyUser(data.cedula)
            .then((res) => {
                if (res.data?.data?.exists) {
                    return AlertWarning("La Cédula ya está registrada.")
                } else {
                    cedulaApi.get(data.cedula)
                        .then((res) => {
                            sessionStorage.setItem("infoCedula", JSON.stringify(res.data))
                            handleNext()
                        })
                        .catch(() => AlertWarning("Cédula invalida"))
                }
            })
            .catch(() => AlertError())
            .finally(() => setLoading(false))
    }

    return (
        <>
            {loading && <LoadingBackdrop />}
            <br />
            <TextBody textCenter>
                Por favor completa el siguiente campo.
            </TextBody>

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
                                    e.preventDefault()
                                    return false;
                                }}
                                onCopy={(e) => {
                                    e.preventDefault()
                                    return false;
                                }}
                                autoComplete="off"
                                onChange={(e) => handleChange(e)}
                            />
                        </FormControlApp>
                    </GridItem>

                    <GridItem md={12} lg={12}>
                        {/* <FormControlApp
                            label="Fecha Nacimiento"
                            msg={errors.birthDate?.message}
                            required
                        >
                            <InputApp
                                defaultValue={dataItem.birthDate}
                                placeholder="DD / MM / AAAA"
                                {...register("birthDate")}
                            />
                        </FormControlApp> */}
                        <div style={{ width: "100%", margin: "5px 0 22px 0", display: "flex", justifyContent: "center" }}>
                            <ReCAPTCHA {...configReCaptcha} />
                        </div>
                    </GridItem>

                    <GridItem md={12} lg={12}>
                        <ButtonApp
                            submit
                        >
                            CONFIRMAR
                        </ButtonApp>
                    </GridItem>
                </GridContainer>
            </form>
        </>
    )
}