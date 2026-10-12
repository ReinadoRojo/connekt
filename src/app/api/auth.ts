import { DefaultAppContext, RequestInfo } from "rwsdk/worker";
import * as v from 'valibot'

const reservedNames = [
  "connekt",
  "system",
  "notifications",
  "admin",
  "developer"
];

const SignUpPostRequest = v.object({
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
  masterKey: v.string("No public key was sent. Please try again or contact the site."),
  authKey: v.union([v.string(), v.literal(false)])
})

export async function pSignUp({ request }: RequestInfo<any, DefaultAppContext>) {
  try {
    const body = await request.json();
    const safeBody = v.parse(SignUpPostRequest, body);

    console.log(safeBody)
  } catch (err) {
    console.log(err)
    return new Response(JSON.stringify({
      success: false,
      error: err || 'Internal Server Error!'
    }), { status: 500 })
  }
}

export async function gIsUnique({ request }: RequestInfo<any, DefaultAppContext>) {
  const url = new URL(request.url);
  const username = url.searchParams.get("u");

  // TODO: Check DB

  return new Response(JSON.stringify({
    isUnique: true,
  }))
}
