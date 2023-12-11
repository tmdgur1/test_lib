import { FeatureRegistry } from '../../../agent/FeatureRegistry'
import { Protocol } from '../../../agent/models'
import { DependencyManager } from '../../../plugins/DependencyManager'
import { MessagePickupApi } from '../MessagePickupApi'
import { MessagePickupModule } from '../MessagePickupModule'
import { MessagePickupModuleConfig } from '../MessagePickupModuleConfig'

jest.mock('../../../plugins/DependencyManager')
const DependencyManagerMock = DependencyManager as jest.Mock<DependencyManager>

jest.mock('../../../agent/FeatureRegistry')
const FeatureRegistryMock = FeatureRegistry as jest.Mock<FeatureRegistry>

const dependencyManager = new DependencyManagerMock()
const featureRegistry = new FeatureRegistryMock()

describe('MessagePickupModule', () => {
  test('registers dependencies on the dependency manager', () => {
    const module = new MessagePickupModule()
    module.register(dependencyManager, featureRegistry)

    expect(dependencyManager.registerContextScoped).toHaveBeenCalledTimes(1)
    expect(dependencyManager.registerContextScoped).toHaveBeenCalledWith(MessagePickupApi)

    expect(dependencyManager.registerInstance).toHaveBeenCalledTimes(1)
    expect(dependencyManager.registerInstance).toHaveBeenCalledWith(MessagePickupModuleConfig, module.config)

    expect(featureRegistry.register).toHaveBeenCalledTimes(2)
    expect(featureRegistry.register).toHaveBeenCalledWith(
      new Protocol({
        id: 'https://didcomm.org/messagepickup/1.0',
        roles: ['message_holder', 'recipient', 'batch_sender', 'batch_recipient'],
      })
    )
    expect(featureRegistry.register).toHaveBeenCalledWith(
      new Protocol({
        id: 'https://didcomm.org/messagepickup/2.0',
        roles: ['mediator', 'recipient'],
      })
    )
  })
})
