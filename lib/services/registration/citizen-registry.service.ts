import "server-only"

import type { CitizenLookupResult } from "@/lib/types/registration/citizen"

const DUMMY_CITIZENS = [
  { firstName: "Juan", lastName: "de los Palotes", birthDate: "1991-04-12", gender: "M" as const },
  { firstName: "Maria", lastName: "Perez Garcia", birthDate: "1995-08-23", gender: "F" as const },
  { firstName: "Ana", lastName: "Rodriguez Santos", birthDate: "1988-01-30", gender: "F" as const },
  { firstName: "Carlos", lastName: "Fernandez Lopez", birthDate: "1993-11-05", gender: "M" as const },
  { firstName: "Luisa", lastName: "Martinez Herrera", birthDate: "1997-06-17", gender: "F" as const },
]

export async function findCitizenByCedula(
  cedula: string,
): Promise<CitizenLookupResult | null> {
  await new Promise((resolve) => setTimeout(resolve, 900))

  const lastDigit = Number.parseInt(cedula.at(-1) ?? "0", 10)
  const citizenProfile = DUMMY_CITIZENS[lastDigit % DUMMY_CITIZENS.length]

  if (!citizenProfile) {
    return null
  }

  return {
    id: cedula,
    firstName: citizenProfile.firstName,
    lastName: citizenProfile.lastName,
    birthDate: citizenProfile.birthDate,
    gender: citizenProfile.gender,
  }
}
