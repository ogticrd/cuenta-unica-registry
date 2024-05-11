import Image from 'next/image';

import ESLanguage from '@public/assets/es-language.svg';
import ENLanguage from '@public/assets/en-language.svg';
import { useLanguage } from '@/app/[lang]/provider';
import { ButtonApp } from '../elements/button';

export const LanguageSelector = () => {
    const { intl } = useLanguage();

    const handleLanguageChange = () => {
        return window.location.href = `/${intl.language === 'en' ? 'es' : 'en'}/identification`;
    };

    return (
        <div
            style={{ marginRight: '16px' }}
        >
            <ButtonApp
                variant='outlined'
                startIcon={
                    <Image
                        src={intl.language === 'en' ? ESLanguage.src : ENLanguage.src}
                        alt="icon language"
                        width="24"
                        height="24"
                    />
                }
                onClick={() => handleLanguageChange()}
            >
                {intl.language === 'en'
                    ?
                    'Español'
                    :
                    'English'
                }
            </ButtonApp>
        </div>
    );
}
