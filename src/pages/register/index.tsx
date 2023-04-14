import { useState } from 'react';
import { useRouter } from 'next/router'
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from "yup";

import LadingChica2 from "../../../public/assets/ladingChica2.png"

import { CardAuth, CardAuthFooter } from "@/components/elements/cardAuth"
import { GridContainer, GridItem } from "@/components/elements/grid"
import { TextBody, TextBodyTiny, TextSubTitle, TextSubTitleBody, TextTitle } from "@/components/elements/typography"

import { FormControlApp } from '@/components/form/input';
import { InputApp } from '@/themes/form/input';
import { ButtonApp } from '@/components/elements/button';
import { routes } from '@/constants/routes';
import { labels } from '@/constants/labels';
import StepperRegister from './stepper';

// interface IFormInputs {
//     cedulaOrEmail: string
// }

// const schema = yup.object({
//     cedulaOrEmail: yup.string().trim().required(labels.form.requiredField),
// })


export default function Index() {

    // const router = useRouter()

    // const [dataItem, setDataItem] = useState<any>({})

    // const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<IFormInputs>({
    //     reValidateMode: 'onSubmit',
    //     shouldFocusError: false,
    //     resolver: yupResolver(schema)
    // });

    // const onSubmit = (data: IFormInputs) => {
    //     console.log(data)
    //     router.push(routes.auth.password)
    // }

    return (
        // <form onSubmit={handleSubmit(onSubmit)}>
            <GridContainer
                spacing={10}
                flexDirection={{ xs: "column", sm: "row" }}
            >
                <GridItem sx={{ order: { xs: 2, sm: 1 } }} sm={12} md={6} lg={6}>
                    <TextTitle>
                        ¡Bienvenido a la Plataforma Única de Autenticación <span className="text-error">Ciudadana!</span>
                    </TextTitle>
                    <TextSubTitle>
                        Accede o regístrate con un único usuario y contraseña, para solicitar o consultar todos tus servicios y trámites gubernamentales.
                    </TextSubTitle>
                    <br />
                    <TextSubTitleBody>
                        Una manera fácil y cómoda de identificarte, para realizar trámites desde tu computadora o celular sin necesidad de trasladarte a los organismos gubernamentales.
                    </TextSubTitleBody>
                    <br />
                    <img src={LadingChica2.src} alt="Lading Home" width="100%" />
                </GridItem>

                <GridItem sx={{ order: { xs: 1, sm: 2 } }} sm={12} md={6} lg={6}>
                    <CardAuth
                        title="Registrar Cuenta Única Ciudadana"
                    >
                        <StepperRegister />
                    </CardAuth>
                </GridItem>
            </GridContainer>
        // </form>
    )
}