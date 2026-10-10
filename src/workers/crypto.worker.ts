import { CryptoActions } from "@/types/global.d"
import sodium from 'libsodium-wrappers-sumo'
import { encode, decode } from "@/lib/z85"

self.onmessage = async ({ data }) => {
  const { action, payload } = data;

  try {
    await sodium.ready;

    switch (action) {
      case CryptoActions.DERIVATE_MASTER_PASSWD:
        const { password, salt } = payload

        const key = sodium.crypto_pwhash(
          /* keyLenght */ 32,
          /* password */  password,
          /* salt */      salt,
          /* opsLimit */  sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
          /* memLimit */  sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
          /* algorithm */ sodium.crypto_pwhash_ALG_ARGON2ID13,
        )

        self.postMessage({ success: true, action, result: encode(Array.from(key)) })
        break;
      case CryptoActions.CREATE_MASTER_PAIR:
        const { masterPassword } = payload;
        const passwd = decode(masterPassword)

        if (passwd.length !== sodium.crypto_secretbox_KEYBYTES) {
          throw new Error(`Key lenght is invalid. Given ${passwd.length} of ${sodium.crypto_secretbox_KEYBYTES} bytes needed`)
        }

        const { publicKey, privateKey } = sodium.crypto_sign_keypair();
        const unique = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)

        const securePrivateKey = sodium.crypto_secretbox_easy(
          privateKey,
          unique,
          passwd
        )

        self.postMessage({
          success: true,
          action,
          result: {
            publicKey: encode(publicKey),
            privateKey: encode(securePrivateKey),
            unique: encode(unique),
          }
        })
        break;
      default:
        throw new Error(`Action ${action} invalid.`);
    }
  }
  catch (error: any) {
    self.postMessage({ success: false, action, error: error.message })
  }
}
