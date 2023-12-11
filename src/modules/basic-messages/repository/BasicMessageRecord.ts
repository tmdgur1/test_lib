import type { RecordTags, TagsBase } from '../../../storage/BaseRecord'
import type { BasicMessageRole } from '../BasicMessageRole'

import { BaseRecord } from '../../../storage/BaseRecord'
import { uuid } from '../../../utils/uuid'

export type CustomBasicMessageTags = TagsBase
export type DefaultBasicMessageTags = {
  connectionId: string
  role: BasicMessageRole
  threadId?: string
  parentThreadId?: string
}

export type BasicMessageTags = RecordTags<BasicMessageRecord>

export interface BasicMessageStorageProps {
  id?: string
  createdAt?: Date
  connectionId: string
  role: BasicMessageRole
  tags?: CustomBasicMessageTags
  threadId?: string
  parentThreadId?: string
  content: string
  sentTime: string
}

export class BasicMessageRecord extends BaseRecord<DefaultBasicMessageTags, CustomBasicMessageTags> {
  public content!: string
  public sentTime!: string
  public connectionId!: string
  public role!: BasicMessageRole
  public threadId?: string
  public parentThreadId?: string

  public static readonly type = 'BasicMessageRecord'
  public readonly type = BasicMessageRecord.type

  public constructor(props: BasicMessageStorageProps) {
    super()

    if (props) {
      this.id = props.id ?? uuid()
      this.createdAt = props.createdAt ?? new Date()
      this.content = props.content
      this.sentTime = props.sentTime
      this.connectionId = props.connectionId
      this._tags = props.tags ?? {}
      this.role = props.role
      this.threadId = props.threadId
      this.parentThreadId = props.parentThreadId
    }
  }

  public getTags() {
    return {
      ...this._tags,
      connectionId: this.connectionId,
      role: this.role,
      threadId: this.threadId,
      parentThreadId: this.parentThreadId,
    }
  }
}
