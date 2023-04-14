import { authAxios } from "../../../configs/axios";

export namespace authApi {
    export const post = async (data: any) => await authAxios.post(`/auth/signup`, data)
}