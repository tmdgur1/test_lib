import type { AcceptProofOptions, AcceptProofProposalOptions, AcceptProofRequestOptions, CreateProofRequestOptions, DeleteProofOptions, FindProofPresentationMessageReturn, FindProofProposalMessageReturn, FindProofRequestMessageReturn, GetCredentialsForProofRequestOptions, GetCredentialsForProofRequestReturn, GetProofFormatDataReturn, NegotiateProofProposalOptions, NegotiateProofRequestOptions, ProposeProofOptions, RequestProofOptions, SelectCredentialsForProofRequestOptions, SelectCredentialsForProofRequestReturn, SendProofProblemReportOptions, DeclineProofRequestOptions } from './ProofsApiOptions';
import type { ProofProtocol } from './protocol/ProofProtocol';
import type { ProofFormatsFromProtocols } from './protocol/ProofProtocolOptions';
import type { ProofExchangeRecord } from './repository/ProofExchangeRecord';
import type { AgentMessage } from '../../agent/AgentMessage';
import type { Query } from '../../storage/StorageService';
import { MessageSender } from '../../agent/MessageSender';
import { AgentContext } from '../../agent/context/AgentContext';
import { DidCommMessageRepository } from '../../storage';
import { ConnectionService } from '../connections/services/ConnectionService';
import { RoutingService } from '../routing/services/RoutingService';
import { ProofsModuleConfig } from './ProofsModuleConfig';
import { ProofRepository } from './repository/ProofRepository';
export interface ProofsApi<PPs extends ProofProtocol[]> {
    proposeProof(options: ProposeProofOptions<PPs>): Promise<ProofExchangeRecord>;
    acceptProposal(options: AcceptProofProposalOptions<PPs>): Promise<ProofExchangeRecord>;
    negotiateProposal(options: NegotiateProofProposalOptions<PPs>): Promise<ProofExchangeRecord>;
    requestProof(options: RequestProofOptions<PPs>): Promise<ProofExchangeRecord>;
    acceptRequest(options: AcceptProofRequestOptions<PPs>): Promise<ProofExchangeRecord>;
    declineRequest(options: DeclineProofRequestOptions): Promise<ProofExchangeRecord>;
    negotiateRequest(options: NegotiateProofRequestOptions<PPs>): Promise<ProofExchangeRecord>;
    acceptPresentation(options: AcceptProofOptions): Promise<ProofExchangeRecord>;
    createRequest(options: CreateProofRequestOptions<PPs>): Promise<{
        message: AgentMessage;
        proofRecord: ProofExchangeRecord;
    }>;
    selectCredentialsForRequest(options: SelectCredentialsForProofRequestOptions<PPs>): Promise<SelectCredentialsForProofRequestReturn<PPs>>;
    getCredentialsForRequest(options: GetCredentialsForProofRequestOptions<PPs>): Promise<GetCredentialsForProofRequestReturn<PPs>>;
    sendProblemReport(options: SendProofProblemReportOptions): Promise<ProofExchangeRecord>;
    getAll(): Promise<ProofExchangeRecord[]>;
    findAllByQuery(query: Query<ProofExchangeRecord>): Promise<ProofExchangeRecord[]>;
    getById(proofRecordId: string): Promise<ProofExchangeRecord>;
    findById(proofRecordId: string): Promise<ProofExchangeRecord | null>;
    deleteById(proofId: string, options?: DeleteProofOptions): Promise<void>;
    update(proofRecord: ProofExchangeRecord): Promise<void>;
    getFormatData(proofRecordId: string): Promise<GetProofFormatDataReturn<ProofFormatsFromProtocols<PPs>>>;
    findProposalMessage(proofRecordId: string): Promise<FindProofProposalMessageReturn<PPs>>;
    findRequestMessage(proofRecordId: string): Promise<FindProofRequestMessageReturn<PPs>>;
    findPresentationMessage(proofRecordId: string): Promise<FindProofPresentationMessageReturn<PPs>>;
}
export declare class ProofsApi<PPs extends ProofProtocol[]> implements ProofsApi<PPs> {
    /**
     * Configuration for the proofs module
     */
    readonly config: ProofsModuleConfig<PPs>;
    private connectionService;
    private messageSender;
    private routingService;
    private proofRepository;
    private didCommMessageRepository;
    private agentContext;
    constructor(messageSender: MessageSender, connectionService: ConnectionService, agentContext: AgentContext, proofRepository: ProofRepository, routingService: RoutingService, didCommMessageRepository: DidCommMessageRepository, config: ProofsModuleConfig<PPs>);
    private getProtocol;
    /**
     * Retrieve a proof record by connection id and thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @throws {RecordNotFoundError} If no record is found
     * @throws {RecordDuplicateError} If multiple records are found
     * @returns The proof record
     */
    getByThreadAndConnectionId(threadId: string, connectionId?: string): Promise<ProofExchangeRecord>;
    /**
     * Retrieve proof records by connection id and parent thread id
     *
     * @param connectionId The connection id
     * @param parentThreadId The parent thread id
     * @returns List containing all proof records matching the given query
     */
    getByParentThreadAndConnectionId(parentThreadId: string, connectionId?: string): Promise<ProofExchangeRecord[]>;
}
