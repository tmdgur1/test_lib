"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportService = void 0;
const constants_1 = require("../constants");
const error_1 = require("../error");
const plugins_1 = require("../plugins");
let TransportService = class TransportService {
    constructor() {
        this.transportSessionTable = {};
    }
    saveSession(session) {
        this.transportSessionTable[session.id] = session;
    }
    findSessionByConnectionId(connectionId) {
        return Object.values(this.transportSessionTable).find((session) => (session === null || session === void 0 ? void 0 : session.connectionId) === connectionId);
    }
    setConnectionIdForSession(sessionId, connectionId) {
        const session = this.findSessionById(sessionId);
        if (!session) {
            throw new error_1.AriesFrameworkError(`Session not found with id ${sessionId}`);
        }
        session.connectionId = connectionId;
        this.saveSession(session);
    }
    hasInboundEndpoint(didDocument) {
        var _a;
        return Boolean((_a = didDocument.service) === null || _a === void 0 ? void 0 : _a.find((s) => s.serviceEndpoint !== constants_1.DID_COMM_TRANSPORT_QUEUE));
    }
    findSessionById(sessionId) {
        return this.transportSessionTable[sessionId];
    }
    removeSession(session) {
        delete this.transportSessionTable[session.id];
    }
};
TransportService = __decorate([
    (0, plugins_1.injectable)()
], TransportService);
exports.TransportService = TransportService;
//# sourceMappingURL=TransportService.js.map