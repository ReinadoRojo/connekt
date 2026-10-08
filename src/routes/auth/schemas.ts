import { object, string } from "zod";

const reservedNames = [
  "connekt",
  "system",
  "notifications",
  "admin",
  "developer"
];

export const SignUpRequest = object({
  username: string()
    .min(3, { error: 'Username must be at least 3 characters long.' })
    .max(15, { error: 'Username cannot be longer than 15 characters' })
    .regex(/^[a-zA-Z-_]+$/i, { error: 'Only letters, "-" and "_" are allowed'})
    .refine(v => {
      const vLower = v.toLowerCase()

      return !reservedNames.some(prohName => { // '!' before so we only set as fail if name includes a prohibited name.
        vLower.includes(prohName.toLowerCase())
      })
    })
  ,
  publicKey: string(),
})
