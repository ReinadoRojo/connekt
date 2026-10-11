import { DefaultAppContext, RequestInfo } from "rwsdk/worker";

export async function PsignUp({ request }: RequestInfo<any, DefaultAppContext>) {
}

export async function gIsUnique({ request }: RequestInfo<any, DefaultAppContext>) {
  const url = new URL(request.url);
  const username = url.searchParams.get("u");

  // TODO: Check DB

  return new Response(JSON.stringify({
    isUnique: true,
  }))
}
