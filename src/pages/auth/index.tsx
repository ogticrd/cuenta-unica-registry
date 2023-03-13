import { useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import LadingHome from "../../../public/assets/ladingHome.svg"

import { CardAuth, CardAuthFooter } from "@/components/elements/cardAuth"
import { GridContainer, GridItem } from "@/components/elements/grid"
import { TextBodyTiny, TextSubTitle, TextSubTitleBody, TextTitle } from "@/components/elements/typography"

import schema from './schema';
import { FormControlApp } from '@/components/form/input';
import { InputApp } from '@/themes/form/input';
import { ButtonApp } from '@/components/elements/button';

interface IFormInputs {
    cedulaOrEmail: string
}

export default function Index() {

    const [dataItem, setDataItem] = useState<any>({})

    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<IFormInputs>({
        reValidateMode: 'onSubmit',
        shouldFocusError: false,
        resolver: yupResolver(schema)
    });

    return (
        <GridContainer
            spacing={10}
            flexDirection={{ xs: "column", sm: "row" }}
        >
            <GridItem sx={{ order: { xs: 2, sm: 1 } }} sm={12} md={6} lg={6}>
                <TextTitle>
                    ¡Bienvenido al Sistema de Autenticación Gubernamental <span className="text-error">Ciudadana</span>!
                </TextTitle>
                <br />
                <TextSubTitle>
                    Accede o regístrate con un único usuario y contraseña, para solicitar o consultar todos tus servicios y trámites gubernamentales.
                </TextSubTitle>
                <br />
                <TextSubTitleBody>
                    Una manera fácil y cómoda de identificarte, para realizar trámites desde tu computadora o celular sin necesidad de trasladarte a los organismos gubernamentales.
                </TextSubTitleBody>
                <br />
                <img src={LadingHome.src} alt="Lading Home" width="100%" />
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
                            >
                                <InputApp
                                    defaultValue={dataItem.cedula}
                                    placeholder="Cédula o Correo Electrónico"
                                    {...register("cedulaOrEmail")}
                                />
                            </FormControlApp>
                        </GridItem>

                        <GridItem md={12} lg={12}>
                            <ButtonApp>
                                INICIAR SESIÓN
                            </ButtonApp>
                        </GridItem>

                    </GridContainer>
                </CardAuth>
                <CardAuthFooter>
                    <TextBodyTiny textCenter>
                        <span className="text-secondary">¿No tienes cuenta?</span> Registrate, accede a trámites y servicios del estado dominicano con un único usuario y contraseña, de forma segura y confiable.
                    </TextBodyTiny>
                    <br />
                    <ButtonApp
                        color="info"
                        outlined
                    >
                        CREAR TU CUENTA UNICA CIUDADANA
                    </ButtonApp>
                </CardAuthFooter>
            </GridItem>
        </GridContainer>
    )
}