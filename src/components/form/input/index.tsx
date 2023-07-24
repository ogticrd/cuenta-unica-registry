import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { FormControl, InputLabel, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { styled } from '@mui/material/styles';
import { IconButton } from '@mui/material';

interface IProps {
  label?: string;
  icon?: any;
  msg?: string;
  required?: boolean;
  noGutter?: boolean;
  children: React.ReactNode;
  tooltip?: string;
  tooltipText?: any;
}

export const FormControlApp = (props: IProps) => {
  const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} arrow />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#fff',
      color: '#707070',
      maxWidth: 317,
      fontSize: theme.typography.pxToRem(12),
      borderRadius: '6px',
      border: '1px solid #dadde9',
      padding: '18px 20px',
    },
  }));

  return (
    <FormControl fullWidth variant="standard">
      {props.label && (
        <>
          <InputLabel
            // required={props.required}
            error={props.msg ? true : false}
            shrink={true}
          >
            {props.label}{' '}
            <span
              style={{
                fontWeight: 'bold',
                fontSize: '20px',
                position: 'relative',
                top: '4px',
              }}
            >
              {props.required && '*'}
            </span>{' '}
            {props.icon}
            {props.tooltip && (
              <HtmlTooltip
                title={
                  <>
                    <Typography
                      color="primary"
                      sx={{ fontWeight: '700', fontSize: '16px' }}
                    >
                      {props.tooltip}
                    </Typography>
                    {props.tooltipText && (
                      <>
                        <div
                          style={{
                            width: '100%',
                            height: '1px',
                            borderRadius: '10px',
                            margin: '10px 0',
                            background: '#E2E2E2',
                          }}
                        />
                        <Typography
                          color="#707070"
                          sx={{ fontWeight: '400', fontSize: '14px' }}
                        >
                          {props.tooltipText}
                        </Typography>
                      </>
                    )}
                  </>
                }
              >
                <IconButton
                  sx={{
                    padding: '0 0 2px 0',
                    marginLeft: '14px',
                    position: 'relative',
                    top: '0px',
                  }}
                >
                  <InfoOutlinedIcon
                    sx={{ fontSize: '20px', color: '#FFBA00' }}
                  />
                </IconButton>
              </HtmlTooltip>
            )}
          </InputLabel>
        </>
      )}
      {props.children}
      {!props.noGutter && (
        <Typography variant="caption" color="error" sx={{ fontSize: '10px' }}>
          {props.msg}
          {'\u00A0'}
        </Typography>
      )}
    </FormControl>
  );
};
