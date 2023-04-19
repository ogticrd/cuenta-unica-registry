import { authAxios } from "../../../configs/axios";

export namespace authApi {
    export const post = async (data: any) => await authAxios.post(`/auth/signup`, data)
    export const getVerifyUser = async (cedula: string) => await authAxios.get(`/auth/validations/users/existence?username=${cedula}`)
}