import { useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from "yup";

import { GridContainer, GridItem } from "@/components/elements/grid";
import { TextBody } from "@/components/elements/typography";
import { FormControlApp } from "@/components/form/input";
import { InputApp } from "@/themes/form/input";
import { labels } from '@/constants/labels';
import { ButtonApp } from '@/components/elements/button';
import { authApi } from '@/services/app/auth';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';

interface IFormInputs {
    email: string
    emailConfirm: string
    password: string
    passwordConfirm: string
}

const schema = yup.object({
    email: yup.string().trim().email(labels.form.invalidEmail).required(labels.form.requiredField),
    emailConfirm: yup.string().trim().required(labels.form.requiredField).oneOf([yup.ref('email')], 'Los correos no coinciden'),
    password: yup.string().min(8, "Debe contener al menos 8 caracteres").required(labels.form.requiredField).trim(),
    passwordConfirm: yup.string().required(labels.form.requiredField).oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
})

export default function Step3({ handleNext, infoCedula }: any) {

    const [dataItem, setDataItem] = useState<any>({})

    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<IFormInputs>({
        reValidateMode: 'onSubmit',
        shouldFocusError: false,
        resolver: yupResolver(schema)
    });

    const onSubmit = (data: IFormInputs) => {
        setLoading(true)

        const obj = {
            email: data.email,
            username: data.email,
            firstName: infoCedula?.payload?.names,
            lastName: `${infoCedula?.payload?.firstSurname} ${infoCedula?.payload?.secondSurname}`,
            password: data.password,
        }

        authApi.post(obj)
            .then(() => {
                alert("Bien!")
                handleNext()
            })
            .catch(() => alert("error"))
            .finally(() => setLoading(false));
    }

    return (
        <>
            {loading && <LoadingBackdrop />}
            <br />
            <TextBody textCenter bold>
                Por favor completa los siguientes campos para finalizar tu registro.
            </TextBody>

            <form onSubmit={handleSubmit(onSubmit)}>
                <GridContainer marginY>
                    <GridItem md={12} lg={12}>
                        <FormControlApp
                            label="Correo Electrónico"
                            msg={errors.email?.message}
                            required
                        >
                            <InputApp
                                defaultValue={dataItem.email}
                                placeholder="Coloca tu correo electrónico"
                                {...register("email")}
                            />
                        </FormControlApp>
                    </GridItem>

                    <GridItem md={12} lg={12}>
                        <FormControlApp
                            label="Confirmación Correo Electrónico"
                            msg={errors.emailConfirm?.message}
                            required
                        >
                            <InputApp
                                defaultValue={dataItem.emailConfirm}
                                placeholder="Coloca tu correo electrónico"
                                {...register("emailConfirm")}
                            />
                        </FormControlApp>
                    </GridItem>

                    <GridItem md={12} lg={12}>
                        <FormControlApp
                            label="Contraseña"
                            msg={errors.password?.message}
                            required
                        >
                            <InputApp
                                defaultValue={dataItem.password}
                                placeholder="*********"
                                type="password"
                                {...register("password")}
                            />
                        </FormControlApp>
                    </GridItem>

                    <GridItem md={12} lg={12}>
                        <FormControlApp
                            label="Confirmar Contraseña"
                            msg={errors.passwordConfirm?.message}
                            required
                        >
                            <InputApp
                                defaultValue={dataItem.passwordConfirm}
                                placeholder="*********"
                                type="password"
                                {...register("passwordConfirm")}
                            />
                        </FormControlApp>
                    </GridItem>

                    <GridItem md={12} lg={12}>
                        <ButtonApp
                            submit
                        >
                            ACEPTAR Y CONFIRMAR
                        </ButtonApp>
                    </GridItem>
                </GridContainer>
            </form>
        </>
    )
}