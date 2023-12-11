import { Expose } from 'class-transformer'
import { IsInt, IsOptional, IsString } from 'class-validator'

import { AgentMessage } from '../../../../../agent/AgentMessage'
import { ReturnRouteTypes } from '../../../../../decorators/transport/TransportDecorator'
import { IsValidMessageType, parseMessageType } from '../../../../../utils/messageType'

export interface V2DeliveryRequestMessageOptions {
  id?: string
  recipientKey?: string
  limit: number
}

export class V2DeliveryRequestMessage extends AgentMessage {
  public constructor(options: V2DeliveryRequestMessageOptions) {
    super()

    if (options) {
      this.id = options.id || this.generateId()
      this.recipientKey = options.recipientKey
      this.limit = options.limit
    }
    this.setReturnRouting(ReturnRouteTypes.all)
  }

  @IsValidMessageType(V2DeliveryRequestMessage.type)
  public readonly type = V2DeliveryRequestMessage.type.messageTypeUri
  public static readonly type = parseMessageType('https://didcomm.org/messagepickup/2.0/delivery-request')

  @IsString()
  @IsOptional()
  @Expose({ name: 'recipient_key' })
  public recipientKey?: string

  @IsInt()
  public limit!: number
}
