"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediatorService = void 0;
const EventEmitter_1 = require("../../../agent/EventEmitter");
const constants_1 = require("../../../constants");
const crypto_1 = require("../../../crypto");
const error_1 = require("../../../error");
const plugins_1 = require("../../../plugins");
const connections_1 = require("../../connections");
const ConnectionMetadataTypes_1 = require("../../connections/repository/ConnectionMetadataTypes");
const helpers_1 = require("../../dids/helpers");
const RoutingEvents_1 = require("../RoutingEvents");
const messages_1 = require("../messages");
const MediationRole_1 = require("../models/MediationRole");
const MediationState_1 = require("../models/MediationState");
const repository_1 = require("../repository");
const MediationRecord_1 = require("../repository/MediationRecord");
const MediationRepository_1 = require("../repository/MediationRepository");
const MediatorRoutingRepository_1 = require("../repository/MediatorRoutingRepository");
let MediatorService = class MediatorService {
    constructor(mediationRepository, mediatorRoutingRepository, eventEmitter, logger, connectionService) {
        this.mediationRepository = mediationRepository;
        this.mediatorRoutingRepository = mediatorRoutingRepository;
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.connectionService = connectionService;
    }
    async getRoutingKeys(agentContext) {
        const mediatorRoutingRecord = await this.findMediatorRoutingRecord(agentContext);
        if (mediatorRoutingRecord) {
            // Return the routing keys
            this.logger.debug(`Returning mediator routing keys ${mediatorRoutingRecord.routingKeys}`);
            return mediatorRoutingRecord.routingKeys;
        }
        throw new error_1.AriesFrameworkError(`Mediator has not been initialized yet.`);
    }
    async processForwardMessage(messageContext) {
        const { message } = messageContext;
        // TODO: update to class-validator validation
        if (!message.to) {
            throw new error_1.AriesFrameworkError('Invalid Message: Missing required attribute "to"');
        }
        const mediationRecord = await this.mediationRepository.getSingleByRecipientKey(messageContext.agentContext, message.to);
        // Assert mediation record is ready to be used
        mediationRecord.assertReady();
        mediationRecord.assertRole(MediationRole_1.MediationRole.Mediator);
        return {
            encryptedMessage: message.message,
            mediationRecord,
        };
    }
    async processKeylistUpdateRequest(messageContext) {
        // Assert Ready connection
        const connection = messageContext.assertReadyConnection();
        const { message } = messageContext;
        const keylist = [];
        const mediationRecord = await this.mediationRepository.getByConnectionId(messageContext.agentContext, connection.id);
        mediationRecord.assertReady();
        mediationRecord.assertRole(MediationRole_1.MediationRole.Mediator);
        // Update connection metadata to use their key format in further protocol messages
        const connectionUsesDidKey = message.updates.some((update) => (0, helpers_1.isDidKey)(update.recipientKey));
        await this.updateUseDidKeysFlag(messageContext.agentContext, connection, messages_1.KeylistUpdateMessage.type.protocolUri, connectionUsesDidKey);
        for (const update of message.updates) {
            const updated = new messages_1.KeylistUpdated({
                action: update.action,
                recipientKey: update.recipientKey,
                result: messages_1.KeylistUpdateResult.NoChange,
            });
            // According to RFC 0211 key should be a did key, but base58 encoded verkey was used before
            // RFC was accepted. This converts the key to a public key base58 if it is a did key.
            const publicKeyBase58 = (0, helpers_1.didKeyToVerkey)(update.recipientKey);
            if (update.action === messages_1.KeylistUpdateAction.add) {
                mediationRecord.addRecipientKey(publicKeyBase58);
                updated.result = messages_1.KeylistUpdateResult.Success;
                keylist.push(updated);
            }
            else if (update.action === messages_1.KeylistUpdateAction.remove) {
                const success = mediationRecord.removeRecipientKey(publicKeyBase58);
                updated.result = success ? messages_1.KeylistUpdateResult.Success : messages_1.KeylistUpdateResult.NoChange;
                keylist.push(updated);
            }
        }
        await this.mediationRepository.update(messageContext.agentContext, mediationRecord);
        return new messages_1.KeylistUpdateResponseMessage({ keylist, threadId: message.threadId });
    }
    async createGrantMediationMessage(agentContext, mediationRecord) {
        // Assert
        mediationRecord.assertState(MediationState_1.MediationState.Requested);
        mediationRecord.assertRole(MediationRole_1.MediationRole.Mediator);
        await this.updateState(agentContext, mediationRecord, MediationState_1.MediationState.Granted);
        // Use our useDidKey configuration, as this is the first interaction for this protocol
        const useDidKey = agentContext.config.useDidKeyInProtocols;
        const message = new messages_1.MediationGrantMessage({
            endpoint: agentContext.config.endpoints[0],
            routingKeys: useDidKey
                ? (await this.getRoutingKeys(agentContext)).map(helpers_1.verkeyToDidKey)
                : await this.getRoutingKeys(agentContext),
            threadId: mediationRecord.threadId,
        });
        return { mediationRecord, message };
    }
    async processMediationRequest(messageContext) {
        // Assert ready connection
        const connection = messageContext.assertReadyConnection();
        const mediationRecord = new MediationRecord_1.MediationRecord({
            connectionId: connection.id,
            role: MediationRole_1.MediationRole.Mediator,
            state: MediationState_1.MediationState.Requested,
            threadId: messageContext.message.threadId,
        });
        await this.mediationRepository.save(messageContext.agentContext, mediationRecord);
        this.emitStateChangedEvent(messageContext.agentContext, mediationRecord, null);
        return mediationRecord;
    }
    async findById(agentContext, mediatorRecordId) {
        return this.mediationRepository.findById(agentContext, mediatorRecordId);
    }
    async getById(agentContext, mediatorRecordId) {
        return this.mediationRepository.getById(agentContext, mediatorRecordId);
    }
    async getAll(agentContext) {
        return await this.mediationRepository.getAll(agentContext);
    }
    async findMediatorRoutingRecord(agentContext) {
        const routingRecord = await this.mediatorRoutingRepository.findById(agentContext, this.mediatorRoutingRepository.MEDIATOR_ROUTING_RECORD_ID);
        return routingRecord;
    }
    async createMediatorRoutingRecord(agentContext) {
        const routingKey = await agentContext.wallet.createKey({
            keyType: crypto_1.KeyType.Ed25519,
        });
        const routingRecord = new repository_1.MediatorRoutingRecord({
            id: this.mediatorRoutingRepository.MEDIATOR_ROUTING_RECORD_ID,
            // FIXME: update to fingerprint to include the key type
            routingKeys: [routingKey.publicKeyBase58],
        });
        try {
            await this.mediatorRoutingRepository.save(agentContext, routingRecord);
            this.eventEmitter.emit(agentContext, {
                type: RoutingEvents_1.RoutingEventTypes.RoutingCreatedEvent,
                payload: {
                    routing: {
                        endpoints: agentContext.config.endpoints,
                        routingKeys: [],
                        recipientKey: routingKey,
                    },
                },
            });
        }
        catch (error) {
            // This addresses some race conditions issues where we first check if the record exists
            // then we create one if it doesn't, but another process has created one in the meantime
            // Although not the most elegant solution, it addresses the issues
            if (error instanceof error_1.RecordDuplicateError) {
                // the record already exists, which is our intended end state
                // we can ignore this error and fetch the existing record
                return this.mediatorRoutingRepository.getById(agentContext, this.mediatorRoutingRepository.MEDIATOR_ROUTING_RECORD_ID);
            }
            else {
                throw error;
            }
        }
        return routingRecord;
    }
    async findAllByQuery(agentContext, query) {
        return await this.mediationRepository.findByQuery(agentContext, query);
    }
    async updateState(agentContext, mediationRecord, newState) {
        const previousState = mediationRecord.state;
        mediationRecord.state = newState;
        await this.mediationRepository.update(agentContext, mediationRecord);
        this.emitStateChangedEvent(agentContext, mediationRecord, previousState);
    }
    emitStateChangedEvent(agentContext, mediationRecord, previousState) {
        this.eventEmitter.emit(agentContext, {
            type: RoutingEvents_1.RoutingEventTypes.MediationStateChanged,
            payload: {
                mediationRecord: mediationRecord.clone(),
                previousState,
            },
        });
    }
    async updateUseDidKeysFlag(agentContext, connection, protocolUri, connectionUsesDidKey) {
        var _a;
        const useDidKeysForProtocol = (_a = connection.metadata.get(ConnectionMetadataTypes_1.ConnectionMetadataKeys.UseDidKeysForProtocol)) !== null && _a !== void 0 ? _a : {};
        useDidKeysForProtocol[protocolUri] = connectionUsesDidKey;
        connection.metadata.set(ConnectionMetadataTypes_1.ConnectionMetadataKeys.UseDidKeysForProtocol, useDidKeysForProtocol);
        await this.connectionService.update(agentContext, connection);
    }
};
MediatorService = __decorate([
    (0, plugins_1.injectable)(),
    __param(3, (0, plugins_1.inject)(constants_1.InjectionSymbols.Logger)),
    __metadata("design:paramtypes", [MediationRepository_1.MediationRepository,
        MediatorRoutingRepository_1.MediatorRoutingRepository,
        EventEmitter_1.EventEmitter, Object, connections_1.ConnectionService])
], MediatorService);
exports.MediatorService = MediatorService;
//# sourceMappingURL=MediatorService.js.map