import type { AgentDependencies } from './AgentDependencies'
import type { AgentModulesInput } from './AgentModules'
import type { AgentMessageReceivedEvent } from './Events'
import type { Module } from '../plugins'
import type { InboundTransport } from '../transport/InboundTransport'
import type { OutboundTransport } from '../transport/OutboundTransport'
import type { InitConfig } from '../types'
import type { Subscription } from 'rxjs'

import { Subject } from 'rxjs'
import { concatMap, takeUntil } from 'rxjs/operators'

import { InjectionSymbols } from '../constants'
import { SigningProviderToken } from '../crypto'
import { JwsService } from '../crypto/JwsService'
import { AriesFrameworkError } from '../error'
import { DependencyManager } from '../plugins'
import { DidCommMessageRepository, StorageUpdateService, StorageVersionRepository } from '../storage'
import { InMemoryMessageRepository } from '../storage/InMemoryMessageRepository'

import { AgentConfig } from './AgentConfig'
import { extendModulesWithDefaultModules } from './AgentModules'
import { BaseAgent } from './BaseAgent'
import { Dispatcher } from './Dispatcher'
import { EnvelopeService } from './EnvelopeService'
import { EventEmitter } from './EventEmitter'
import { AgentEventTypes } from './Events'
import { FeatureRegistry } from './FeatureRegistry'
import { MessageHandlerRegistry } from './MessageHandlerRegistry'
import { MessageReceiver } from './MessageReceiver'
import { MessageSender } from './MessageSender'
import { TransportService } from './TransportService'
import { AgentContext, DefaultAgentContextProvider } from './context'

interface AgentOptions<AgentModules extends AgentModulesInput> {
  config: InitConfig
  modules?: AgentModules
  dependencies: AgentDependencies
}

// Any makes sure you can use Agent as a type without always needing to specify the exact generics for the agent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Agent<AgentModules extends AgentModulesInput = any> extends BaseAgent<AgentModules> {
  public messageSubscription: Subscription

  public constructor(options: AgentOptions<AgentModules>, dependencyManager = new DependencyManager()) {
    console.log('[Agent constructor]', 1)
    const agentConfig = new AgentConfig(options.config, options.dependencies)
    console.log('[Agent constructor]', 2)
    const modulesWithDefaultModules = extendModulesWithDefaultModules(options.modules)
    
    // Register internal dependencies
    console.log('[Agent constructor]', 3)
    dependencyManager.registerSingleton(MessageHandlerRegistry)
    console.log('[Agent constructor]', 4)
    dependencyManager.registerSingleton(EventEmitter)
    console.log('[Agent constructor]', 5)
    dependencyManager.registerSingleton(MessageSender)
    console.log('[Agent constructor]', 6)
    dependencyManager.registerSingleton(MessageReceiver)
    console.log('[Agent constructor]', 7)
    dependencyManager.registerSingleton(TransportService)
    console.log('[Agent constructor]', 8)
    dependencyManager.registerSingleton(Dispatcher)
    console.log('[Agent constructor]', 9)
    dependencyManager.registerSingleton(EnvelopeService)
    console.log('[Agent constructor]', 10)
    dependencyManager.registerSingleton(FeatureRegistry)
    console.log('[Agent constructor]', 11)
    dependencyManager.registerSingleton(JwsService)
    console.log('[Agent constructor]', 12)
    dependencyManager.registerSingleton(DidCommMessageRepository)
    console.log('[Agent constructor]', 13)
    dependencyManager.registerSingleton(StorageVersionRepository)
    console.log('[Agent constructor]', 14)
    dependencyManager.registerSingleton(StorageUpdateService)
    
    // This is a really ugly hack to make tsyringe work without any SigningProviders registered
    // It is currently impossible to use @injectAll if there are no instances registered for the
    // token. We register a value of `default` by default and will filter that out in the registry.
    // Once we have a signing provider that should always be registered we can remove this. We can make an ed25519
    // signer using the @stablelib/ed25519 library.
    console.log('[Agent constructor]', 15)
    dependencyManager.registerInstance(SigningProviderToken, 'default')
    
    console.log('[Agent constructor]', 16)
    dependencyManager.registerInstance(AgentConfig, agentConfig)
    console.log('[Agent constructor]', 17)
    dependencyManager.registerInstance(InjectionSymbols.AgentDependencies, agentConfig.agentDependencies)
    console.log('[Agent constructor]', 18)
    dependencyManager.registerInstance(InjectionSymbols.Stop$, new Subject<boolean>())
    console.log('[Agent constructor]', 19)
    dependencyManager.registerInstance(InjectionSymbols.FileSystem, new agentConfig.agentDependencies.FileSystem())
    
    // Register all modules. This will also include the default modules
    console.log('[Agent constructor]', 20)
    dependencyManager.registerModules(modulesWithDefaultModules)
    console.log('[Agent constructor]', 21)
    
    // Register possibly already defined services
    if (!dependencyManager.isRegistered(InjectionSymbols.Wallet)) {
      throw new AriesFrameworkError(
        "Missing required dependency: 'Wallet'. You can register it using one of the provided modules such as the AskarModule or the IndySdkModule, or implement your own."
        )
      }
    console.log('[Agent constructor]', 22)
    if (!dependencyManager.isRegistered(InjectionSymbols.Logger)) {
      dependencyManager.registerInstance(InjectionSymbols.Logger, agentConfig.logger)
    }
    console.log('[Agent constructor]', 23)
    if (!dependencyManager.isRegistered(InjectionSymbols.StorageService)) {
      throw new AriesFrameworkError(
        "Missing required dependency: 'StorageService'. You can register it using one of the provided modules such as the AskarModule or the IndySdkModule, or implement your own."
        )
      }
    console.log('[Agent constructor]', 24)
    if (!dependencyManager.isRegistered(InjectionSymbols.MessageRepository)) {
      dependencyManager.registerSingleton(InjectionSymbols.MessageRepository, InMemoryMessageRepository)
    }
    
    // TODO: contextCorrelationId for base wallet
    // Bind the default agent context to the container for use in modules etc.
    console.log('[Agent constructor]', 25)
    dependencyManager.registerInstance(
      AgentContext,
      new AgentContext({
        dependencyManager,
        contextCorrelationId: 'default',
      })
    )
      
      // If no agent context provider has been registered we use the default agent context provider.
    console.log('[Agent constructor]', 26)
    if (!dependencyManager.isRegistered(InjectionSymbols.AgentContextProvider)) {
      dependencyManager.registerSingleton(InjectionSymbols.AgentContextProvider, DefaultAgentContextProvider)
    }
    
    console.log('[Agent constructor]', 27)
    super(agentConfig, dependencyManager)
    
    console.log('[Agent constructor]', 28)
    const stop$ = this.dependencyManager.resolve<Subject<boolean>>(InjectionSymbols.Stop$)
    
    // Listen for new messages (either from transports or somewhere else in the framework / extensions)
    console.log('[Agent constructor]', 29)
    this.messageSubscription = this.eventEmitter
    .observable<AgentMessageReceivedEvent>(AgentEventTypes.AgentMessageReceived)
    .pipe(
      takeUntil(stop$),
      concatMap((e) =>
      this.messageReceiver
      .receiveMessage(e.payload.message, {
        connection: e.payload.connection,
        contextCorrelationId: e.payload.contextCorrelationId,
      })
      .catch((error) => {
        this.logger.error('Failed to process message', { error })
      })
      )
      )
      .subscribe()
    console.log('[Agent constructor]', 30)
  }

  public registerInboundTransport(inboundTransport: InboundTransport) {
    this.messageReceiver.registerInboundTransport(inboundTransport)
  }

  public async unregisterInboundTransport(inboundTransport: InboundTransport) {
    await this.messageReceiver.unregisterInboundTransport(inboundTransport)
  }

  public get inboundTransports() {
    return this.messageReceiver.inboundTransports
  }

  public registerOutboundTransport(outboundTransport: OutboundTransport) {
    this.messageSender.registerOutboundTransport(outboundTransport)
  }

  public async unregisterOutboundTransport(outboundTransport: OutboundTransport) {
    await this.messageSender.unregisterOutboundTransport(outboundTransport)
  }

  public get outboundTransports() {
    return this.messageSender.outboundTransports
  }

  public get events() {
    return this.eventEmitter
  }

  /**
   * Agent's feature registry
   */
  public get features() {
    return this.featureRegistry
  }

  public async initialize() {
    console.log('[Agent]', 1)
    await super.initialize()
    console.log('[Agent]', 2)
    
    for (const [, module] of Object.entries(this.dependencyManager.registeredModules) as [string, Module][]) {
      if (module.initialize) {
        await module.initialize(this.agentContext)
      }
    }
    console.log('[Agent]', 3)
    
    for (const transport of this.inboundTransports) {
      await transport.start(this)
    }
    console.log('[Agent]', 4)
    
    for (const transport of this.outboundTransports) {
      await transport.start(this)
    }
    console.log('[Agent]', 5)
    
    // Connect to mediator through provided invitation if provided in config
    // Also requests mediation ans sets as default mediator
    // Because this requires the connections module, we do this in the agent constructor
    if (this.mediationRecipient.config.mediatorInvitationUrl) {
      this.logger.debug('Provision mediation with invitation', {
        mediatorInvitationUrl: this.mediationRecipient.config.mediatorInvitationUrl,
      })
      const mediationConnection = await this.getMediationConnection(
        this.mediationRecipient.config.mediatorInvitationUrl
        )
        await this.mediationRecipient.provision(mediationConnection)
      }
      console.log('[Agent]', 6)
      await this.mediator.initialize()
      console.log('[Agent]', 7)
      await this.mediationRecipient.initialize()
      console.log('[Agent]', 8)
      
      this._isInitialized = true
      console.log('[Agent]', 9)
    }
    
    
  public async shutdown() {
    const stop$ = this.dependencyManager.resolve<Subject<boolean>>(InjectionSymbols.Stop$)
    // All observables use takeUntil with the stop$ observable
    // this means all observables will stop running if a value is emitted on this observable
    stop$.next(true)

    // Stop transports
    const allTransports = [...this.inboundTransports, ...this.outboundTransports]
    const transportPromises = allTransports.map((transport) => transport.stop())
    await Promise.all(transportPromises)

    if (this.wallet.isInitialized) {
      await this.wallet.close()
    }

    this._isInitialized = false
  }

  protected async getMediationConnection(mediatorInvitationUrl: string) {
    const outOfBandInvitation = await this.oob.parseInvitation(mediatorInvitationUrl)
    const outOfBandRecord = await this.oob.findByReceivedInvitationId(outOfBandInvitation.id)
    const [connection] = outOfBandRecord ? await this.connections.findAllByOutOfBandId(outOfBandRecord.id) : []

    if (!connection) {
      this.logger.debug('Mediation connection does not exist, creating connection')
      // We don't want to use the current default mediator when connecting to another mediator
      const routing = await this.mediationRecipient.getRouting({ useDefaultMediator: false })

      this.logger.debug('Routing created', routing)
      const { connectionRecord: newConnection } = await this.oob.receiveInvitation(outOfBandInvitation, {
        routing,
      })
      this.logger.debug(`Mediation invitation processed`, { outOfBandInvitation })

      if (!newConnection) {
        throw new AriesFrameworkError('No connection record to provision mediation.')
      }

      return this.connections.returnWhenIsConnected(newConnection.id)
    }

    if (!connection.isReady) {
      return this.connections.returnWhenIsConnected(connection.id)
    }
    return connection
  }
}
