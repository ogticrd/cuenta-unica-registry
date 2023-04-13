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
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { cedulaApi } from '@/services/cedula';
import { useRouter } from 'next/router';
import { routes } from '@/constants/routes';

interface IFormInputs {
    cedula: string
    // birthDate: string
}

const schema = yup.object({
    cedula: yup.string().trim().required(labels.form.requiredField),
    // birthDate: yup.string().trim().required(labels.form.requiredField),
})

export default function Step1({ handleNext }: any) {

    const router = useRouter();

    const [dataItem, setDataItem] = useState<any>({})

    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<IFormInputs>({
        reValidateMode: 'onSubmit',
        shouldFocusError: false,
        resolver: yupResolver(schema)
    });
    console.log(errors)

    const onSubmit = (data: IFormInputs) => {
        console.log(data)
        setLoading(true)
        // router.replace(routes.register.home, routes.register.home, { shallow: true });
        cedulaApi.get(data.cedula)
            .then((res) => {
                sessionStorage.setItem("infoCedula", JSON.stringify(res.data))
                handleNext()
            })
            .catch((err) => console.log(err))
            .finally(() => setLoading(false))
    }

    return (
        <>
            {loading && <LoadingBackdrop />}
            <br />
            <TextBody textCenter bold>
                Por favor completa los siguientes campos.
            </TextBody>

            <form onSubmit={handleSubmit(onSubmit)}>
                <GridContainer marginY>
                    <GridItem md={12} lg={12}>
                        <FormControlApp
                            label="Coloca tu Cédula"
                            msg={errors.cedula?.message}
                            required
                        >
                            <InputApp
                                defaultValue={dataItem.cedula}
                                placeholder="*** - **00000 - 0"
                                {...register("cedula")}
                            />
                        </FormControlApp>
                    </GridItem>

                    {/* <GridItem md={12} lg={12}>
                        <FormControlApp
                            label="Fecha Nacimiento"
                            msg={errors.birthDate?.message}
                            required
                        >
                            <InputApp
                                defaultValue={dataItem.birthDate}
                                placeholder="DD / MM / AAAA"
                                {...register("birthDate")}
                            />
                        </FormControlApp>
                    </GridItem> */}

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