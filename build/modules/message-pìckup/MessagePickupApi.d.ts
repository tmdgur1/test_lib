import type { PickupMessagesOptions, PickupMessagesReturnType, QueueMessageOptions, QueueMessageReturnType } from './MessagePickupApiOptions';
import type { V1MessagePickupProtocol, V2MessagePickupProtocol } from './protocol';
import type { MessagePickupProtocol } from './protocol/MessagePickupProtocol';
import { AgentContext } from '../../agent';
import { MessageSender } from '../../agent/MessageSender';
import { ConnectionService } from '../connections/services';
import { MessagePickupModuleConfig } from './MessagePickupModuleConfig';
export interface MessagePickupApi<MPPs extends MessagePickupProtocol[]> {
    queueMessage(options: QueueMessageOptions): Promise<QueueMessageReturnType>;
    pickupMessages(options: PickupMessagesOptions<MPPs>): Promise<PickupMessagesReturnType>;
}
export declare class MessagePickupApi<MPPs extends MessagePickupProtocol[] = [V1MessagePickupProtocol, V2MessagePickupProtocol]> implements MessagePickupApi<MPPs> {
    config: MessagePickupModuleConfig<MPPs>;
    private messageSender;
    private agentContext;
    private connectionService;
    constructor(messageSender: MessageSender, agentContext: AgentContext, connectionService: ConnectionService, config: MessagePickupModuleConfig<MPPs>);
    private getProtocol;
}
