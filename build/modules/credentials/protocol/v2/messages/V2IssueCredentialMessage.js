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
exports.V2IssueCredentialMessage = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AgentMessage_1 = require("../../../../../agent/AgentMessage");
const Attachment_1 = require("../../../../../decorators/attachment/Attachment");
const messageType_1 = require("../../../../../utils/messageType");
const models_1 = require("../../../models");
class V2IssueCredentialMessage extends AgentMessage_1.AgentMessage {
    constructor(options) {
        var _a;
        super();
        this.type = V2IssueCredentialMessage.type.messageTypeUri;
        if (options) {
            this.id = (_a = options.id) !== null && _a !== void 0 ? _a : this.generateId();
            this.comment = options.comment;
            this.formats = options.formats;
            this.credentialAttachments = options.credentialAttachments;
        }
    }
    getCredentialAttachmentById(id) {
        return this.credentialAttachments.find((attachment) => attachment.id === id);
    }
}
V2IssueCredentialMessage.type = (0, messageType_1.parseMessageType)('https://didcomm.org/issue-credential/2.0/issue-credential');
__decorate([
    (0, class_transformer_1.Type)(() => models_1.CredentialFormatSpec),
    (0, class_validator_1.ValidateNested)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInstance)(models_1.CredentialFormatSpec, { each: true }),
    __metadata("design:type", Array)
], V2IssueCredentialMessage.prototype, "formats", void 0);
__decorate([
    (0, messageType_1.IsValidMessageType)(V2IssueCredentialMessage.type),
    __metadata("design:type", Object)
], V2IssueCredentialMessage.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], V2IssueCredentialMessage.prototype, "comment", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'credentials~attach' }),
    (0, class_transformer_1.Type)(() => Attachment_1.Attachment),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({
        each: true,
    }),
    (0, class_validator_1.IsInstance)(Attachment_1.Attachment, { each: true }),
    __metadata("design:type", Array)
], V2IssueCredentialMessage.prototype, "credentialAttachments", void 0);
exports.V2IssueCredentialMessage = V2IssueCredentialMessage;
//# sourceMappingURL=V2IssueCredentialMessage.js.map