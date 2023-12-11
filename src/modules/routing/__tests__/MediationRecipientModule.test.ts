import { FeatureRegistry } from '../../../agent/FeatureRegistry'
import { DependencyManager } from '../../../plugins/DependencyManager'
import { MediationRecipientApi } from '../MediationRecipientApi'
import { MediationRecipientModule } from '../MediationRecipientModule'
import { MediationRepository } from '../repository'
import { MediationRecipientService, RoutingService } from '../services'

jest.mock('../../../plugins/DependencyManager')
const DependencyManagerMock = DependencyManager as jest.Mock<DependencyManager>

const dependencyManager = new DependencyManagerMock()

jest.mock('../../../agent/FeatureRegistry')
const FeatureRegistryMock = FeatureRegistry as jest.Mock<FeatureRegistry>

const featureRegistry = new FeatureRegistryMock()

describe('MediationRecipientModule', () => {
  test('registers dependencies on the dependency manager', () => {
    new MediationRecipientModule().register(dependencyManager, featureRegistry)

    expect(dependencyManager.registerContextScoped).toHaveBeenCalledTimes(1)
    expect(dependencyManager.registerContextScoped).toHaveBeenCalledWith(MediationRecipientApi)

    expect(dependencyManager.registerSingleton).toHaveBeenCalledTimes(3)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(MediationRecipientService)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(RoutingService)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(MediationRepository)
  })
})
