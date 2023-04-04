import { FormControl, InputLabel, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { IconButton } from '@mui/material'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

interface IProps {
    label?: String,
    icon?: any,
    msg?: string,
    required?: boolean,
    noGutter?: boolean,
    children: React.ReactNode
    tooltip?: string
}

export const FormControlApp = (props: IProps) => {

    return (
        <FormControl fullWidth variant="standard">
            {props.label &&
                <>

                    <InputLabel
                        required={props.required}
                        error={props.msg ? true : false}
                        shrink={true}
                    >
                        {props.label} {props.icon}
                        {props.tooltip && 
                            <Tooltip title={props.tooltip} arrow>
                                <IconButton sx={{ padding: "0 0 2px 0" }}>
                                    <HelpOutlineOutlinedIcon sx={{ fontSize: '18px' }} color='warning' />
                                </IconButton>
                            </Tooltip>
                        }
                    </InputLabel>
                </>
            }
            {props.children}
            {
                !props.noGutter &&
                <Typography variant="caption" color="error" sx={{ fontSize: "10px" }}>
                    {props.msg}{'\u00A0'}
                </Typography>
            }
        </FormControl >
    )
}
