import { NextApiRequest, NextApiResponse } from "next/types";
import getConfig from "next/config";
import axios from "axios";

import { VerifyIamUserResponse } from "../types";

const { publicRuntimeConfig } = getConfig();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<any> {
  const http = axios.create({
    baseURL: publicRuntimeConfig.NEXT_PUBLIC_IAM_API,
  });

  if (req.method === "GET") {
    const { cedula } = req.query;
    const { data } = await http.get<VerifyIamUserResponse[]>(
      `/auth/validations/users/existence?username=${cedula}`
    );

    return res.status(200).json(data);
  } else if (req.method === "POST") {
    const { body } = req;
    await http.post(`/auth/signup`, body);
  }
}
