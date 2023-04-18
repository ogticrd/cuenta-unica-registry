import { useEffect, useRef, useState } from 'react';
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
import { useRouter } from 'next/router';
import { routes } from '@/constants/routes';
import { AlertWarning } from '@/components/elements/alert';

interface IFormInputs {
    cedula: string
    // birthDate: string
}

const schema = yup.object({
    cedula: yup.string().trim().required(labels.form.requiredField).min(11, "Debe contener 11 dígitos"),
    // birthDate: yup.string().trim().required(labels.form.requiredField),
})

export default function Step1({ handleNext }: any) {

    const router = useRouter();
    const captchaRef = useRef<any>(null);
    console.log(captchaRef)

    const [dataItem, setDataItem] = useState<any>({})

    const [loading, setLoading] = useState(false)

    const inputCedula = useRef<any>();
    console.log(inputCedula.current)

    const handleChange = (e: any) => {
        const cedulaValue = e.target.value.replace(/\D/g, '')
            .match(/(\d{0,3})(\d{0,7})(\d{0,1})/);
        e.target.value = !cedulaValue[2]
            ? cedulaValue[1]
            : `${cedulaValue[1]}-${cedulaValue[2]}${`${cedulaValue[3] ? `-${cedulaValue[3]}` : ''
            }`}${`${cedulaValue[4] ? `-${cedulaValue[4]}` : ''}`}`;
        const numbers = e.target.value.replace(/(\D)/g, '');
        setValue("cedula", numbers);
        console.log(numbers)
    };

    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<IFormInputs>({
        reValidateMode: 'onSubmit',
        shouldFocusError: false,
        resolver: yupResolver(schema)
    });
    console.log(errors)

    const onSubmit = (data: IFormInputs) => {
        const tokenCaptcha = captchaRef.current.getValue()
        console.log(data)

        if(!tokenCaptcha) {
            return AlertWarning("Necesitamos verificar que no eres un robot. Por favor complete el control de seguridad")
        }

        setLoading(true)
        // router.replace(routes.register.home, routes.register.home, { shallow: true });
        cedulaApi.get(data.cedula)
            .then((res) => {
                sessionStorage.setItem("infoCedula", JSON.stringify(res.data))
                handleNext()
            })
            .catch(() => AlertWarning("Cédula invalida"))
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
                                defaultValue={dataItem.cedula}
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
                        <div style={{width: "100%", margin: "5px 0 22px 0", display: "flex", justifyContent: "center"}}>
                            <ReCAPTCHA sitekey={"***REMOVED***"} ref={captchaRef}  />
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