import type { AgentConfig } from './AgentConfig';
import type { AgentApi, CustomOrDefaultApi, EmptyModuleMap, ModulesMap, WithoutDefaultModules } from './AgentModules';
import type { TransportSession } from './TransportService';
import type { Logger } from '../logger';
import type { CredentialsModule } from '../modules/credentials';
import type { MessagePickupModule } from '../modules/message-pìckup';
import type { ProofsModule } from '../modules/proofs';
import type { DependencyManager } from '../plugins';
import { BasicMessagesApi } from '../modules/basic-messages';
import { ConnectionsApi } from '../modules/connections';
import { DidsApi } from '../modules/dids';
import { DiscoverFeaturesApi } from '../modules/discover-features';
import { GenericRecordsApi } from '../modules/generic-records';
import { OutOfBandApi } from '../modules/oob';
import { MediatorApi, MediationRecipientApi } from '../modules/routing';
import { W3cCredentialsApi } from '../modules/vc/W3cCredentialsApi';
import { WalletApi } from '../wallet';
import { EventEmitter } from './EventEmitter';
import { FeatureRegistry } from './FeatureRegistry';
import { MessageReceiver } from './MessageReceiver';
import { MessageSender } from './MessageSender';
import { TransportService } from './TransportService';
import { AgentContext } from './context';
export declare abstract class BaseAgent<AgentModules extends ModulesMap = EmptyModuleMap> {
    protected agentConfig: AgentConfig;
    protected logger: Logger;
    readonly dependencyManager: DependencyManager;
    protected eventEmitter: EventEmitter;
    protected featureRegistry: FeatureRegistry;
    protected messageReceiver: MessageReceiver;
    protected transportService: TransportService;
    protected messageSender: MessageSender;
    protected _isInitialized: boolean;
    protected agentContext: AgentContext;
    readonly connections: ConnectionsApi;
    readonly credentials: CustomOrDefaultApi<AgentModules['credentials'], CredentialsModule>;
    readonly proofs: CustomOrDefaultApi<AgentModules['proofs'], ProofsModule>;
    readonly mediator: MediatorApi;
    readonly mediationRecipient: MediationRecipientApi;
    readonly messagePickup: CustomOrDefaultApi<AgentModules['messagePickup'], MessagePickupModule>;
    readonly basicMessages: BasicMessagesApi;
    readonly genericRecords: GenericRecordsApi;
    readonly discovery: DiscoverFeaturesApi;
    readonly dids: DidsApi;
    readonly wallet: WalletApi;
    readonly oob: OutOfBandApi;
    readonly w3cCredentials: W3cCredentialsApi;
    readonly modules: AgentApi<WithoutDefaultModules<AgentModules>>;
    constructor(agentConfig: AgentConfig, dependencyManager: DependencyManager);
    get isInitialized(): boolean;
    initialize(): Promise<void>;
    /**
     * Receive a message. This should mainly be used for receiving connection-less messages.
     *
     * If you want to receive messages that originated from e.g. a transport make sure to use the {@link MessageReceiver}
     * for this. The `receiveMessage` method on the `Agent` class will associate the current context to the message, which
     * may not be what should happen (e.g. in case of multi tenancy).
     */
    receiveMessage(inboundMessage: unknown, session?: TransportSession): Promise<void>;
    get config(): AgentConfig;
    get context(): AgentContext;
}
