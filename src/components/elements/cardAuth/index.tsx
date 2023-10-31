import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Typography } from '@mui/material';
import Image from 'next/image';

import SmallLogo from '@public/assets/smallLogo.svg';

import { TextBody, TextBodyTiny } from '../typography';

export const CardAuth = ({
  title,
  subTitle,
  subTitle2,
  children,
  landing,
  landingWidth,
  landingHeight,
  icon,
}: any) => {
  return (
    <div>
      {landing ? (
        <div
          style={{ position: 'fixed', top: '35vh', left: '10vh', zIndex: '-1' }}
        >
          <Image
            src={landing?.src}
            alt="Landing"
            width={landingWidth ? landingWidth : '500'}
            height={landingHeight ? landingHeight : '500'}
          />
        </div>
      ) : null}
      <div
        style={{
          background: 'white',
          border: '1px solid #E2E2E2',
          borderRadius: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '95px',
            background: '#F8F8F8',
            borderRadius: '10px 10px 0 0',
            borderBottom: '1px solid #DFDFDF',
            padding: '13px 25px 0px 25px',
          }}
        >
          <div style={{ marginRight: '15px', marginTop: '-3px' }}>
            <Image src={SmallLogo.src} alt="Logo" width="47" height="47" />
          </div>
          <Typography
            color="primary"
            sx={{ fontWeight: '500', fontSize: '21px' }}
          >
            {title}
          </Typography>
        </div>
        <div style={{ padding: '25px 10px 10px 10px' }}>
          {icon ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '25px',
              }}
            >
              {icon}
            </div>
          ) : null}
          {subTitle ? (
            <>
              <div style={{ padding: '35px 35px 0px 35px' }}>
                <TextBody textCenter>{subTitle}</TextBody>
              </div>
              <br />
            </>
          ) : null}
          {subTitle2 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <LogoutOutlinedIcon
                  color="primary"
                  sx={{
                    fontSize: '13px',
                    marginRight: '4px',
                    marginTop: '3px',
                    transform: 'rotate(180deg)',
                  }}
                />
                <TextBodyTiny colorPrimary textCenter>
                  <span style={{ fontWeight: 'bold' }}>{subTitle2}</span>
                </TextBodyTiny>
              </div>
              <br />
            </>
          ) : null}
          <div style={{ padding: '0px 15px 25px 15px' }}>{children}</div>
        </div>
      </div>
    </div>
  );
};
