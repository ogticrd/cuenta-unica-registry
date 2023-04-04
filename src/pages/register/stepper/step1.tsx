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

interface IFormInputs {
    cedula: string
    birthDate: string
}

const schema = yup.object({
    cedula: yup.string().trim().required(labels.form.requiredField),
    birthDate: yup.string().trim().required(labels.form.requiredField),
})

export default function Step1({handleNext} : any) {

    const [dataItem, setDataItem] = useState<any>({})

    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<IFormInputs>({
        reValidateMode: 'onSubmit',
        shouldFocusError: false,
        resolver: yupResolver(schema)
    });

    const handleNextForm = () => {
        handleNext()
    }

    return (
        <>
            <br />
            <TextBody textCenter bold>
                Por favor completa los siguientes campos.
            </TextBody>
            
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

                <GridItem md={12} lg={12}>
                    <FormControlApp
                        label="Fecha Nacimiento"
                        msg={errors.birthDate?.message}
                        required
                    >
                        <InputApp
                            defaultValue={dataItem.cedula}
                            placeholder="DD / MM / AAAA"
                            {...register("birthDate")}
                        />
                    </FormControlApp>
                </GridItem>

                <GridItem md={12} lg={12}>
                    <ButtonApp
                        onClick={handleNextForm}
                    >
                        CONFIRMAR
                    </ButtonApp>
                </GridItem>
            </GridContainer>
        </>
    )
}