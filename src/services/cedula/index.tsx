import { cedulaAxios } from "../../configs/axios";

export namespace cedulaApi {
    export const get = async (cedula: string) => await cedulaAxios.get(`${cedula}/info/basic?api-key=${process.env.NEXT_PUBLIC_CEDULA_API_KEY}`)
}