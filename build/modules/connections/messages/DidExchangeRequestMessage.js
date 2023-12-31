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
exports.DidExchangeRequestMessage = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AgentMessage_1 = require("../../../agent/AgentMessage");
const Attachment_1 = require("../../../decorators/attachment/Attachment");
const messageType_1 = require("../../../utils/messageType");
/**
 * Message to communicate the DID document to the other agent when creating a connection
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0023-did-exchange/README.md#1-exchange-request
 */
class DidExchangeRequestMessage extends AgentMessage_1.AgentMessage {
    /**
     * Create new DidExchangeRequestMessage instance.
     * @param options
     */
    constructor(options) {
        super();
        this.type = DidExchangeRequestMessage.type.messageTypeUri;
        if (options) {
            this.id = options.id || this.generateId();
            this.label = options.label;
            this.goalCode = options.goalCode;
            this.goal = options.goal;
            this.did = options.did;
            this.setThread({
                parentThreadId: options.parentThreadId,
            });
        }
    }
}
DidExchangeRequestMessage.type = (0, messageType_1.parseMessageType)('https://didcomm.org/didexchange/1.0/request');
__decorate([
    (0, messageType_1.IsValidMessageType)(DidExchangeRequestMessage.type),
    __metadata("design:type", Object)
], DidExchangeRequestMessage.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DidExchangeRequestMessage.prototype, "label", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'goal_code' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DidExchangeRequestMessage.prototype, "goalCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DidExchangeRequestMessage.prototype, "goal", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DidExchangeRequestMessage.prototype, "did", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'did_doc~attach' }),
    (0, class_transformer_1.Type)(() => Attachment_1.Attachment),
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", Attachment_1.Attachment)
], DidExchangeRequestMessage.prototype, "didDoc", void 0);
exports.DidExchangeRequestMessage = DidExchangeRequestMessage;
//# sourceMappingURL=DidExchangeRequestMessage.js.map