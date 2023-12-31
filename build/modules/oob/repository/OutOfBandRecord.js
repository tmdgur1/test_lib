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
exports.OutOfBandRecord = void 0;
const class_transformer_1 = require("class-transformer");
const error_1 = require("../../../error");
const BaseRecord_1 = require("../../../storage/BaseRecord");
const uuid_1 = require("../../../utils/uuid");
const messages_1 = require("../messages");
class OutOfBandRecord extends BaseRecord_1.BaseRecord {
    constructor(props) {
        var _a, _b, _c, _d;
        super();
        this.type = OutOfBandRecord.type;
        if (props) {
            this.id = (_a = props.id) !== null && _a !== void 0 ? _a : (0, uuid_1.uuid)();
            this.createdAt = (_b = props.createdAt) !== null && _b !== void 0 ? _b : new Date();
            this.outOfBandInvitation = props.outOfBandInvitation;
            this.role = props.role;
            this.state = props.state;
            this.alias = props.alias;
            this.autoAcceptConnection = props.autoAcceptConnection;
            this.reusable = (_c = props.reusable) !== null && _c !== void 0 ? _c : false;
            this.mediatorId = props.mediatorId;
            this.reuseConnectionId = props.reuseConnectionId;
            this._tags = (_d = props.tags) !== null && _d !== void 0 ? _d : { recipientKeyFingerprints: [] };
        }
    }
    getTags() {
        return Object.assign(Object.assign({}, this._tags), { role: this.role, state: this.state, invitationId: this.outOfBandInvitation.id, threadId: this.outOfBandInvitation.threadId });
    }
    assertRole(expectedRole) {
        if (this.role !== expectedRole) {
            throw new error_1.AriesFrameworkError(`Invalid out-of-band record role ${this.role}, expected is ${expectedRole}.`);
        }
    }
    assertState(expectedStates) {
        if (!Array.isArray(expectedStates)) {
            expectedStates = [expectedStates];
        }
        if (!expectedStates.includes(this.state)) {
            throw new error_1.AriesFrameworkError(`Invalid out-of-band record state ${this.state}, valid states are: ${expectedStates.join(', ')}.`);
        }
    }
}
OutOfBandRecord.type = 'OutOfBandRecord';
__decorate([
    (0, class_transformer_1.Type)(() => messages_1.OutOfBandInvitation),
    __metadata("design:type", messages_1.OutOfBandInvitation)
], OutOfBandRecord.prototype, "outOfBandInvitation", void 0);
exports.OutOfBandRecord = OutOfBandRecord;
//# sourceMappingURL=OutOfBandRecord.js.map