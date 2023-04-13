import axios from "axios";

export const cedulaAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CEDULA_API
})