'use client';

import { useState, useEffect } from 'react';
import LogoLoop from '@/components/LogoLoop';
import { X, ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useT } from '@/hooks/use-t';

const partnersData = [
  {
    id: 'gob-do',
    translationKey: 'gob_do',
    src: '/images/partners/gob-do.svg',
    href: 'https://www.gob.do/',
  },
  {
    id: 'soy-yo-rd',
    translationKey: 'soy_yo_rd',
    src: '/images/partners/soy-yo-rd.svg',
    href: 'https://soyyord.gob.do/',
  },
  {
    id: 'mejora-regulatoria',
    translationKey: 'mejora_regulatoria',
    src: '/images/partners/mejora-regulatoria.svg',
    href: 'https://regulaciones.digital.gob.do/',
  },
  {
    id: 'becas',
    translationKey: 'becas',
    src: '/images/partners/becas.svg',
    href: 'https://becas.gob.do/',
  },
];

export function GovernmentPartners() {
  const t = useT("landing.government_partners");
  const [activePartner, setActivePartner] = useState<typeof partnersData[0] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openModal = (partner: typeof partnersData[0]) => {
    setActivePartner(partner);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setActivePartner(null);
    }, 300);
  };

  const renderLogo = (item: any) => {
    return (
      <button
        onClick={() => openModal(item)}
        className="block cursor-pointer focus:outline-none bg-transparent opacity-75 hover:opacity-100 transition-[opacity] duration-300 ease-in-out"
        aria-label={`Ver detalles de ${t(`partners.${item.translationKey}.name`)}`}
      >
        <img
          src={item.src}
          alt={t(`partners.${item.translationKey}.name`)}
          className="h-[var(--logoloop-logoHeight)] w-auto block object-contain [-webkit-user-drag:none] pointer-events-none"
        />
      </button>
    );
  };

  return (
    <section className="py-20 sm:py-24 overflow-hidden relative min-h-[600px] bg-[#eff7ff] dark:bg-background flex flex-col justify-center">
      <div
        className="absolute inset-0 z-0 opacity-50 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #6db0e2 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
          backgroundAttachment: 'fixed',
        }}
      />

      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
          <h2 className="text-primary text-[2rem] sm:text-[2.5rem] lg:text-[3rem] font-black leading-snug tracking-tight dark:text-white">
            {t.rich('title', { highlight: (chunks) => <span className="text-accent">{chunks}</span> })}
          </h2>
          <p className="mt-4 text-[#6db0e2] text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="relative [--fade-color:#eff7ff] dark:[--fade-color:hsl(var(--background))]">
          <LogoLoop
            logos={partnersData}
            speed={30}
            direction="left"
            logoHeight={60}
            gap={100}
            pauseOnHover
            fadeOut
            scaleOnHover
            fadeOutColor="var(--fade-color)"
            className="dark:[--logoloop-fadeColorAuto:#0b0b0b]"
            renderItem={(item) => renderLogo(item)}
          />

          <div className="mt-8">
            <LogoLoop
              logos={[...partnersData].reverse()}
              speed={30}
              direction="right"
              logoHeight={60}
              gap={100}
              pauseOnHover
              fadeOut
              scaleOnHover
              fadeOutColor="var(--fade-color)"
              className="dark:[--logoloop-fadeColorAuto:#0b0b0b]"
              renderItem={(item) => renderLogo(item)}
            />
          </div>
        </div>

        {isMounted && createPortal(
          <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isModalVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
          >
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={closeModal}
            />

            <div
              className={`relative bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 max-w-lg w-full shadow-2xl flex flex-col items-center text-center z-10 transition-all duration-300 transform ${isModalVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                }`}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="h-24 w-full flex items-center justify-center mb-6">
                <img
                  src={activePartner?.src}
                  alt={activePartner ? t(`partners.${activePartner.translationKey}.name`) : ''}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <h3 className="text-2xl font-bold text-primary dark:text-white mb-1">
                {activePartner ? t(`partners.${activePartner.translationKey}.name`) : ''}
              </h3>

              <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed text-base">
                {activePartner ? t(`partners.${activePartner.translationKey}.description`) : ''}
              </p>

              {activePartner && (
                <a
                  href={activePartner.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  {t('visit_portal')}
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </section>
  );
}
