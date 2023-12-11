import type { ModulesMap } from '../agent/AgentModules'
import type { MessageHandler } from '../agent/MessageHandler'
import type { Constructor } from '../utils/mixins'
import type { DependencyContainer } from 'tsyringe'

import { container as rootContainer, InjectionToken, Lifecycle } from 'tsyringe'

import { FeatureRegistry } from '../agent/FeatureRegistry'
import { MessageHandlerRegistry } from '../agent/MessageHandlerRegistry'
import { AriesFrameworkError } from '../error'

export { InjectionToken }

export class DependencyManager {
  public readonly container: DependencyContainer
  public readonly registeredModules: ModulesMap

  public constructor(
    container: DependencyContainer = rootContainer.createChildContainer(),
    registeredModules: ModulesMap = {}
  ) {
    this.container = container
    this.registeredModules = registeredModules
  }

  public registerModules(modules: ModulesMap) {
    console.log('[DependencyManager]', 1)
    const featureRegistry = this.resolve(FeatureRegistry)
    console.log('[DependencyManager]', 2)
    // console.log('[DependencyManager]', Object.entries(modules))
    
    for (const [moduleKey, module] of Object.entries(modules)) {
      console.log('[DependencyManager]', '2-1')
      if (this.registeredModules[moduleKey]) {
        throw new AriesFrameworkError(
          `Module with key ${moduleKey} has already been registered. Only a single module can be registered with the same key.`
          )
        }
        
        console.log('[DependencyManager]', moduleKey)
        this.registeredModules[moduleKey] = module
        console.log('[DependencyManager]', '2-2')
        try { module.register(this, featureRegistry) } catch (e) { console.log('[DependencyManager]', e) }
        console.log('[DependencyManager]', '2-3')
      }
    console.log('[DependencyManager]', 3)
  }

  public registerMessageHandlers(messageHandlers: MessageHandler[]) {
    const messageHandlerRegistry = this.resolve(MessageHandlerRegistry)

    for (const messageHandler of messageHandlers) {
      messageHandlerRegistry.registerMessageHandler(messageHandler)
    }
  }

  public registerSingleton<T>(from: InjectionToken<T>, to: InjectionToken<T>): void
  public registerSingleton<T>(token: Constructor<T>): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public registerSingleton<T = any>(fromOrToken: InjectionToken<T> | Constructor<T>, to?: any) {
    this.container.registerSingleton(fromOrToken, to)
  }

  public resolve<T>(token: InjectionToken<T>): T {
    return this.container.resolve(token)
  }

  public registerInstance<T>(token: InjectionToken<T>, instance: T) {
    this.container.registerInstance(token, instance)
  }

  public isRegistered<T>(token: InjectionToken<T>): boolean {
    return this.container.isRegistered(token)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public registerContextScoped<T = any>(token: Constructor<T>): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public registerContextScoped<T = any>(token: InjectionToken<T>, provider: Constructor<T>): void

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public registerContextScoped(token: any, provider?: any) {
    if (provider) this.container.register(token, provider, { lifecycle: Lifecycle.ContainerScoped })
    else this.container.register(token, token, { lifecycle: Lifecycle.ContainerScoped })
  }

  /**
   * Dispose the dependency manager. Calls `.dispose()` on all instances that implement the `Disposable` interface and have
   * been constructed by the `DependencyManager`. This means all instances registered using `registerInstance` won't have the
   * dispose method called.
   */
  public async dispose() {
    await this.container.dispose()
  }

  public createChild() {
    return new DependencyManager(this.container.createChildContainer(), this.registeredModules)
  }
}
