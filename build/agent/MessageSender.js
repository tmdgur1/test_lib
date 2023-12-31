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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDidCommTransportQueue = exports.MessageSender = void 0;
const constants_1 = require("../constants");
const TransportDecorator_1 = require("../decorators/transport/TransportDecorator");
const error_1 = require("../error");
const didcomm_1 = require("../modules/didcomm");
const key_type_1 = require("../modules/dids/domain/key-type");
const helpers_1 = require("../modules/dids/helpers");
const DidResolverService_1 = require("../modules/dids/services/DidResolverService");
const plugins_1 = require("../plugins");
const MessageValidator_1 = require("../utils/MessageValidator");
const uri_1 = require("../utils/uri");
const EnvelopeService_1 = require("./EnvelopeService");
const EventEmitter_1 = require("./EventEmitter");
const Events_1 = require("./Events");
const TransportService_1 = require("./TransportService");
const models_1 = require("./models");
let MessageSender = class MessageSender {
    constructor(envelopeService, transportService, messageRepository, logger, didResolverService, didCommDocumentService, eventEmitter) {
        this._outboundTransports = [];
        this.envelopeService = envelopeService;
        this.transportService = transportService;
        this.messageRepository = messageRepository;
        this.logger = logger;
        this.didResolverService = didResolverService;
        this.didCommDocumentService = didCommDocumentService;
        this.eventEmitter = eventEmitter;
        this._outboundTransports = [];
    }
    get outboundTransports() {
        return this._outboundTransports;
    }
    registerOutboundTransport(outboundTransport) {
        this._outboundTransports.push(outboundTransport);
    }
    async unregisterOutboundTransport(outboundTransport) {
        this._outboundTransports = this.outboundTransports.filter((transport) => transport !== outboundTransport);
        await outboundTransport.stop();
    }
    async packMessage(agentContext, { keys, message, endpoint, }) {
        const encryptedMessage = await this.envelopeService.packMessage(agentContext, message, keys);
        return {
            payload: encryptedMessage,
            responseRequested: message.hasAnyReturnRoute(),
            endpoint,
        };
    }
    async sendMessageToSession(agentContext, session, message) {
        this.logger.debug(`Existing ${session.type} transport session has been found.`);
        if (!session.keys) {
            throw new error_1.AriesFrameworkError(`There are no keys for the given ${session.type} transport session.`);
        }
        const encryptedMessage = await this.envelopeService.packMessage(agentContext, message, session.keys);
        await session.send(agentContext, encryptedMessage);
    }
    async sendPackage(agentContext, { connection, encryptedMessage, options, }) {
        var _a, e_1, _b, _c;
        var _d;
        const errors = [];
        // Try to send to already open session
        const session = this.transportService.findSessionByConnectionId(connection.id);
        if ((_d = session === null || session === void 0 ? void 0 : session.inboundMessage) === null || _d === void 0 ? void 0 : _d.hasReturnRouting()) {
            try {
                await session.send(agentContext, encryptedMessage);
                return;
            }
            catch (error) {
                errors.push(error);
                this.logger.debug(`Sending packed message via session failed with error: ${error.message}.`, error);
            }
        }
        // Retrieve DIDComm services
        const { services, queueService } = await this.retrieveServicesByConnection(agentContext, connection, options === null || options === void 0 ? void 0 : options.transportPriority);
        if (this.outboundTransports.length === 0 && !queueService) {
            throw new error_1.AriesFrameworkError('Agent has no outbound transport!');
        }
        try {
            // Loop trough all available services and try to send the message
            for (var _e = true, services_1 = __asyncValues(services), services_1_1; services_1_1 = await services_1.next(), _a = services_1_1.done, !_a;) {
                _c = services_1_1.value;
                _e = false;
                try {
                    const service = _c;
                    this.logger.debug(`Sending outbound message to service:`, { service });
                    try {
                        const protocolScheme = (0, uri_1.getProtocolScheme)(service.serviceEndpoint);
                        for (const transport of this.outboundTransports) {
                            if (transport.supportedSchemes.includes(protocolScheme)) {
                                await transport.sendMessage({
                                    payload: encryptedMessage,
                                    endpoint: service.serviceEndpoint,
                                    connectionId: connection.id,
                                });
                                break;
                            }
                        }
                        return;
                    }
                    catch (error) {
                        this.logger.debug(`Sending outbound message to service with id ${service.id} failed with the following error:`, {
                            message: error.message,
                            error: error,
                        });
                    }
                }
                finally {
                    _e = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_e && !_a && (_b = services_1.return)) await _b.call(services_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // We didn't succeed to send the message over open session, or directly to serviceEndpoint
        // If the other party shared a queue service endpoint in their did doc we queue the message
        if (queueService) {
            this.logger.debug(`Queue packed message for connection ${connection.id} (${connection.theirLabel})`);
            await this.messageRepository.add(connection.id, encryptedMessage);
            return;
        }
        // Message is undeliverable
        this.logger.error(`Message is undeliverable to connection ${connection.id} (${connection.theirLabel})`, {
            message: encryptedMessage,
            errors,
            connection,
        });
        throw new error_1.AriesFrameworkError(`Message is undeliverable to connection ${connection.id} (${connection.theirLabel})`);
    }
    async sendMessage(outboundMessageContext, options) {
        var _a, e_2, _b, _c;
        var _d;
        const { agentContext, connection, outOfBand, message } = outboundMessageContext;
        const errors = [];
        if (!connection) {
            this.logger.error('Outbound message has no associated connection');
            this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.Undeliverable);
            throw new error_1.MessageSendingError('Outbound message has no associated connection', {
                outboundMessageContext,
            });
        }
        this.logger.debug('Send outbound message', {
            message,
            connectionId: connection.id,
        });
        const session = this.findSessionForOutboundContext(outboundMessageContext);
        if (session) {
            this.logger.debug(`Found session with return routing for message '${message.id}' (connection '${connection.id}'`);
            try {
                await this.sendMessageToSession(agentContext, session, message);
                this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.SentToSession);
                return;
            }
            catch (error) {
                errors.push(error);
                this.logger.debug(`Sending an outbound message via session failed with error: ${error.message}.`, error);
            }
        }
        // Retrieve DIDComm services
        let services = [];
        let queueService;
        try {
            ;
            ({ services, queueService } = await this.retrieveServicesByConnection(agentContext, connection, options === null || options === void 0 ? void 0 : options.transportPriority, outOfBand));
        }
        catch (error) {
            this.logger.error(`Unable to retrieve services for connection '${connection.id}. ${error.message}`);
            this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.Undeliverable);
            throw new error_1.MessageSendingError(`Unable to retrieve services for connection '${connection.id}`, {
                outboundMessageContext,
                cause: error,
            });
        }
        if (!connection.did) {
            this.logger.error(`Unable to send message using connection '${connection.id}' that doesn't have a did`);
            this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.Undeliverable);
            throw new error_1.MessageSendingError(`Unable to send message using connection '${connection.id}' that doesn't have a did`, { outboundMessageContext });
        }
        let ourDidDocument;
        try {
            ourDidDocument = await this.didResolverService.resolveDidDocument(agentContext, connection.did);
        }
        catch (error) {
            this.logger.error(`Unable to resolve DID Document for '${connection.did}`);
            this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.Undeliverable);
            throw new error_1.MessageSendingError(`Unable to resolve DID Document for '${connection.did}`, {
                outboundMessageContext,
                cause: error,
            });
        }
        const ourAuthenticationKeys = getAuthenticationKeys(ourDidDocument);
        // TODO We're selecting just the first authentication key. Is it ok?
        // We can probably learn something from the didcomm-rust implementation, which looks at crypto compatibility to make sure the
        // other party can decrypt the message. https://github.com/sicpa-dlab/didcomm-rust/blob/9a24b3b60f07a11822666dda46e5616a138af056/src/message/pack_encrypted/mod.rs#L33-L44
        // This will become more relevant when we support different encrypt envelopes. One thing to take into account though is that currently we only store the recipientKeys
        // as defined in the didcomm services, while it could be for example that the first authentication key is not defined in the recipientKeys, in which case we wouldn't
        // even be interoperable between two AFJ agents. So we should either pick the first key that is defined in the recipientKeys, or we should make sure to store all
        // keys defined in the did document as tags so we can retrieve it, even if it's not defined in the recipientKeys. This, again, will become simpler once we use didcomm v2
        // as the `from` field in a received message will identity the did used so we don't have to store all keys in tags to be able to find the connections associated with
        // an incoming message.
        const [firstOurAuthenticationKey] = ourAuthenticationKeys;
        // If the returnRoute is already set we won't override it. This allows to set the returnRoute manually if this is desired.
        const shouldAddReturnRoute = ((_d = message.transport) === null || _d === void 0 ? void 0 : _d.returnRoute) === undefined && !this.transportService.hasInboundEndpoint(ourDidDocument);
        try {
            // Loop trough all available services and try to send the message
            for (var _e = true, services_2 = __asyncValues(services), services_2_1; services_2_1 = await services_2.next(), _a = services_2_1.done, !_a;) {
                _c = services_2_1.value;
                _e = false;
                try {
                    const service = _c;
                    try {
                        // Enable return routing if the our did document does not have any inbound endpoint for given sender key
                        await this.sendToService(new models_1.OutboundMessageContext(message, {
                            agentContext,
                            serviceParams: {
                                service,
                                senderKey: firstOurAuthenticationKey,
                                returnRoute: shouldAddReturnRoute,
                            },
                            connection,
                        }));
                        this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.SentToTransport);
                        return;
                    }
                    catch (error) {
                        errors.push(error);
                        this.logger.debug(`Sending outbound message to service with id ${service.id} failed with the following error:`, {
                            message: error.message,
                            error: error,
                        });
                    }
                }
                finally {
                    _e = true;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_e && !_a && (_b = services_2.return)) await _b.call(services_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // We didn't succeed to send the message over open session, or directly to serviceEndpoint
        // If the other party shared a queue service endpoint in their did doc we queue the message
        if (queueService) {
            this.logger.debug(`Queue message for connection ${connection.id} (${connection.theirLabel})`);
            const keys = {
                recipientKeys: queueService.recipientKeys,
                routingKeys: queueService.routingKeys,
                senderKey: firstOurAuthenticationKey,
            };
            const encryptedMessage = await this.envelopeService.packMessage(agentContext, message, keys);
            await this.messageRepository.add(connection.id, encryptedMessage);
            this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.QueuedForPickup);
            return;
        }
        // Message is undeliverable
        this.logger.error(`Message is undeliverable to connection ${connection.id} (${connection.theirLabel})`, {
            message,
            errors,
            connection,
        });
        this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.Undeliverable);
        throw new error_1.MessageSendingError(`Message is undeliverable to connection ${connection.id} (${connection.theirLabel})`, { outboundMessageContext });
    }
    async sendMessageToService(outboundMessageContext) {
        var _a, _b;
        const session = this.findSessionForOutboundContext(outboundMessageContext);
        if (session) {
            this.logger.debug(`Found session with return routing for message '${outboundMessageContext.message.id}'`);
            try {
                await this.sendMessageToSession(outboundMessageContext.agentContext, session, outboundMessageContext.message);
                this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.SentToSession);
                return;
            }
            catch (error) {
                this.logger.debug(`Sending an outbound message via session failed with error: ${error.message}.`, error);
            }
        }
        // If there is no session try sending to service instead
        try {
            await this.sendToService(outboundMessageContext);
            this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.SentToTransport);
        }
        catch (error) {
            this.logger.error(`Message is undeliverable to service with id ${(_a = outboundMessageContext.serviceParams) === null || _a === void 0 ? void 0 : _a.service.id}: ${error.message}`, {
                message: outboundMessageContext.message,
                error,
            });
            this.emitMessageSentEvent(outboundMessageContext, models_1.OutboundMessageSendStatus.Undeliverable);
            throw new error_1.MessageSendingError(`Message is undeliverable to service with id ${(_b = outboundMessageContext.serviceParams) === null || _b === void 0 ? void 0 : _b.service.id}: ${error.message}`, { outboundMessageContext });
        }
    }
    async sendToService(outboundMessageContext) {
        const { agentContext, message, serviceParams, connection } = outboundMessageContext;
        if (!serviceParams) {
            throw new error_1.AriesFrameworkError('No service parameters found in outbound message context');
        }
        const { service, senderKey, returnRoute } = serviceParams;
        if (this.outboundTransports.length === 0) {
            throw new error_1.AriesFrameworkError('Agent has no outbound transport!');
        }
        this.logger.debug(`Sending outbound message to service:`, {
            messageId: message.id,
            service: Object.assign(Object.assign({}, service), { recipientKeys: 'omitted...', routingKeys: 'omitted...' }),
        });
        const keys = {
            recipientKeys: service.recipientKeys,
            routingKeys: service.routingKeys,
            senderKey,
        };
        // Set return routing for message if requested
        if (returnRoute) {
            message.setReturnRouting(TransportDecorator_1.ReturnRouteTypes.all);
        }
        try {
            MessageValidator_1.MessageValidator.validateSync(message);
        }
        catch (error) {
            this.logger.error(`Aborting sending outbound message ${message.type} to ${service.serviceEndpoint}. Message validation failed`, {
                errors: error,
                message: message.toJSON(),
            });
            throw error;
        }
        const outboundPackage = await this.packMessage(agentContext, { message, keys, endpoint: service.serviceEndpoint });
        outboundPackage.endpoint = service.serviceEndpoint;
        outboundPackage.connectionId = connection === null || connection === void 0 ? void 0 : connection.id;
        for (const transport of this.outboundTransports) {
            const protocolScheme = (0, uri_1.getProtocolScheme)(service.serviceEndpoint);
            if (!protocolScheme) {
                this.logger.warn('Service does not have a protocol scheme.');
            }
            else if (transport.supportedSchemes.includes(protocolScheme)) {
                await transport.sendMessage(outboundPackage);
                return;
            }
        }
        throw new error_1.MessageSendingError(`Unable to send message to service: ${service.serviceEndpoint}`, {
            outboundMessageContext,
        });
    }
    findSessionForOutboundContext(outboundContext) {
        var _a, _b, _c, _d;
        let session = undefined;
        // Use session id from outbound context if present, or use the session from the inbound message context
        const sessionId = (_a = outboundContext.sessionId) !== null && _a !== void 0 ? _a : (_b = outboundContext.inboundMessageContext) === null || _b === void 0 ? void 0 : _b.sessionId;
        // Try to find session by id
        if (sessionId) {
            session = this.transportService.findSessionById(sessionId);
        }
        // Try to find session by connection id
        if (!session && ((_c = outboundContext.connection) === null || _c === void 0 ? void 0 : _c.id)) {
            session = this.transportService.findSessionByConnectionId(outboundContext.connection.id);
        }
        return session && ((_d = session.inboundMessage) === null || _d === void 0 ? void 0 : _d.hasAnyReturnRoute()) ? session : null;
    }
    async retrieveServicesByConnection(agentContext, connection, transportPriority, outOfBand) {
        var _a;
        this.logger.debug(`Retrieving services for connection '${connection.id}' (${connection.theirLabel})`, {
            transportPriority,
            connection,
        });
        let didCommServices = [];
        if (connection.theirDid) {
            this.logger.debug(`Resolving services for connection theirDid ${connection.theirDid}.`);
            didCommServices = await this.didCommDocumentService.resolveServicesFromDid(agentContext, connection.theirDid);
        }
        else if (outOfBand) {
            this.logger.debug(`Resolving services from out-of-band record ${outOfBand.id}.`);
            if (connection.isRequester) {
                for (const service of outOfBand.outOfBandInvitation.getServices()) {
                    // Resolve dids to DIDDocs to retrieve services
                    if (typeof service === 'string') {
                        this.logger.debug(`Resolving services for did ${service}.`);
                        didCommServices.push(...(await this.didCommDocumentService.resolveServicesFromDid(agentContext, service)));
                    }
                    else {
                        // Out of band inline service contains keys encoded as did:key references
                        didCommServices.push({
                            id: service.id,
                            recipientKeys: service.recipientKeys.map(helpers_1.didKeyToInstanceOfKey),
                            routingKeys: ((_a = service.routingKeys) === null || _a === void 0 ? void 0 : _a.map(helpers_1.didKeyToInstanceOfKey)) || [],
                            serviceEndpoint: service.serviceEndpoint,
                        });
                    }
                }
            }
        }
        // Separate queue service out
        let services = didCommServices.filter((s) => !isDidCommTransportQueue(s.serviceEndpoint));
        const queueService = didCommServices.find((s) => isDidCommTransportQueue(s.serviceEndpoint));
        // If restrictive will remove services not listed in schemes list
        if (transportPriority === null || transportPriority === void 0 ? void 0 : transportPriority.restrictive) {
            services = services.filter((service) => {
                const serviceSchema = (0, uri_1.getProtocolScheme)(service.serviceEndpoint);
                return transportPriority.schemes.includes(serviceSchema);
            });
        }
        // If transport priority is set we will sort services by our priority
        if (transportPriority === null || transportPriority === void 0 ? void 0 : transportPriority.schemes) {
            services = services.sort(function (a, b) {
                const aScheme = (0, uri_1.getProtocolScheme)(a.serviceEndpoint);
                const bScheme = (0, uri_1.getProtocolScheme)(b.serviceEndpoint);
                return (transportPriority === null || transportPriority === void 0 ? void 0 : transportPriority.schemes.indexOf(aScheme)) - (transportPriority === null || transportPriority === void 0 ? void 0 : transportPriority.schemes.indexOf(bScheme));
            });
        }
        this.logger.debug(`Retrieved ${services.length} services for message to connection '${connection.id}'(${connection.theirLabel})'`, { hasQueueService: queueService !== undefined });
        return { services, queueService };
    }
    emitMessageSentEvent(outboundMessageContext, status) {
        const { agentContext } = outboundMessageContext;
        this.eventEmitter.emit(agentContext, {
            type: Events_1.AgentEventTypes.AgentMessageSent,
            payload: {
                message: outboundMessageContext,
                status,
            },
        });
    }
};
MessageSender = __decorate([
    (0, plugins_1.injectable)(),
    __param(2, (0, plugins_1.inject)(constants_1.InjectionSymbols.MessageRepository)),
    __param(3, (0, plugins_1.inject)(constants_1.InjectionSymbols.Logger)),
    __metadata("design:paramtypes", [EnvelopeService_1.EnvelopeService,
        TransportService_1.TransportService, Object, Object, DidResolverService_1.DidResolverService,
        didcomm_1.DidCommDocumentService,
        EventEmitter_1.EventEmitter])
], MessageSender);
exports.MessageSender = MessageSender;
function isDidCommTransportQueue(serviceEndpoint) {
    return serviceEndpoint === constants_1.DID_COMM_TRANSPORT_QUEUE;
}
exports.isDidCommTransportQueue = isDidCommTransportQueue;
function getAuthenticationKeys(didDocument) {
    var _a, _b;
    return ((_b = (_a = didDocument.authentication) === null || _a === void 0 ? void 0 : _a.map((authentication) => {
        const verificationMethod = typeof authentication === 'string' ? didDocument.dereferenceVerificationMethod(authentication) : authentication;
        const key = (0, key_type_1.getKeyFromVerificationMethod)(verificationMethod);
        return key;
    })) !== null && _b !== void 0 ? _b : []);
}
//# sourceMappingURL=MessageSender.js.map