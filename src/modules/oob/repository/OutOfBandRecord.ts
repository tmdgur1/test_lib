import type { TagsBase } from '../../../storage/BaseRecord'
import type { OutOfBandRole } from '../domain/OutOfBandRole'
import type { OutOfBandState } from '../domain/OutOfBandState'

import { Type } from 'class-transformer'

import { AriesFrameworkError } from '../../../error'
import { BaseRecord } from '../../../storage/BaseRecord'
import { uuid } from '../../../utils/uuid'
import { OutOfBandInvitation } from '../messages'

type DefaultOutOfBandRecordTags = {
  role: OutOfBandRole
  state: OutOfBandState
  invitationId: string
  threadId?: string
}

interface CustomOutOfBandRecordTags extends TagsBase {
  recipientKeyFingerprints: string[]
}

export interface OutOfBandRecordProps {
  id?: string
  createdAt?: Date
  updatedAt?: Date
  tags?: CustomOutOfBandRecordTags
  outOfBandInvitation: OutOfBandInvitation
  role: OutOfBandRole
  state: OutOfBandState
  alias?: string
  autoAcceptConnection?: boolean
  reusable?: boolean
  mediatorId?: string
  reuseConnectionId?: string
  threadId?: string
}

export class OutOfBandRecord extends BaseRecord<DefaultOutOfBandRecordTags, CustomOutOfBandRecordTags> {
  @Type(() => OutOfBandInvitation)
  public outOfBandInvitation!: OutOfBandInvitation
  public role!: OutOfBandRole
  public state!: OutOfBandState
  public alias?: string
  public reusable!: boolean
  public autoAcceptConnection?: boolean
  public mediatorId?: string
  public reuseConnectionId?: string

  public static readonly type = 'OutOfBandRecord'
  public readonly type = OutOfBandRecord.type

  public constructor(props: OutOfBandRecordProps) {
    super()

    if (props) {
      this.id = props.id ?? uuid()
      this.createdAt = props.createdAt ?? new Date()
      this.outOfBandInvitation = props.outOfBandInvitation
      this.role = props.role
      this.state = props.state
      this.alias = props.alias
      this.autoAcceptConnection = props.autoAcceptConnection
      this.reusable = props.reusable ?? false
      this.mediatorId = props.mediatorId
      this.reuseConnectionId = props.reuseConnectionId
      this._tags = props.tags ?? { recipientKeyFingerprints: [] }
    }
  }

  public getTags() {
    return {
      ...this._tags,
      role: this.role,
      state: this.state,
      invitationId: this.outOfBandInvitation.id,
      threadId: this.outOfBandInvitation.threadId,
    }
  }

  public assertRole(expectedRole: OutOfBandRole) {
    if (this.role !== expectedRole) {
      throw new AriesFrameworkError(`Invalid out-of-band record role ${this.role}, expected is ${expectedRole}.`)
    }
  }

  public assertState(expectedStates: OutOfBandState | OutOfBandState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new AriesFrameworkError(
        `Invalid out-of-band record state ${this.state}, valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }
}
