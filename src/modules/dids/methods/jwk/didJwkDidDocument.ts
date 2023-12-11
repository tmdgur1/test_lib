import type { DidJwk } from './DidJwk'

import { AriesFrameworkError } from '../../../../error'
import { JsonEncoder } from '../../../../utils'
import { SECURITY_JWS_CONTEXT_URL } from '../../../vc/constants'
import { getJsonWebKey2020, DidDocumentBuilder } from '../../domain'
import { parseDid } from '../../domain/parse'

export function getDidJwkDocument(didJwk: DidJwk) {
  if (!didJwk.allowsEncrypting && !didJwk.allowsSigning) {
    throw new AriesFrameworkError('At least one of allowsSigning or allowsEncrypting must be enabled')
  }

  const parsed = parseDid(didJwk.did)
  const jwkJson = JsonEncoder.fromBase64(parsed.id)

  const verificationMethod = getJsonWebKey2020({
    did: didJwk.did,
    jwk: jwkJson,
    verificationMethodId: didJwk.verificationMethodId,
  })

  const didDocumentBuilder = new DidDocumentBuilder(didJwk.did)
    .addContext(SECURITY_JWS_CONTEXT_URL)
    .addVerificationMethod(verificationMethod)

  if (didJwk.allowsSigning) {
    didDocumentBuilder
      .addAuthentication(verificationMethod.id)
      .addAssertionMethod(verificationMethod.id)
      .addCapabilityDelegation(verificationMethod.id)
      .addCapabilityInvocation(verificationMethod.id)
  }

  if (didJwk.allowsEncrypting) {
    didDocumentBuilder.addKeyAgreement(verificationMethod.id)
  }

  return didDocumentBuilder.build()
}
