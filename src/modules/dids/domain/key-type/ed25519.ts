import type { KeyDidMapping } from './keyDidMapping'
import type { VerificationMethod } from '../verificationMethod'

import { KeyType } from '../../../../crypto/KeyType'
import { AriesFrameworkError } from '../../../../error'
import {
  getKeyFromEd25519VerificationKey2018,
  isEd25519VerificationKey2018,
  getKeyFromEd25519VerificationKey2020,
  getKeyFromJsonWebKey2020,
  isEd25519VerificationKey2020,
  isJsonWebKey2020,
  getEd25519VerificationKey2018,
  VERIFICATION_METHOD_TYPE_ED25519_VERIFICATION_KEY_2018,
  VERIFICATION_METHOD_TYPE_ED25519_VERIFICATION_KEY_2020,
  VERIFICATION_METHOD_TYPE_JSON_WEB_KEY_2020,
} from '../verificationMethod'

export { convertPublicKeyToX25519 } from '@stablelib/ed25519'

export const keyDidEd25519: KeyDidMapping = {
  supportedVerificationMethodTypes: [
    VERIFICATION_METHOD_TYPE_ED25519_VERIFICATION_KEY_2018,
    VERIFICATION_METHOD_TYPE_ED25519_VERIFICATION_KEY_2020,
    VERIFICATION_METHOD_TYPE_JSON_WEB_KEY_2020,
  ],
  getVerificationMethods: (did, key) => [
    getEd25519VerificationKey2018({ id: `${did}#${key.fingerprint}`, key, controller: did }),
  ],
  getKeyFromVerificationMethod: (verificationMethod: VerificationMethod) => {
    if (isEd25519VerificationKey2018(verificationMethod)) {
      return getKeyFromEd25519VerificationKey2018(verificationMethod)
    }

    if (isEd25519VerificationKey2020(verificationMethod)) {
      return getKeyFromEd25519VerificationKey2020(verificationMethod)
    }

    if (isJsonWebKey2020(verificationMethod)) {
      return getKeyFromJsonWebKey2020(verificationMethod)
    }

    throw new AriesFrameworkError(
      `Verification method with type '${verificationMethod.type}' not supported for key type '${KeyType.Ed25519}'`
    )
  },
}
