import { FormControl, InputLabel, Typography } from '@mui/material';

interface IProps {
    label?: String,
    icon?: any,
    msg?: string,
    required?: boolean,
    noGutter?: boolean,
    children: React.ReactNode
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
                </InputLabel>
            </>
            }
            {props.children}
            {!props.noGutter &&
                <Typography variant="caption" color="error">
                    {props.msg}{'\u00A0'}
                </Typography>
            }
        </FormControl>
    )
}
