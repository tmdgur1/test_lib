import { JsonTransformer } from '../../../../utils'
import { Ed25519Signature2018Fixtures } from '../../data-integrity/__tests__/fixtures'
import { W3cJsonLdVerifiableCredential } from '../../data-integrity/models'
import { W3cCredentialRecord } from '../W3cCredentialRecord'

describe('W3cCredentialRecord', () => {
  describe('getTags', () => {
    it('should return default tags', () => {
      const credential = JsonTransformer.fromJSON(
        Ed25519Signature2018Fixtures.TEST_LD_DOCUMENT_SIGNED,
        W3cJsonLdVerifiableCredential
      )

      const w3cCredentialRecord = new W3cCredentialRecord({
        credential,
        tags: {
          expandedTypes: ['https://expanded.tag#1'],
        },
      })

      expect(w3cCredentialRecord.getTags()).toEqual({
        claimFormat: 'ldp_vc',
        issuerId: credential.issuerId,
        subjectIds: credential.credentialSubjectIds,
        schemaIds: credential.credentialSchemaIds,
        contexts: credential.contexts,
        proofTypes: credential.proofTypes,
        givenId: credential.id,
        expandedTypes: ['https://expanded.tag#1'],
      })
    })
  })
})
