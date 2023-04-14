import { useState } from 'react';
import { useRouter } from 'next/router'
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from "yup";

import LadingChico from "../../../../public/assets/ladingChico.png"
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';

import { CardAuth, CardAuthFooter } from "@/components/elements/cardAuth"
import { GridContainer, GridItem } from "@/components/elements/grid"
import { TextBody, TextBodyTiny, TextSubTitle, TextSubTitleBody, TextTitle } from "@/components/elements/typography"

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

    return (
        <BoxContentCenter>
            <CardAuth
                title="Registro de Cuenta Exitoso"
                lading={LadingChico}
                ladingWidth={175}
                icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: "103px", color: '#2ECC71' }} />}
            >
                <GridContainer>
                    <GridItem md={12} lg={12}>
                        <br />
                        <TextBody textCenter>
                            ¡Felicidades tu Cuenta Unica Ciudadana a sido creada con éxito!
                        </TextBody>
                        <br />
                        <TextBody textCenter>
                            Ahora puedes ver y realizar tramites y  solicitar servicios gubernamentales con una sola cuenta y contraseña.
                        </TextBody>
                        <br />
                    </GridItem>
                    
                    <GridItem md={12} lg={12}>
                        <ButtonApp
                            onClick={() => window.open("https://beta.auth.digital.gob.do/realms/master/account/")}
                        >
                            IR A MI CUENTA
                        </ButtonApp>
                    </GridItem>
                </GridContainer>
            </CardAuth>
        </BoxContentCenter>
    )
}