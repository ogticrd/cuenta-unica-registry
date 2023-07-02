import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import { Typography } from "@mui/material";
import BoxContentCenter from '@/components/elements/boxContentCenter';
import { GridContainer, GridItem } from '@/components/elements/grid';
import LandingChico from '../../../../public/assets/landingChico.png';
import { TextBody } from '@/components/elements/typography';
import { CardAuth } from '@/components/elements/cardAuth';
import { ButtonApp } from '@/components/elements/button';
import { labels } from '@/constants/labels';

interface IFormInputs {
  email: string;
}

const schema = yup.object({
  email: yup
    .string()
    .trim()
    .email(labels.form.invalidEmail)
    .required(labels.form.requiredField),
});

export default function Index() {
  const {
    formState: { },
  } = useForm<IFormInputs>({
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  return (
    <BoxContentCenter>
      <CardAuth
        title="Registro de Cuenta Exitoso"
        landing={LandingChico}
        landingWidth={214}
        landingHeight={469}
        icon={
          <ThumbUpOutlinedIcon
            sx={{ fontSize: '82px', color: '#2ECC71' }}
          />
        }
      >
        <GridContainer>
          <GridItem md={12} lg={12}>
            <br />
            <Typography
              color='primary'
              sx={{
                fontSize: "24px",
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              ¡Gracias por completar nuestra prueba beta!
            </Typography>
            <br />
            <TextBody textCenter>
              Queremos expresar nuestro más sincero agradecimiento por tu participación y dedicación. Tu retroalimentación y experiencia nos son extremadamente valiosas para mejorar nuestro producto y brindar una experiencia excepcional a todos los ciudadanos.
            </TextBody>
            <br />
          </GridItem>

          <GridItem md={12} lg={12}>
            <TextBody textCenter bold>
              Ayúdanos a mejorar:
            </TextBody>
            <br />
            <ButtonApp
              onClick={() =>
                window.open(
                  'https://forms.gle/cQnxx6UEpFHrLx2t7'
                )
              }
            >
              ¡Comparte tu opinión!
            </ButtonApp>
          </GridItem>
        </GridContainer>
      </CardAuth>
    </BoxContentCenter>
  );
}
