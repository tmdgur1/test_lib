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
exports.MediationRecipientApi = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const agent_1 = require("../../agent");
const EventEmitter_1 = require("../../agent/EventEmitter");
const Events_1 = require("../../agent/Events");
const MessageHandlerRegistry_1 = require("../../agent/MessageHandlerRegistry");
const MessageSender_1 = require("../../agent/MessageSender");
const models_1 = require("../../agent/models");
const constants_1 = require("../../constants");
const error_1 = require("../../error");
const plugins_1 = require("../../plugins");
const transport_1 = require("../../transport");
const ConnectionMetadataTypes_1 = require("../connections/repository/ConnectionMetadataTypes");
const services_1 = require("../connections/services");
const dids_1 = require("../dids");
const helpers_1 = require("../dids/helpers");
const discover_features_1 = require("../discover-features");
const MessagePickupApi_1 = require("../message-p\u00ECckup/MessagePickupApi");
const v1_1 = require("../message-p\u00ECckup/protocol/v1");
const v2_1 = require("../message-p\u00ECckup/protocol/v2");
const MediationRecipientModuleConfig_1 = require("./MediationRecipientModuleConfig");
const MediatorPickupStrategy_1 = require("./MediatorPickupStrategy");
const RoutingEvents_1 = require("./RoutingEvents");
const KeylistUpdateResponseHandler_1 = require("./handlers/KeylistUpdateResponseHandler");
const MediationDenyHandler_1 = require("./handlers/MediationDenyHandler");
const MediationGrantHandler_1 = require("./handlers/MediationGrantHandler");
const messages_1 = require("./messages");
const MediationState_1 = require("./models/MediationState");
const repository_1 = require("./repository");
const MediationRecipientService_1 = require("./services/MediationRecipientService");
const RoutingService_1 = require("./services/RoutingService");
let MediationRecipientApi = class MediationRecipientApi {
    constructor(messageHandlerRegistry, mediationRecipientService, connectionService, dids, messageSender, eventEmitter, discoverFeaturesApi, messagePickupApi, mediationRepository, routingService, logger, agentContext, stop$, mediationRecipientModuleConfig) {
        // stopMessagePickup$ is used for stop message pickup signal
        this.stopMessagePickup$ = new rxjs_1.Subject();
        this.connectionService = connectionService;
        this.dids = dids;
        this.mediationRecipientService = mediationRecipientService;
        this.messageSender = messageSender;
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.discoverFeaturesApi = discoverFeaturesApi;
        this.messagePickupApi = messagePickupApi;
        this.mediationRepository = mediationRepository;
        this.routingService = routingService;
        this.agentContext = agentContext;
        this.stop$ = stop$;
        this.config = mediationRecipientModuleConfig;
        this.registerMessageHandlers(messageHandlerRegistry);
    }
    async initialize() {
        // Poll for messages from mediator
        const defaultMediator = await this.findDefaultMediator();
        if (defaultMediator) {
            this.initiateMessagePickup(defaultMediator).catch((error) => {
                this.logger.warn(`Error initiating message pickup with mediator ${defaultMediator.id}`, { error });
            });
        }
    }
    async sendMessage(outboundMessageContext, pickupStrategy) {
        const mediatorPickupStrategy = pickupStrategy !== null && pickupStrategy !== void 0 ? pickupStrategy : this.config.mediatorPickupStrategy;
        const transportPriority = mediatorPickupStrategy === MediatorPickupStrategy_1.MediatorPickupStrategy.Implicit
            ? { schemes: ['wss', 'ws'], restrictive: true }
            : undefined;
        await this.messageSender.sendMessage(outboundMessageContext, {
            transportPriority,
            // TODO: add keepAlive: true to enforce through the public api
            // we need to keep the socket alive. It already works this way, but would
            // be good to make more explicit from the public facing API.
            // This would also make it easier to change the internal API later on.
            // keepAlive: true,
        });
    }
    async openMediationWebSocket(mediator) {
        const connection = await this.connectionService.getById(this.agentContext, mediator.connectionId);
        const { message, connectionRecord } = await this.connectionService.createTrustPing(this.agentContext, connection, {
            responseRequested: false,
        });
        const websocketSchemes = ['ws', 'wss'];
        const didDocument = connectionRecord.theirDid && (await this.dids.resolveDidDocument(connectionRecord.theirDid));
        const services = didDocument && (didDocument === null || didDocument === void 0 ? void 0 : didDocument.didCommServices);
        const hasWebSocketTransport = services && services.some((s) => websocketSchemes.includes(s.protocolScheme));
        if (!hasWebSocketTransport) {
            throw new error_1.AriesFrameworkError('Cannot open websocket to connection without websocket service endpoint');
        }
        await this.messageSender.sendMessage(new models_1.OutboundMessageContext(message, { agentContext: this.agentContext, connection: connectionRecord }), {
            transportPriority: {
                schemes: websocketSchemes,
                restrictive: true,
                // TODO: add keepAlive: true to enforce through the public api
                // we need to keep the socket alive. It already works this way, but would
                // be good to make more explicit from the public facing API.
                // This would also make it easier to change the internal API later on.
                // keepAlive: true,
            },
        });
    }
    async openWebSocketAndPickUp(mediator, pickupStrategy) {
        const { baseMediatorReconnectionIntervalMs, maximumMediatorReconnectionIntervalMs } = this.config;
        let interval = baseMediatorReconnectionIntervalMs;
        const stopConditions$ = (0, rxjs_1.merge)(this.stop$, this.stopMessagePickup$).pipe();
        // Reset back off interval when the websocket is successfully opened again
        this.eventEmitter
            .observable(transport_1.TransportEventTypes.OutboundWebSocketOpenedEvent)
            .pipe(
        // Stop when the agent shuts down or stop message pickup signal is received
        (0, operators_1.takeUntil)(stopConditions$), (0, operators_1.filter)((e) => e.payload.connectionId === mediator.connectionId))
            .subscribe(() => {
            interval = baseMediatorReconnectionIntervalMs;
        });
        // FIXME: this won't work for tenant agents created by the tenants module as the agent context session
        // could be closed. I'm not sure we want to support this as you probably don't want different tenants opening
        // various websocket connections to mediators. However we should look at throwing an error or making sure
        // it is not possible to use the mediation module with tenant agents.
        // Listens to Outbound websocket closed events and will reopen the websocket connection
        // in a recursive back off strategy if it matches the following criteria:
        // - Agent is not shutdown
        // - Socket was for current mediator connection id
        this.eventEmitter
            .observable(transport_1.TransportEventTypes.OutboundWebSocketClosedEvent)
            .pipe(
        // Stop when the agent shuts down or stop message pickup signal is received
        (0, operators_1.takeUntil)(stopConditions$), (0, operators_1.filter)((e) => e.payload.connectionId === mediator.connectionId), 
        // Make sure we're not reconnecting multiple times
        (0, operators_1.throttleTime)(interval), 
        // Wait for interval time before reconnecting
        (0, operators_1.delayWhen)(() => (0, rxjs_1.timer)(interval)), 
        // Increase the interval (recursive back-off)
        (0, operators_1.tap)(() => {
            interval = Math.min(interval * 2, maximumMediatorReconnectionIntervalMs);
        }))
            .subscribe({
            next: async () => {
                this.logger.debug(`Websocket connection to mediator with connectionId '${mediator.connectionId}' is closed, attempting to reconnect...`);
                try {
                    if (pickupStrategy === MediatorPickupStrategy_1.MediatorPickupStrategy.PickUpV2) {
                        // Start Pickup v2 protocol to receive messages received while websocket offline
                        await this.messagePickupApi.pickupMessages({
                            connectionId: mediator.connectionId,
                            batchSize: this.config.maximumMessagePickup,
                            protocolVersion: 'v2',
                        });
                    }
                    else {
                        await this.openMediationWebSocket(mediator);
                    }
                }
                catch (error) {
                    this.logger.warn('Unable to re-open websocket connection to mediator', { error });
                }
            },
            complete: () => this.logger.info(`Stopping pickup of messages from mediator '${mediator.id}'`),
        });
        try {
            if (pickupStrategy === MediatorPickupStrategy_1.MediatorPickupStrategy.Implicit) {
                await this.openMediationWebSocket(mediator);
            }
        }
        catch (error) {
            this.logger.warn('Unable to open websocket connection to mediator', { error });
        }
    }
    /**
     * Start a Message Pickup flow with a registered Mediator.
     *
     * @param mediator optional {MediationRecord} corresponding to the mediator to pick messages from. It will use
     * default mediator otherwise
     * @param pickupStrategy optional {MediatorPickupStrategy} to use in the loop. It will use Agent's default
     * strategy or attempt to find it by Discover Features otherwise
     * @returns
     */
    async initiateMessagePickup(mediator, pickupStrategy) {
        const { mediatorPollingInterval } = this.config;
        const mediatorRecord = mediator !== null && mediator !== void 0 ? mediator : (await this.findDefaultMediator());
        if (!mediatorRecord) {
            throw new error_1.AriesFrameworkError('There is no mediator to pickup messages from');
        }
        const mediatorPickupStrategy = pickupStrategy !== null && pickupStrategy !== void 0 ? pickupStrategy : (await this.getPickupStrategyForMediator(mediatorRecord));
        const mediatorConnection = await this.connectionService.getById(this.agentContext, mediatorRecord.connectionId);
        switch (mediatorPickupStrategy) {
            case MediatorPickupStrategy_1.MediatorPickupStrategy.PickUpV2:
                this.logger.info(`Starting pickup of messages from mediator '${mediatorRecord.id}'`);
                await this.openWebSocketAndPickUp(mediatorRecord, mediatorPickupStrategy);
                await this.messagePickupApi.pickupMessages({
                    connectionId: mediatorConnection.id,
                    batchSize: this.config.maximumMessagePickup,
                    protocolVersion: 'v2',
                });
                break;
            case MediatorPickupStrategy_1.MediatorPickupStrategy.PickUpV1: {
                const stopConditions$ = (0, rxjs_1.merge)(this.stop$, this.stopMessagePickup$).pipe();
                // Explicit means polling every X seconds with batch message
                this.logger.info(`Starting explicit (batch) pickup of messages from mediator '${mediatorRecord.id}'`);
                const subscription = (0, rxjs_1.interval)(mediatorPollingInterval)
                    .pipe((0, operators_1.takeUntil)(stopConditions$))
                    .subscribe({
                    next: async () => {
                        await this.messagePickupApi.pickupMessages({
                            connectionId: mediatorConnection.id,
                            batchSize: this.config.maximumMessagePickup,
                            protocolVersion: 'v1',
                        });
                    },
                    complete: () => this.logger.info(`Stopping pickup of messages from mediator '${mediatorRecord.id}'`),
                });
                return subscription;
            }
            case MediatorPickupStrategy_1.MediatorPickupStrategy.Implicit:
                // Implicit means sending ping once and keeping connection open. This requires a long-lived transport
                // such as WebSockets to work
                this.logger.info(`Starting implicit pickup of messages from mediator '${mediatorRecord.id}'`);
                await this.openWebSocketAndPickUp(mediatorRecord, mediatorPickupStrategy);
                break;
            default:
                this.logger.info(`Skipping pickup of messages from mediator '${mediatorRecord.id}' due to pickup strategy none`);
        }
    }
    /**
     * Terminate all ongoing Message Pickup loops
     */
    async stopMessagePickup() {
        this.stopMessagePickup$.next(true);
    }
    async getPickupStrategyForMediator(mediator) {
        var _a, _b, _c;
        let mediatorPickupStrategy = (_a = mediator.pickupStrategy) !== null && _a !== void 0 ? _a : this.config.mediatorPickupStrategy;
        // If mediator pickup strategy is not configured we try to query if batch pickup
        // is supported through the discover features protocol
        if (!mediatorPickupStrategy) {
            const discloseForPickupV2 = await this.discoverFeaturesApi.queryFeatures({
                connectionId: mediator.connectionId,
                protocolVersion: 'v1',
                queries: [{ featureType: 'protocol', match: v2_1.V2StatusMessage.type.protocolUri }],
                awaitDisclosures: true,
            });
            if ((_b = discloseForPickupV2.features) === null || _b === void 0 ? void 0 : _b.find((item) => item.id === v2_1.V2StatusMessage.type.protocolUri)) {
                mediatorPickupStrategy = MediatorPickupStrategy_1.MediatorPickupStrategy.PickUpV2;
            }
            else {
                const discloseForPickupV1 = await this.discoverFeaturesApi.queryFeatures({
                    connectionId: mediator.connectionId,
                    protocolVersion: 'v1',
                    queries: [{ featureType: 'protocol', match: v1_1.V1BatchPickupMessage.type.protocolUri }],
                    awaitDisclosures: true,
                });
                // Use explicit pickup strategy
                mediatorPickupStrategy = ((_c = discloseForPickupV1.features) === null || _c === void 0 ? void 0 : _c.find((item) => item.id === v1_1.V1BatchPickupMessage.type.protocolUri))
                    ? MediatorPickupStrategy_1.MediatorPickupStrategy.PickUpV1
                    : MediatorPickupStrategy_1.MediatorPickupStrategy.Implicit;
            }
            // Store the result so it can be reused next time
            mediator.pickupStrategy = mediatorPickupStrategy;
            await this.mediationRepository.update(this.agentContext, mediator);
        }
        return mediatorPickupStrategy;
    }
    async discoverMediation() {
        return this.mediationRecipientService.discoverMediation(this.agentContext);
    }
    /**
     * @deprecated Use `MessagePickupApi.pickupMessages` instead.
     * */
    async pickupMessages(mediatorConnection, pickupStrategy) {
        mediatorConnection.assertReady();
        const messagePickupApi = this.agentContext.dependencyManager.resolve(MessagePickupApi_1.MessagePickupApi);
        await messagePickupApi.pickupMessages({
            connectionId: mediatorConnection.id,
            protocolVersion: pickupStrategy === MediatorPickupStrategy_1.MediatorPickupStrategy.PickUpV2 ? 'v2' : 'v1',
        });
    }
    async setDefaultMediator(mediatorRecord) {
        return this.mediationRecipientService.setDefaultMediator(this.agentContext, mediatorRecord);
    }
    async requestMediation(connection) {
        const { mediationRecord, message } = await this.mediationRecipientService.createRequest(this.agentContext, connection);
        const outboundMessage = new models_1.OutboundMessageContext(message, {
            agentContext: this.agentContext,
            connection: connection,
        });
        await this.sendMessage(outboundMessage);
        return mediationRecord;
    }
    async notifyKeylistUpdate(connection, verkey, action) {
        var _a;
        // Use our useDidKey configuration unless we know the key formatting other party is using
        let useDidKey = this.agentContext.config.useDidKeyInProtocols;
        const useDidKeysConnectionMetadata = connection.metadata.get(ConnectionMetadataTypes_1.ConnectionMetadataKeys.UseDidKeysForProtocol);
        if (useDidKeysConnectionMetadata) {
            useDidKey = (_a = useDidKeysConnectionMetadata[messages_1.KeylistUpdateMessage.type.protocolUri]) !== null && _a !== void 0 ? _a : useDidKey;
        }
        const message = this.mediationRecipientService.createKeylistUpdateMessage([
            new messages_1.KeylistUpdate({
                action: action !== null && action !== void 0 ? action : messages_1.KeylistUpdateAction.add,
                recipientKey: useDidKey ? (0, helpers_1.verkeyToDidKey)(verkey) : verkey,
            }),
        ]);
        const outboundMessageContext = new models_1.OutboundMessageContext(message, {
            agentContext: this.agentContext,
            connection,
        });
        await this.sendMessage(outboundMessageContext);
    }
    async findByConnectionId(connectionId) {
        return await this.mediationRecipientService.findByConnectionId(this.agentContext, connectionId);
    }
    async getMediators() {
        return await this.mediationRecipientService.getMediators(this.agentContext);
    }
    async findDefaultMediator() {
        return this.mediationRecipientService.findDefaultMediator(this.agentContext);
    }
    async findDefaultMediatorConnection() {
        const mediatorRecord = await this.findDefaultMediator();
        if (mediatorRecord) {
            return this.connectionService.getById(this.agentContext, mediatorRecord.connectionId);
        }
        return null;
    }
    async requestAndAwaitGrant(connection, timeoutMs = 10000) {
        const { mediationRecord, message } = await this.mediationRecipientService.createRequest(this.agentContext, connection);
        // Create observable for event
        const observable = this.eventEmitter.observable(RoutingEvents_1.RoutingEventTypes.MediationStateChanged);
        const subject = new rxjs_1.ReplaySubject(1);
        // Apply required filters to observable stream subscribe to replay subject
        observable
            .pipe((0, Events_1.filterContextCorrelationId)(this.agentContext.contextCorrelationId), 
        // Only take event for current mediation record
        (0, operators_1.filter)((event) => event.payload.mediationRecord.id === mediationRecord.id), 
        // Only take event for previous state requested, current state granted
        (0, operators_1.filter)((event) => event.payload.previousState === MediationState_1.MediationState.Requested), (0, operators_1.filter)((event) => event.payload.mediationRecord.state === MediationState_1.MediationState.Granted), 
        // Only wait for first event that matches the criteria
        (0, operators_1.first)(), 
        // Do not wait for longer than specified timeout
        (0, operators_1.timeout)(timeoutMs))
            .subscribe(subject);
        // Send mediation request message
        const outboundMessageContext = new models_1.OutboundMessageContext(message, {
            agentContext: this.agentContext,
            connection: connection,
            associatedRecord: mediationRecord,
        });
        await this.sendMessage(outboundMessageContext);
        const event = await (0, rxjs_1.firstValueFrom)(subject);
        return event.payload.mediationRecord;
    }
    /**
     * Requests mediation for a given connection and sets that as default mediator.
     *
     * @param connection connection record which will be used for mediation
     * @returns mediation record
     */
    async provision(connection) {
        this.logger.debug('Connection completed, requesting mediation');
        let mediation = await this.findByConnectionId(connection.id);
        if (!mediation) {
            this.logger.info(`Requesting mediation for connection ${connection.id}`);
            mediation = await this.requestAndAwaitGrant(connection, 60000); // TODO: put timeout as a config parameter
            this.logger.debug('Mediation granted, setting as default mediator');
            await this.setDefaultMediator(mediation);
            this.logger.debug('Default mediator set');
        }
        else {
            this.logger.debug(`Mediator invitation has already been ${mediation.isReady ? 'granted' : 'requested'}`);
        }
        return mediation;
    }
    async getRouting(options) {
        return this.routingService.getRouting(this.agentContext, options);
    }
    // Register handlers for the several messages for the mediator.
    registerMessageHandlers(messageHandlerRegistry) {
        messageHandlerRegistry.registerMessageHandler(new KeylistUpdateResponseHandler_1.KeylistUpdateResponseHandler(this.mediationRecipientService));
        messageHandlerRegistry.registerMessageHandler(new MediationGrantHandler_1.MediationGrantHandler(this.mediationRecipientService));
        messageHandlerRegistry.registerMessageHandler(new MediationDenyHandler_1.MediationDenyHandler(this.mediationRecipientService));
        //messageHandlerRegistry.registerMessageHandler(new KeylistListHandler(this.mediationRecipientService)) // TODO: write this
    }
};
MediationRecipientApi = __decorate([
    (0, plugins_1.injectable)(),
    __param(10, (0, plugins_1.inject)(constants_1.InjectionSymbols.Logger)),
    __param(12, (0, plugins_1.inject)(constants_1.InjectionSymbols.Stop$)),
    __metadata("design:paramtypes", [MessageHandlerRegistry_1.MessageHandlerRegistry,
        MediationRecipientService_1.MediationRecipientService,
        services_1.ConnectionService,
        dids_1.DidsApi,
        MessageSender_1.MessageSender,
        EventEmitter_1.EventEmitter,
        discover_features_1.DiscoverFeaturesApi,
        MessagePickupApi_1.MessagePickupApi,
        repository_1.MediationRepository,
        RoutingService_1.RoutingService, Object, agent_1.AgentContext,
        rxjs_1.Subject,
        MediationRecipientModuleConfig_1.MediationRecipientModuleConfig])
], MediationRecipientApi);
exports.MediationRecipientApi = MediationRecipientApi;
//# sourceMappingURL=MediationRecipientApi.js.map