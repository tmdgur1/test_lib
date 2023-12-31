"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialExchangeRecord = void 0;
const class_transformer_1 = require("class-transformer");
const Attachment_1 = require("../../../decorators/attachment/Attachment");
const error_1 = require("../../../error");
const BaseRecord_1 = require("../../../storage/BaseRecord");
const uuid_1 = require("../../../utils/uuid");
const CredentialPreviewAttribute_1 = require("../models/CredentialPreviewAttribute");
class CredentialExchangeRecord extends BaseRecord_1.BaseRecord {
    constructor(props) {
        var _a, _b, _c;
        super();
        this.credentials = [];
        this.type = CredentialExchangeRecord.type;
        if (props) {
            this.id = (_a = props.id) !== null && _a !== void 0 ? _a : (0, uuid_1.uuid)();
            this.createdAt = (_b = props.createdAt) !== null && _b !== void 0 ? _b : new Date();
            this.state = props.state;
            this.connectionId = props.connectionId;
            this.threadId = props.threadId;
            this.protocolVersion = props.protocolVersion;
            this._tags = (_c = props.tags) !== null && _c !== void 0 ? _c : {};
            this.credentialAttributes = props.credentialAttributes;
            this.autoAcceptCredential = props.autoAcceptCredential;
            this.linkedAttachments = props.linkedAttachments;
            this.revocationNotification = props.revocationNotification;
            this.errorMessage = props.errorMessage;
            this.credentials = props.credentials || [];
        }
    }
    getTags() {
        const ids = this.credentials.map((c) => c.credentialRecordId);
        return Object.assign(Object.assign({}, this._tags), { threadId: this.threadId, connectionId: this.connectionId, state: this.state, credentialIds: ids });
    }
    assertProtocolVersion(version) {
        if (this.protocolVersion != version) {
            throw new error_1.AriesFrameworkError(`Credential record has invalid protocol version ${this.protocolVersion}. Expected version ${version}`);
        }
    }
    assertState(expectedStates) {
        if (!Array.isArray(expectedStates)) {
            expectedStates = [expectedStates];
        }
        if (!expectedStates.includes(this.state)) {
            throw new error_1.AriesFrameworkError(`Credential record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`);
        }
    }
    assertConnection(currentConnectionId) {
        if (!this.connectionId) {
            throw new error_1.AriesFrameworkError(`Credential record is not associated with any connection. This is often the case with connection-less credential exchange`);
        }
        else if (this.connectionId !== currentConnectionId) {
            throw new error_1.AriesFrameworkError(`Credential record is associated with connection '${this.connectionId}'. Current connection is '${currentConnectionId}'`);
        }
    }
}
// Type is CredentialRecord on purpose (without Exchange) as this is how the record was initially called.
CredentialExchangeRecord.type = 'CredentialRecord';
__decorate([
    (0, class_transformer_1.Type)(() => CredentialPreviewAttribute_1.CredentialPreviewAttribute),
    __metadata("design:type", Array)
], CredentialExchangeRecord.prototype, "credentialAttributes", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Attachment_1.Attachment),
    __metadata("design:type", Array)
], CredentialExchangeRecord.prototype, "linkedAttachments", void 0);
exports.CredentialExchangeRecord = CredentialExchangeRecord;
//# sourceMappingURL=CredentialExchangeRecord.js.map