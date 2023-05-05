import { NextApiRequest, NextApiResponse } from "next/types";
import axios from "axios";

import { validateSameSiteRequest } from "@/helpers";
import { VerifyIamUserResponse } from "../types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<any> {
  const isValidRequest = validateSameSiteRequest(req.headers);

  if (!isValidRequest) {
    return res.status(401).send(null);
  }

  const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_IAM_API,
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
