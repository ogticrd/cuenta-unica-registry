import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Swal from 'sweetalert2'

interface IProps {
    text?: string
}

export const AlertError = (text?: string) => {
    return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: text ? text : "Ocurrió un error al procesar la solicitud",
        confirmButtonColor: "#002D62"
    })
}

export const AlertWarning = (text: string) => {
    return Swal.fire({
        icon: 'warning',
        title: 'Aviso',
        text: text,
        confirmButtonColor: "#002D62"
    })
}

export const AlertSuccess = (text?: string) => {
    return Swal.fire({
        icon: 'success',
        title: 'Correcto',
        text: text ? text : "Proceso realizado correctamente",
        confirmButtonColor: "#002D62"
    })
}
