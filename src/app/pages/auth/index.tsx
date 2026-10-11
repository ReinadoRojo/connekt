import { DefaultAppContext, RequestInfo } from "rwsdk/worker";
import { SignupForm } from "./form";

export default async function Page({ path }: RequestInfo<any, DefaultAppContext>) {
  return (
    <main className="w-screen h-screen overflow-hidden flex items-center justify-center">
      <SignupForm />
    </main>
  );
};
