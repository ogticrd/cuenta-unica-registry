'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Typography } from '@mui/material';

import NotFound404 from '@public/assets/not-found.svg';

import { TextBody } from '@/components/elements/typography';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { ButtonApp } from '@/components/elements/button';
import { useLanguage } from '@/app/[lang]/provider';

export default function NotFound() {
    const router = useRouter();
    const { intl } = useLanguage();

    return (
        <GridContainer>
            <GridItem md={12} lg={12}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Image
                        src={NotFound404?.src}
                        alt="img 404"
                        width="231"
                        height="225"
                    />
                </div>
                <br />
                <Typography
                    color="primary"
                    sx={{
                        fontSize: '24px',
                        fontWeight: '700',
                        textAlign: 'center',
                    }}
                    gutterBottom
                >
                    {intl.notFound.title}
                </Typography>
                <TextBody textCenter gutterBottom>
                    {intl.notFound.description}
                </TextBody>
            </GridItem>

            <GridItem md={12} lg={12}>
                <ButtonApp onClick={() => router.push('/')}>
                    {intl.notFound.returnHome}
                </ButtonApp>
            </GridItem>
        </GridContainer>
    )
}