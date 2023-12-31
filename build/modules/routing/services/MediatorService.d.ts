import type { AgentContext } from '../../../agent';
import type { InboundMessageContext } from '../../../agent/models/InboundMessageContext';
import type { Query } from '../../../storage/StorageService';
import type { EncryptedMessage } from '../../../types';
import type { ForwardMessage, MediationRequestMessage } from '../messages';
import { EventEmitter } from '../../../agent/EventEmitter';
import { Logger } from '../../../logger';
import { ConnectionService } from '../../connections';
import { KeylistUpdateMessage, KeylistUpdateResponseMessage, MediationGrantMessage } from '../messages';
import { MediatorRoutingRecord } from '../repository';
import { MediationRecord } from '../repository/MediationRecord';
import { MediationRepository } from '../repository/MediationRepository';
import { MediatorRoutingRepository } from '../repository/MediatorRoutingRepository';
export declare class MediatorService {
    private logger;
    private mediationRepository;
    private mediatorRoutingRepository;
    private eventEmitter;
    private connectionService;
    constructor(mediationRepository: MediationRepository, mediatorRoutingRepository: MediatorRoutingRepository, eventEmitter: EventEmitter, logger: Logger, connectionService: ConnectionService);
    private getRoutingKeys;
    processForwardMessage(messageContext: InboundMessageContext<ForwardMessage>): Promise<{
        mediationRecord: MediationRecord;
        encryptedMessage: EncryptedMessage;
    }>;
    processKeylistUpdateRequest(messageContext: InboundMessageContext<KeylistUpdateMessage>): Promise<KeylistUpdateResponseMessage>;
    createGrantMediationMessage(agentContext: AgentContext, mediationRecord: MediationRecord): Promise<{
        mediationRecord: MediationRecord;
        message: MediationGrantMessage;
    }>;
    processMediationRequest(messageContext: InboundMessageContext<MediationRequestMessage>): Promise<MediationRecord>;
    findById(agentContext: AgentContext, mediatorRecordId: string): Promise<MediationRecord | null>;
    getById(agentContext: AgentContext, mediatorRecordId: string): Promise<MediationRecord>;
    getAll(agentContext: AgentContext): Promise<MediationRecord[]>;
    findMediatorRoutingRecord(agentContext: AgentContext): Promise<MediatorRoutingRecord | null>;
    createMediatorRoutingRecord(agentContext: AgentContext): Promise<MediatorRoutingRecord | null>;
    findAllByQuery(agentContext: AgentContext, query: Query<MediationRecord>): Promise<MediationRecord[]>;
    private updateState;
    private emitStateChangedEvent;
    private updateUseDidKeysFlag;
}
