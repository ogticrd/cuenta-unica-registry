import Swal from "sweetalert2";
import Alert from '@mui/material/Alert';

interface IPropsAlertErrorMessage {
  message: string;
  type: "error" | "warning" | "info" | "success"
}
  interface IProps {
  text?: string;
}

export const AlertErrorMessage = ({message, type}: IPropsAlertErrorMessage) => (
  <Alert severity={type}>{message}</Alert>
)

  export const AlertError = (text?: string) => {
  return Swal.fire({
    icon: "error",
    title: "Error",
    text: text ? text : "Ocurrió un error al procesar la solicitud",
    confirmButtonColor: "#003670",
  });
};

export const AlertWarning = (text: string) => {
  return Swal.fire({
    icon: "warning",
    title: "Aviso",
    text: text,
    confirmButtonColor: "#003670",
  });
};

export const AlertSuccess = (text?: string) => {
  return Swal.fire({
    icon: "success",
    title: "Correcto",
    text: text ? text : "Proceso realizado correctamente",
    confirmButtonColor: "#003670",
  });
};
