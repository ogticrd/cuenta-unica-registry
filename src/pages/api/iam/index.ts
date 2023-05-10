import { NextApiRequest, NextApiResponse } from "next/types";
import axios, { AxiosError } from "axios";

import {
  CitizensBasicInformationResponse,
  VerifyIamUserResponse,
} from "../types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<any> {
  const { token } = req.cookies;

  if (token !== process.env.NEXT_PUBLIC_COOKIE_KEY) {
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
    const { username, email, password } = body;

    let success: boolean = true;
    let statusCode: number = 201;

    const { data: citizen } = await axios.get<CitizensBasicInformationResponse>(
      `${process.env.NEXT_PUBLIC_CEDULA_API}/${username}/info/basic?api-key=${process.env.NEXT_PUBLIC_CEDULA_API_KEY}`
    );

    try {
      await http.post(`/auth/signup`, {
        firstName: citizen.payload.names,
        lastName: `${citizen.payload.firstSurname} ${citizen.payload.secondSurname}`,
        username,
        email,
        password,
      });

      console.log(`Citizens ${username} created successfully on IAM`);
    } catch (ex: unknown) {
      console.log(`Error ocurred trying to create citizen ${username} on IAM`);
      success = false;

      if (ex instanceof AxiosError) {
        const { response } = ex;
        statusCode = response?.status ? response?.status : 500;
      } else {
        statusCode = 500;
      }
    }

    return res.status(statusCode).json({ success });
  }
}
