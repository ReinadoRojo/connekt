'use client';

import { CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { SubmitEventHandler, useEffect, useState } from "react";
import useSWR from 'swr';

import { CryptoActions } from "@/types/global.d";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { useCryptoWorker } from "./crypto";
import { fetcher } from "@/lib/utils";
import { DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Dialog } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export function SignupForm() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState("");

  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    if (username.length < 3 || username.length > 15) { return; }
    if (!username.trim()) { setDebouncedUsername(''); return; }

    const timer = setTimeout(() => { setDebouncedUsername(username); setMessage(null); }, 500);

    return () => clearTimeout(timer)
  }, [username]);

  const { run } = useCryptoWorker();

  const formSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault(); setIsPending(true);
    const f = new FormData(e.currentTarget);

    const u = f.get('username');
    const oneclick = f.get('oneclick');

    if (!acceptTerms) { console.error('Needs to accept the terms'); return; }
    if (!password) { console.error("Secure password needed"); return; }

    try {
      // Check if username is valid
      const data = await fetcher(`/api/auth/check?u=${u}`);
      if (!data.isUnique) {
        console.error('Username not unique'); return;
      }

      const salt = new Uint8Array(16);
      const masterPassword: any = await run(CryptoActions.DERIVATE_MASTER_PASSWD, { password, salt })
      console.log(masterPassword);

      const masterPair: any = await run(CryptoActions.CREATE_MASTER_PAIR, { masterPassword })
      console.log(masterPair)

      // TODO: Generate oneclick keys if user wanted.
      console.log("User wants oneclick?", !!oneclick)

      console.log("final info:", {
        master: {
          private: masterPair.privateKey,
          public: masterPair.publicKey
        },
        oneclick: {
          enabled: false,
        },
        salt,
        unique: masterPair.unique
      })
    }
    catch (err) { console.error(err); }
    finally { setIsPending(false); }
  }

  const { data, error, isLoading } = useSWR(debouncedUsername ? `/api/auth/check?u=${debouncedUsername}` : null, fetcher);
  const isUnique = data ? data.isUnique : null

  const errorMessages = [
    (isUnique === false) ? { message: "This username has been already taken" } : undefined,
    message ? { message } : undefined,
  ]

  return (
    <Card className="w-1/4">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription className="">
          First, let's get you an username. Must be unique!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={formSubmit} id="signup-form">
          <Field data-invalid={message !== null || isUnique === false}>
            <FieldLabel htmlFor={"username"}>
              Username
              {isLoading && <LoaderCircleIcon className="animate-spin size-3" />}
              {isUnique && <CheckIcon className="text-green-500 size-4" />}
              {(isUnique === false || error) && <XIcon className="text-red-500 size-4" />}
            </FieldLabel>
            <Input
              aria-invalid={message !== null || isUnique === false}
              placeholder="Cool username goes here"
              autoComplete="off"
              name="username"
              onChange={e => setUsername(e.target.value)}
              value={username}
              onBlur={e => {
                setMessage(null);
                if (e.target.value.length < 3) { setMessage("This username is too short"); }
                if (e.target.value.length > 15) { setMessage("This username is too long"); }
              }}
            />
            {(message || isUnique === false) && (
              <FieldError errors={errorMessages} />
            )}
          </Field>
        </form>
      </CardContent>
      <CardFooter>
        <DialogTrigger>
          <Button isDisabled={!isUnique || error || isPending} className="ml-auto">
            Continue
          </Button>
          <Dialog>
            <DialogHeader>
              <DialogTitle>
                Create a secure password
              </DialogTitle>
              <DialogDescription>
                Remember this password, there is no way to recover it.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="my-4">
              <Field>
                <Input
                  placeholder="Secure password"
                  autoComplete="off"
                  name="masterpassword"
                  type="password"
                  onChange={e => setPassword(e.target.value)}
                  value={password}
                />
              </Field>
              <Field orientation={"horizontal"}>
                <Checkbox
                  name="terms-checkbox"
                  form="signup-form"
                  isSelected={acceptTerms}
                  onChange={setAcceptTerms}
                />
                <FieldContent>
                  <FieldLabel htmlFor="terms-checkbox">
                    Accept terms and conditions
                  </FieldLabel>
                  <FieldDescription>
                    By clicking this checkbox, you agree to the terms.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <FieldLabel className="border-destructive">
                <Field orientation={"horizontal"}>
                  <Checkbox
                    name="oneclick"
                    form="signup-form"
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="oneclick" className="text-destructive">
                      Enable one-click
                    </FieldLabel>
                    <FieldDescription>
                      When you enable oneclick a separate certificate will be created, this certificate will be linked to this device.<br />
                      The auth certificate will only work to authenticate yourself on THIS device.<br /><br />
                      <span className="text-destructive">
                        Enable <strong>ONLY IF YOU TRUST THIS DEVICE</strong> and if no one else uses this same browser.
                      </span>
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            </FieldGroup>
            <DialogFooter>
              <Button isDisabled={(password.length === 0) || acceptTerms === false} className="ml-auto" type="submit" form="signup-form">
                Continue
              </Button>
            </DialogFooter>
          </Dialog>
        </DialogTrigger>
      </CardFooter>
    </Card>
  )
}

/**
 */
