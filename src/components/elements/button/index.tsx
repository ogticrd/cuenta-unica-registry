import Button from '@mui/material/Button';

interface IButtonTextApp {
    onClick?: any,
    children: React.ReactNode
}

export const ButtonTextApp = ({onClick, children}: IButtonTextApp) => {
    return (
        <Button onClick={onClick} variant="text" size="small" sx={{textTransform: "inherit"}}>
            {children}
        </Button>
    )
}

interface IButtonApp {
    outlined?: boolean
    disabled?: boolean
    submit?: boolean
    onClick?: () => void
    notFullWidth?: boolean
    children: React.ReactNode
    startIcon?: any
    size?: "small" | "medium" | "large" | undefined
    color?: "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning"
    variant?: "text" | "outlined" | "contained"
}

export const ButtonApp = ({outlined, disabled, variant="contained", submit, onClick, notFullWidth, children, size="medium", startIcon= null, color}: IButtonApp) => {
    return (
        <Button
            size={size}
            variant={variant} 
            disabled={disabled}
            type={submit ? "submit" : "button"}
            onClick={onClick}
            color={color ? color : "primary"}
            fullWidth={notFullWidth ? false : true}
            sx={{paddingX: `${notFullWidth ? '35px': 'auto'}`, fontWeight: `${outlined ? 'bold': 'normal'}`, borderRadius: "50px", padding: "10px 0px"}}
            startIcon={startIcon}
        >
            {children}
        </Button>
    )
}
