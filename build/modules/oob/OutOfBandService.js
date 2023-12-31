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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutOfBandService = void 0;
const EventEmitter_1 = require("../../agent/EventEmitter");
const error_1 = require("../../error");
const plugins_1 = require("../../plugins");
const dids_1 = require("../dids");
const parse_1 = require("../dids/domain/parse");
const OutOfBandEvents_1 = require("./domain/OutOfBandEvents");
const OutOfBandRole_1 = require("./domain/OutOfBandRole");
const OutOfBandState_1 = require("./domain/OutOfBandState");
const messages_1 = require("./messages");
const HandshakeReuseAcceptedMessage_1 = require("./messages/HandshakeReuseAcceptedMessage");
const repository_1 = require("./repository");
let OutOfBandService = class OutOfBandService {
    constructor(outOfBandRepository, eventEmitter) {
        this.outOfBandRepository = outOfBandRepository;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Creates an Out of Band record from a Connection/DIDExchange request started by using
     * a publicly resolvable DID this agent can control
     */
    async createFromImplicitInvitation(agentContext, config) {
        const { did, threadId, handshakeProtocols, autoAcceptConnection, recipientKey } = config;
        // Verify it is a valid did and it is present in the wallet
        const publicDid = (0, parse_1.parseDid)(did);
        const didsApi = agentContext.dependencyManager.resolve(dids_1.DidsApi);
        const [createdDid] = await didsApi.getCreatedDids({ did: publicDid.did });
        if (!createdDid) {
            throw new error_1.AriesFrameworkError(`Referenced public did ${did} not found.`);
        }
        // Recreate an 'implicit invitation' matching the parameters used by the invitee when
        // initiating the flow
        const outOfBandInvitation = new messages_1.OutOfBandInvitation({
            id: did,
            label: '',
            services: [did],
            handshakeProtocols,
        });
        outOfBandInvitation.setThread({ threadId });
        const outOfBandRecord = new repository_1.OutOfBandRecord({
            role: OutOfBandRole_1.OutOfBandRole.Sender,
            state: OutOfBandState_1.OutOfBandState.AwaitResponse,
            reusable: true,
            autoAcceptConnection: autoAcceptConnection !== null && autoAcceptConnection !== void 0 ? autoAcceptConnection : false,
            outOfBandInvitation,
            tags: {
                recipientKeyFingerprints: [recipientKey.fingerprint],
            },
        });
        await this.save(agentContext, outOfBandRecord);
        this.emitStateChangedEvent(agentContext, outOfBandRecord, null);
        return outOfBandRecord;
    }
    async processHandshakeReuse(messageContext) {
        var _a, _b, _c;
        const reuseMessage = messageContext.message;
        const parentThreadId = (_a = reuseMessage.thread) === null || _a === void 0 ? void 0 : _a.parentThreadId;
        if (!parentThreadId) {
            throw new error_1.AriesFrameworkError('handshake-reuse message must have a parent thread id');
        }
        const outOfBandRecord = await this.findByCreatedInvitationId(messageContext.agentContext, parentThreadId);
        if (!outOfBandRecord) {
            throw new error_1.AriesFrameworkError('No out of band record found for handshake-reuse message');
        }
        // Assert
        outOfBandRecord.assertRole(OutOfBandRole_1.OutOfBandRole.Sender);
        outOfBandRecord.assertState(OutOfBandState_1.OutOfBandState.AwaitResponse);
        const requestLength = (_c = (_b = outOfBandRecord.outOfBandInvitation.getRequests()) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
        if (requestLength > 0) {
            throw new error_1.AriesFrameworkError('Handshake reuse should only be used when no requests are present');
        }
        const reusedConnection = messageContext.assertReadyConnection();
        this.eventEmitter.emit(messageContext.agentContext, {
            type: OutOfBandEvents_1.OutOfBandEventTypes.HandshakeReused,
            payload: {
                reuseThreadId: reuseMessage.threadId,
                connectionRecord: reusedConnection,
                outOfBandRecord,
            },
        });
        // If the out of band record is not reusable we can set the state to done
        if (!outOfBandRecord.reusable) {
            await this.updateState(messageContext.agentContext, outOfBandRecord, OutOfBandState_1.OutOfBandState.Done);
        }
        const reuseAcceptedMessage = new HandshakeReuseAcceptedMessage_1.HandshakeReuseAcceptedMessage({
            threadId: reuseMessage.threadId,
            parentThreadId,
        });
        return reuseAcceptedMessage;
    }
    async processHandshakeReuseAccepted(messageContext) {
        var _a;
        const reuseAcceptedMessage = messageContext.message;
        const parentThreadId = (_a = reuseAcceptedMessage.thread) === null || _a === void 0 ? void 0 : _a.parentThreadId;
        if (!parentThreadId) {
            throw new error_1.AriesFrameworkError('handshake-reuse-accepted message must have a parent thread id');
        }
        const outOfBandRecord = await this.findByReceivedInvitationId(messageContext.agentContext, parentThreadId);
        if (!outOfBandRecord) {
            throw new error_1.AriesFrameworkError('No out of band record found for handshake-reuse-accepted message');
        }
        // Assert
        outOfBandRecord.assertRole(OutOfBandRole_1.OutOfBandRole.Receiver);
        outOfBandRecord.assertState(OutOfBandState_1.OutOfBandState.PrepareResponse);
        const reusedConnection = messageContext.assertReadyConnection();
        // Checks whether the connection associated with reuse accepted message matches with the connection
        // associated with the reuse message.
        // FIXME: not really a fan of the reuseConnectionId, but it's the only way I can think of now to get the connection
        // associated with the reuse message. Maybe we can at least move it to the metadata and remove it directly afterwards?
        // But this is an issue in general that has also come up for ACA-Py. How do I find the connection associated with an oob record?
        // Because it doesn't work really well with connection reuse.
        if (outOfBandRecord.reuseConnectionId !== reusedConnection.id) {
            throw new error_1.AriesFrameworkError('handshake-reuse-accepted is not in response to a handshake-reuse message.');
        }
        this.eventEmitter.emit(messageContext.agentContext, {
            type: OutOfBandEvents_1.OutOfBandEventTypes.HandshakeReused,
            payload: {
                reuseThreadId: reuseAcceptedMessage.threadId,
                connectionRecord: reusedConnection,
                outOfBandRecord,
            },
        });
        // receiver role is never reusable, so we can set the state to done
        await this.updateState(messageContext.agentContext, outOfBandRecord, OutOfBandState_1.OutOfBandState.Done);
    }
    async createHandShakeReuse(agentContext, outOfBandRecord, connectionRecord) {
        const reuseMessage = new messages_1.HandshakeReuseMessage({ parentThreadId: outOfBandRecord.outOfBandInvitation.id });
        // Store the reuse connection id
        outOfBandRecord.reuseConnectionId = connectionRecord.id;
        await this.outOfBandRepository.update(agentContext, outOfBandRecord);
        return reuseMessage;
    }
    async save(agentContext, outOfBandRecord) {
        return this.outOfBandRepository.save(agentContext, outOfBandRecord);
    }
    async updateState(agentContext, outOfBandRecord, newState) {
        const previousState = outOfBandRecord.state;
        outOfBandRecord.state = newState;
        await this.outOfBandRepository.update(agentContext, outOfBandRecord);
        this.emitStateChangedEvent(agentContext, outOfBandRecord, previousState);
    }
    emitStateChangedEvent(agentContext, outOfBandRecord, previousState) {
        this.eventEmitter.emit(agentContext, {
            type: OutOfBandEvents_1.OutOfBandEventTypes.OutOfBandStateChanged,
            payload: {
                outOfBandRecord: outOfBandRecord.clone(),
                previousState,
            },
        });
    }
    async findById(agentContext, outOfBandRecordId) {
        return this.outOfBandRepository.findById(agentContext, outOfBandRecordId);
    }
    async getById(agentContext, outOfBandRecordId) {
        return this.outOfBandRepository.getById(agentContext, outOfBandRecordId);
    }
    async findByReceivedInvitationId(agentContext, receivedInvitationId) {
        return this.outOfBandRepository.findSingleByQuery(agentContext, {
            invitationId: receivedInvitationId,
            role: OutOfBandRole_1.OutOfBandRole.Receiver,
        });
    }
    async findByCreatedInvitationId(agentContext, createdInvitationId, threadId) {
        return this.outOfBandRepository.findSingleByQuery(agentContext, {
            invitationId: createdInvitationId,
            role: OutOfBandRole_1.OutOfBandRole.Sender,
            threadId,
        });
    }
    async findCreatedByRecipientKey(agentContext, recipientKey) {
        return this.outOfBandRepository.findSingleByQuery(agentContext, {
            recipientKeyFingerprints: [recipientKey.fingerprint],
            role: OutOfBandRole_1.OutOfBandRole.Sender,
        });
    }
    async getAll(agentContext) {
        return this.outOfBandRepository.getAll(agentContext);
    }
    async findAllByQuery(agentContext, query) {
        return this.outOfBandRepository.findByQuery(agentContext, query);
    }
    async deleteById(agentContext, outOfBandId) {
        const outOfBandRecord = await this.getById(agentContext, outOfBandId);
        return this.outOfBandRepository.delete(agentContext, outOfBandRecord);
    }
};
OutOfBandService = __decorate([
    (0, plugins_1.injectable)(),
    __metadata("design:paramtypes", [repository_1.OutOfBandRepository, EventEmitter_1.EventEmitter])
], OutOfBandService);
exports.OutOfBandService = OutOfBandService;
//# sourceMappingURL=OutOfBandService.js.map