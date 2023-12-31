"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const constants_1 = require("../constants");
const crypto_1 = require("../crypto");
const JwsService_1 = require("../crypto/JwsService");
const error_1 = require("../error");
const plugins_1 = require("../plugins");
const storage_1 = require("../storage");
const InMemoryMessageRepository_1 = require("../storage/InMemoryMessageRepository");
const AgentConfig_1 = require("./AgentConfig");
const AgentModules_1 = require("./AgentModules");
const BaseAgent_1 = require("./BaseAgent");
const Dispatcher_1 = require("./Dispatcher");
const EnvelopeService_1 = require("./EnvelopeService");
const EventEmitter_1 = require("./EventEmitter");
const Events_1 = require("./Events");
const FeatureRegistry_1 = require("./FeatureRegistry");
const MessageHandlerRegistry_1 = require("./MessageHandlerRegistry");
const MessageReceiver_1 = require("./MessageReceiver");
const MessageSender_1 = require("./MessageSender");
const TransportService_1 = require("./TransportService");
const context_1 = require("./context");
// Any makes sure you can use Agent as a type without always needing to specify the exact generics for the agent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class Agent extends BaseAgent_1.BaseAgent {
    constructor(options, dependencyManager = new plugins_1.DependencyManager()) {
        console.log('[Agent constructor]', 1);
        const agentConfig = new AgentConfig_1.AgentConfig(options.config, options.dependencies);
        console.log('[Agent constructor]', 2);
        const modulesWithDefaultModules = (0, AgentModules_1.extendModulesWithDefaultModules)(options.modules);
        // Register internal dependencies
        console.log('[Agent constructor]', 3);
        dependencyManager.registerSingleton(MessageHandlerRegistry_1.MessageHandlerRegistry);
        console.log('[Agent constructor]', 4);
        dependencyManager.registerSingleton(EventEmitter_1.EventEmitter);
        console.log('[Agent constructor]', 5);
        dependencyManager.registerSingleton(MessageSender_1.MessageSender);
        console.log('[Agent constructor]', 6);
        dependencyManager.registerSingleton(MessageReceiver_1.MessageReceiver);
        console.log('[Agent constructor]', 7);
        dependencyManager.registerSingleton(TransportService_1.TransportService);
        console.log('[Agent constructor]', 8);
        dependencyManager.registerSingleton(Dispatcher_1.Dispatcher);
        console.log('[Agent constructor]', 9);
        dependencyManager.registerSingleton(EnvelopeService_1.EnvelopeService);
        console.log('[Agent constructor]', 10);
        dependencyManager.registerSingleton(FeatureRegistry_1.FeatureRegistry);
        console.log('[Agent constructor]', 11);
        dependencyManager.registerSingleton(JwsService_1.JwsService);
        console.log('[Agent constructor]', 12);
        dependencyManager.registerSingleton(storage_1.DidCommMessageRepository);
        console.log('[Agent constructor]', 13);
        dependencyManager.registerSingleton(storage_1.StorageVersionRepository);
        console.log('[Agent constructor]', 14);
        dependencyManager.registerSingleton(storage_1.StorageUpdateService);
        // This is a really ugly hack to make tsyringe work without any SigningProviders registered
        // It is currently impossible to use @injectAll if there are no instances registered for the
        // token. We register a value of `default` by default and will filter that out in the registry.
        // Once we have a signing provider that should always be registered we can remove this. We can make an ed25519
        // signer using the @stablelib/ed25519 library.
        console.log('[Agent constructor]', 15);
        dependencyManager.registerInstance(crypto_1.SigningProviderToken, 'default');
        console.log('[Agent constructor]', 16);
        dependencyManager.registerInstance(AgentConfig_1.AgentConfig, agentConfig);
        console.log('[Agent constructor]', 17);
        dependencyManager.registerInstance(constants_1.InjectionSymbols.AgentDependencies, agentConfig.agentDependencies);
        console.log('[Agent constructor]', 18);
        dependencyManager.registerInstance(constants_1.InjectionSymbols.Stop$, new rxjs_1.Subject());
        console.log('[Agent constructor]', 19);
        dependencyManager.registerInstance(constants_1.InjectionSymbols.FileSystem, new agentConfig.agentDependencies.FileSystem());
        // Register all modules. This will also include the default modules
        console.log('[Agent constructor]', 20);
        dependencyManager.registerModules(modulesWithDefaultModules);
        console.log('[Agent constructor]', 21);
        // Register possibly already defined services
        if (!dependencyManager.isRegistered(constants_1.InjectionSymbols.Wallet)) {
            throw new error_1.AriesFrameworkError("Missing required dependency: 'Wallet'. You can register it using one of the provided modules such as the AskarModule or the IndySdkModule, or implement your own.");
        }
        console.log('[Agent constructor]', 22);
        if (!dependencyManager.isRegistered(constants_1.InjectionSymbols.Logger)) {
            dependencyManager.registerInstance(constants_1.InjectionSymbols.Logger, agentConfig.logger);
        }
        console.log('[Agent constructor]', 23);
        if (!dependencyManager.isRegistered(constants_1.InjectionSymbols.StorageService)) {
            throw new error_1.AriesFrameworkError("Missing required dependency: 'StorageService'. You can register it using one of the provided modules such as the AskarModule or the IndySdkModule, or implement your own.");
        }
        console.log('[Agent constructor]', 24);
        if (!dependencyManager.isRegistered(constants_1.InjectionSymbols.MessageRepository)) {
            dependencyManager.registerSingleton(constants_1.InjectionSymbols.MessageRepository, InMemoryMessageRepository_1.InMemoryMessageRepository);
        }
        // TODO: contextCorrelationId for base wallet
        // Bind the default agent context to the container for use in modules etc.
        console.log('[Agent constructor]', 25);
        dependencyManager.registerInstance(context_1.AgentContext, new context_1.AgentContext({
            dependencyManager,
            contextCorrelationId: 'default',
        }));
        // If no agent context provider has been registered we use the default agent context provider.
        console.log('[Agent constructor]', 26);
        if (!dependencyManager.isRegistered(constants_1.InjectionSymbols.AgentContextProvider)) {
            dependencyManager.registerSingleton(constants_1.InjectionSymbols.AgentContextProvider, context_1.DefaultAgentContextProvider);
        }
        console.log('[Agent constructor]', 27);
        super(agentConfig, dependencyManager);
        console.log('[Agent constructor]', 28);
        const stop$ = this.dependencyManager.resolve(constants_1.InjectionSymbols.Stop$);
        // Listen for new messages (either from transports or somewhere else in the framework / extensions)
        console.log('[Agent constructor]', 29);
        this.messageSubscription = this.eventEmitter
            .observable(Events_1.AgentEventTypes.AgentMessageReceived)
            .pipe((0, operators_1.takeUntil)(stop$), (0, operators_1.concatMap)((e) => this.messageReceiver
            .receiveMessage(e.payload.message, {
            connection: e.payload.connection,
            contextCorrelationId: e.payload.contextCorrelationId,
        })
            .catch((error) => {
            this.logger.error('Failed to process message', { error });
        })))
            .subscribe();
        console.log('[Agent constructor]', 30);
    }
    registerInboundTransport(inboundTransport) {
        this.messageReceiver.registerInboundTransport(inboundTransport);
    }
    async unregisterInboundTransport(inboundTransport) {
        await this.messageReceiver.unregisterInboundTransport(inboundTransport);
    }
    get inboundTransports() {
        return this.messageReceiver.inboundTransports;
    }
    registerOutboundTransport(outboundTransport) {
        this.messageSender.registerOutboundTransport(outboundTransport);
    }
    async unregisterOutboundTransport(outboundTransport) {
        await this.messageSender.unregisterOutboundTransport(outboundTransport);
    }
    get outboundTransports() {
        return this.messageSender.outboundTransports;
    }
    get events() {
        return this.eventEmitter;
    }
    /**
     * Agent's feature registry
     */
    get features() {
        return this.featureRegistry;
    }
    async initialize() {
        console.log('[Agent]', 1);
        await super.initialize();
        console.log('[Agent]', 2);
        for (const [, module] of Object.entries(this.dependencyManager.registeredModules)) {
            if (module.initialize) {
                await module.initialize(this.agentContext);
            }
        }
        console.log('[Agent]', 3);
        for (const transport of this.inboundTransports) {
            await transport.start(this);
        }
        console.log('[Agent]', 4);
        for (const transport of this.outboundTransports) {
            await transport.start(this);
        }
        console.log('[Agent]', 5);
        // Connect to mediator through provided invitation if provided in config
        // Also requests mediation ans sets as default mediator
        // Because this requires the connections module, we do this in the agent constructor
        if (this.mediationRecipient.config.mediatorInvitationUrl) {
            this.logger.debug('Provision mediation with invitation', {
                mediatorInvitationUrl: this.mediationRecipient.config.mediatorInvitationUrl,
            });
            const mediationConnection = await this.getMediationConnection(this.mediationRecipient.config.mediatorInvitationUrl);
            await this.mediationRecipient.provision(mediationConnection);
        }
        console.log('[Agent]', 6);
        await this.mediator.initialize();
        console.log('[Agent]', 7);
        await this.mediationRecipient.initialize();
        console.log('[Agent]', 8);
        this._isInitialized = true;
        console.log('[Agent]', 9);
    }
    async shutdown() {
        const stop$ = this.dependencyManager.resolve(constants_1.InjectionSymbols.Stop$);
        // All observables use takeUntil with the stop$ observable
        // this means all observables will stop running if a value is emitted on this observable
        stop$.next(true);
        // Stop transports
        const allTransports = [...this.inboundTransports, ...this.outboundTransports];
        const transportPromises = allTransports.map((transport) => transport.stop());
        await Promise.all(transportPromises);
        if (this.wallet.isInitialized) {
            await this.wallet.close();
        }
        this._isInitialized = false;
    }
    async getMediationConnection(mediatorInvitationUrl) {
        const outOfBandInvitation = await this.oob.parseInvitation(mediatorInvitationUrl);
        const outOfBandRecord = await this.oob.findByReceivedInvitationId(outOfBandInvitation.id);
        const [connection] = outOfBandRecord ? await this.connections.findAllByOutOfBandId(outOfBandRecord.id) : [];
        if (!connection) {
            this.logger.debug('Mediation connection does not exist, creating connection');
            // We don't want to use the current default mediator when connecting to another mediator
            const routing = await this.mediationRecipient.getRouting({ useDefaultMediator: false });
            this.logger.debug('Routing created', routing);
            const { connectionRecord: newConnection } = await this.oob.receiveInvitation(outOfBandInvitation, {
                routing,
            });
            this.logger.debug(`Mediation invitation processed`, { outOfBandInvitation });
            if (!newConnection) {
                throw new error_1.AriesFrameworkError('No connection record to provision mediation.');
            }
            return this.connections.returnWhenIsConnected(newConnection.id);
        }
        if (!connection.isReady) {
            return this.connections.returnWhenIsConnected(connection.id);
        }
        return connection;
    }
}
exports.Agent = Agent;
//# sourceMappingURL=Agent.js.map