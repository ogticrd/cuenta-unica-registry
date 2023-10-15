import { Typography } from '@mui/material';
import Link from 'next/link';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';

export default async function ConfirmationPage() {
  return (
    <GridContainer>
      <GridItem md={12} lg={12}>
        <br />
        <Typography
          color="primary"
          sx={{
            fontSize: '24px',
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          ¡Gracias por completar nuestra prueba beta!
        </Typography>
        <br />
        <TextBody textCenter>
          Queremos expresar nuestro más sincero agradecimiento por tu
          participación y dedicación. Tu retroalimentación y experiencia nos son
          extremadamente valiosas para mejorar nuestro producto y brindar una
          experiencia excepcional a todos los ciudadanos.
        </TextBody>
        <br />
      </GridItem>

      <GridItem md={12} lg={12}>
        <TextBody textCenter bold>
          Ayúdanos a mejorar:
        </TextBody>
        <br />
        <Link href="https://forms.gle/cQnxx6UEpFHrLx2t7'">
          <ButtonApp>¡Comparte tu opinión!</ButtonApp>
        </Link>
      </GridItem>
    </GridContainer>
  );
}
