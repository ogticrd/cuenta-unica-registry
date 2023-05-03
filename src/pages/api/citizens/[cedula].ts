import { NextApiRequest, NextApiResponse } from "next/types";
import getConfig from "next/config";
import axios from "axios";

import { CitizensBasicInformationResponse } from "../types";

const { publicRuntimeConfig } = getConfig();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CitizensBasicInformationResponse>
): Promise<void> {
  const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CEDULA_API,
  });

  const { cedula } = req.query;

  const { data: citizen } = await http.get<CitizensBasicInformationResponse>(
    `/${cedula}/info/basic?api-key=${process.env.NEXT_PUBLIC_CEDULA_API_KEY}`
  );

  res.status(200).json(citizen);
}
