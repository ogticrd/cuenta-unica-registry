import axios from "axios";

export const cedulaAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CEDULA_API
})

export const authAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API
})