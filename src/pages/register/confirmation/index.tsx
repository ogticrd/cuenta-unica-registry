import { useState } from 'react';
import { useRouter } from 'next/router'
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from "yup";

import LadingChico from "../../../../public/assets/ladingChico.png"
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';

import { CardAuth, CardAuthFooter } from "@/components/elements/cardAuth"
import { GridContainer, GridItem } from "@/components/elements/grid"
import { TextBodyTiny, TextSubTitle, TextSubTitleBody, TextTitle } from "@/components/elements/typography"

import { FormControlApp } from '@/components/form/input';
import { InputApp } from '@/themes/form/input';
import { ButtonApp } from '@/components/elements/button';
import { routes } from '@/constants/routes';
import BoxContentCenter from '@/components/elements/boxContentCenter';
import { labels } from '@/constants/labels';

interface IFormInputs {
    email: string
}

const schema = yup.object({
    email: yup.string().trim().email(labels.form.invalidEmail).required(labels.form.requiredField),
})

export default function Index() {

    const router = useRouter()

    const [dataItem, setDataItem] = useState<any>({})

    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<IFormInputs>({
        reValidateMode: 'onSubmit',
        shouldFocusError: false,
        resolver: yupResolver(schema)
    });

    const onSubmit = (data: IFormInputs) => {
        console.log(data)
        router.push(routes.register.registered)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <BoxContentCenter>
                <CardAuth
                    title="Confirmación de Cuenta"
                    subTitle="¡Gracias por completar tu registro! Revisa tu correo electrónico y haz clic en el enlace de confirmación."
                    lading={LadingChico}
                    ladingWidth={175}
                    icon={<MarkEmailReadOutlinedIcon sx={{fontSize: "58px"}} color='info' />}
                >
                    <GridContainer>
                        <GridItem md={12} lg={12}>
                            <FormControlApp
                                label="Hemos enviado una confirmación al siguiente correo:"
                                msg={errors.email?.message}
                            >
                                <InputApp
                                    defaultValue={dataItem.cedula}
                                    placeholder="correo@confirmacion.com"
                                    {...register("email")}
                                />
                            </FormControlApp>
                        </GridItem>

                        <GridItem md={12} lg={12}>
                            <ButtonApp
                                submit
                            >
                                REENVIAR CORREO
                            </ButtonApp>
                        </GridItem>
                    </GridContainer>

                </CardAuth>
            </BoxContentCenter>
        </form>
    )
}