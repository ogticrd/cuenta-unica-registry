import Button from '@mui/material/Button';

interface IButtonTextApp {
  onClick?: any;
  children: React.ReactNode;
  startIcon?: any;
  endIcon?: any;
}

export const ButtonTextApp = ({ onClick, children, startIcon = null, endIcon = null }: IButtonTextApp) => {
  return (
    <Button
      onClick={onClick}
      variant="text"
      size="small"
      startIcon={startIcon}
      endIcon={endIcon}
      sx={{
        textTransform: 'inherit',
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "21px",
        color: "#707070"
      }}
    >
      {children}
    </Button>
  );
};

interface IButtonApp {
  disabled?: boolean;
  submit?: boolean;
  onClick?: () => void;
  notFullWidth?: boolean;
  children: React.ReactNode;
  startIcon?: any;
  endIcon?: any;
  size?: 'small' | 'medium' | 'large' | undefined;
  color?:
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'info'
  | 'warning';
  variant?: 'text' | 'outlined' | 'contained';
}

export const ButtonApp = ({
  disabled,
  variant = 'contained',
  submit,
  onClick,
  notFullWidth,
  children,
  size = 'medium',
  startIcon = null,
  endIcon = null,
  color,
}: IButtonApp) => {
  return (
    <Button
      size={size}
      variant={variant}
      disabled={disabled}
      type={submit ? 'submit' : 'button'}
      onClick={onClick}
      color={color ? color : 'primary'}
      fullWidth={notFullWidth ? false : true}
      startIcon={startIcon}
      endIcon={endIcon}
    >
      {children}
    </Button>
  );
};
