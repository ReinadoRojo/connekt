import * as v from 'valibot';

const reservedNames = [
  "connekt",
  "system",
  "notifications",
  "admin",
  "developer"
];

/*
{
  username > The username of a user on the platform
  publicKey > Master public key, used to check if the user is the owner of the account.
  auth
  - enabledOneclick > If oneclick is enabled for this account.
  - authPublicKey > A public key for the auth privatekey used to one-click authenticate.
}
*/
export const SignupSchema = v.object({
  username: v.pipe(
    v.string("Username is not a string."),
    v.minLength(3, "Username lenght is less than 3 characters."),
    v.maxLength(15, "Username lenght is more than 15 characters."),
    v.regex(/^[a-zA-Z-_]+$/i, 'Only letters, "-" and "_" are allowed'),
    v.check(
      (i) => {
        const vLower = i.toLowerCase()
        return !reservedNames.some(prohName => {
          vLower.includes(prohName.toLowerCase())
        })
      },
      "The current username contains prohibited names."
    ),
  ),
  publicKey: v.string("No public key was sent. Please try again or contact the site."),
  auth: v.union([
    v.object({
      enabledOneclick: v.literal(false),
    }),
    v.object({
      enabledOneclick: v.literal(true),
      authPublicKey: v.string("One-click auth is enabled, but no auth key is present."),
    }),
  ])
})
