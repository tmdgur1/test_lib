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
exports.V2ProposeCredentialMessage = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AgentMessage_1 = require("../../../../../agent/AgentMessage");
const Attachment_1 = require("../../../../../decorators/attachment/Attachment");
const messageType_1 = require("../../../../../utils/messageType");
const models_1 = require("../../../models");
const V2CredentialPreview_1 = require("./V2CredentialPreview");
class V2ProposeCredentialMessage extends AgentMessage_1.AgentMessage {
    constructor(options) {
        var _a;
        super();
        this.type = V2ProposeCredentialMessage.type.messageTypeUri;
        if (options) {
            this.id = (_a = options.id) !== null && _a !== void 0 ? _a : this.generateId();
            this.comment = options.comment;
            this.credentialPreview = options.credentialPreview;
            this.formats = options.formats;
            this.proposalAttachments = options.proposalAttachments;
            this.appendedAttachments = options.attachments;
        }
    }
    getProposalAttachmentById(id) {
        return this.proposalAttachments.find((attachment) => attachment.id === id);
    }
}
V2ProposeCredentialMessage.type = (0, messageType_1.parseMessageType)('https://didcomm.org/issue-credential/2.0/propose-credential');
__decorate([
    (0, class_transformer_1.Type)(() => models_1.CredentialFormatSpec),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInstance)(models_1.CredentialFormatSpec, { each: true }),
    __metadata("design:type", Array)
], V2ProposeCredentialMessage.prototype, "formats", void 0);
__decorate([
    (0, messageType_1.IsValidMessageType)(V2ProposeCredentialMessage.type),
    __metadata("design:type", Object)
], V2ProposeCredentialMessage.prototype, "type", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'credential_preview' }),
    (0, class_transformer_1.Type)(() => V2CredentialPreview_1.V2CredentialPreview),
    (0, class_validator_1.ValidateNested)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInstance)(V2CredentialPreview_1.V2CredentialPreview),
    __metadata("design:type", V2CredentialPreview_1.V2CredentialPreview)
], V2ProposeCredentialMessage.prototype, "credentialPreview", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'filters~attach' }),
    (0, class_transformer_1.Type)(() => Attachment_1.Attachment),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({
        each: true,
    }),
    (0, class_validator_1.IsInstance)(Attachment_1.Attachment, { each: true }),
    __metadata("design:type", Array)
], V2ProposeCredentialMessage.prototype, "proposalAttachments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], V2ProposeCredentialMessage.prototype, "comment", void 0);
exports.V2ProposeCredentialMessage = V2ProposeCredentialMessage;
//# sourceMappingURL=V2ProposeCredentialMessage.js.map