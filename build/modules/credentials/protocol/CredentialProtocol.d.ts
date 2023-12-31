import type { CreateCredentialProposalOptions, CredentialProtocolMsgReturnType, DeleteCredentialOptions, AcceptCredentialProposalOptions, NegotiateCredentialProposalOptions, CreateCredentialOfferOptions, NegotiateCredentialOfferOptions, CreateCredentialRequestOptions, AcceptCredentialOfferOptions, AcceptCredentialRequestOptions, AcceptCredentialOptions, GetCredentialFormatDataReturn, CreateCredentialProblemReportOptions } from './CredentialProtocolOptions';
import type { AgentContext } from '../../../agent';
import type { AgentMessage } from '../../../agent/AgentMessage';
import type { FeatureRegistry } from '../../../agent/FeatureRegistry';
import type { InboundMessageContext } from '../../../agent/models/InboundMessageContext';
import type { DependencyManager } from '../../../plugins';
import type { Query } from '../../../storage/StorageService';
import type { ProblemReportMessage } from '../../problem-reports';
import type { CredentialFormatService, ExtractCredentialFormats } from '../formats';
import type { CredentialState } from '../models/CredentialState';
import type { CredentialExchangeRecord } from '../repository';
export interface CredentialProtocol<CFs extends CredentialFormatService[] = CredentialFormatService[]> {
    readonly version: string;
    createProposal(agentContext: AgentContext, options: CreateCredentialProposalOptions<CFs>): Promise<CredentialProtocolMsgReturnType<AgentMessage>>;
    processProposal(messageContext: InboundMessageContext<AgentMessage>): Promise<CredentialExchangeRecord>;
    acceptProposal(agentContext: AgentContext, options: AcceptCredentialProposalOptions<CFs>): Promise<CredentialProtocolMsgReturnType<AgentMessage>>;
    negotiateProposal(agentContext: AgentContext, options: NegotiateCredentialProposalOptions<CFs>): Promise<CredentialProtocolMsgReturnType<AgentMessage>>;
    createOffer(agentContext: AgentContext, options: CreateCredentialOfferOptions<CFs>): Promise<CredentialProtocolMsgReturnType<AgentMessage>>;
    processOffer(messageContext: InboundMessageContext<AgentMessage>): Promise<CredentialExchangeRecord>;
    acceptOffer(agentContext: AgentContext, options: AcceptCredentialOfferOptions<CFs>): Promise<CredentialProtocolMsgReturnType<AgentMessage>>;
    negotiateOffer(agentContext: AgentContext, options: NegotiateCredentialOfferOptions<CFs>): Promise<CredentialProtocolMsgReturnType<AgentMessage>>;
    createRequest(agentContext: AgentContext, options: CreateCredentialRequestOptions<CFs>): Promise<CredentialProtocolMsgReturnType<AgentMessage>>;
    processRequest(messageContext: InboundMessageContext<AgentMessage>): Promise<CredentialExchangeRecord>;
    acceptRequest(agentContext: AgentContext, options: AcceptCredentialRequestOptions<CFs>): Promise<CredentialProtocolMsgReturnType<AgentMessage>>;
    processCredential(messageContext: InboundMessageContext<AgentMessage>): Promise<CredentialExchangeRecord>;
    acceptCredential(agentContext: AgentContext, options: AcceptCredentialOptions): Promise<CredentialProtocolMsgReturnType<AgentMessage>>;
    processAck(messageContext: InboundMessageContext<AgentMessage>): Promise<CredentialExchangeRecord>;
    createProblemReport(agentContext: AgentContext, options: CreateCredentialProblemReportOptions): Promise<CredentialProtocolMsgReturnType<ProblemReportMessage>>;
    processProblemReport(messageContext: InboundMessageContext<ProblemReportMessage>): Promise<CredentialExchangeRecord>;
    findProposalMessage(agentContext: AgentContext, credentialExchangeId: string): Promise<AgentMessage | null>;
    findOfferMessage(agentContext: AgentContext, credentialExchangeId: string): Promise<AgentMessage | null>;
    findRequestMessage(agentContext: AgentContext, credentialExchangeId: string): Promise<AgentMessage | null>;
    findCredentialMessage(agentContext: AgentContext, credentialExchangeId: string): Promise<AgentMessage | null>;
    getFormatData(agentContext: AgentContext, credentialExchangeId: string): Promise<GetCredentialFormatDataReturn<ExtractCredentialFormats<CFs>>>;
    updateState(agentContext: AgentContext, credentialRecord: CredentialExchangeRecord, newState: CredentialState): Promise<void>;
    getById(agentContext: AgentContext, credentialExchangeId: string): Promise<CredentialExchangeRecord>;
    getAll(agentContext: AgentContext): Promise<CredentialExchangeRecord[]>;
    findAllByQuery(agentContext: AgentContext, query: Query<CredentialExchangeRecord>): Promise<CredentialExchangeRecord[]>;
    findById(agentContext: AgentContext, credentialExchangeId: string): Promise<CredentialExchangeRecord | null>;
    delete(agentContext: AgentContext, credentialRecord: CredentialExchangeRecord, options?: DeleteCredentialOptions): Promise<void>;
    getByThreadAndConnectionId(agentContext: AgentContext, threadId: string, connectionId?: string): Promise<CredentialExchangeRecord>;
    findByThreadAndConnectionId(agentContext: AgentContext, threadId: string, connectionId?: string): Promise<CredentialExchangeRecord | null>;
    update(agentContext: AgentContext, credentialRecord: CredentialExchangeRecord): Promise<void>;
    register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry): void;
}
