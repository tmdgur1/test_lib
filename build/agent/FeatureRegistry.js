"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureRegistry = void 0;
const tsyringe_1 = require("tsyringe");
let FeatureRegistry = class FeatureRegistry {
    constructor() {
        this.features = [];
    }
    /**
     * Register a single or set of Features on the registry
     *
     * @param features set of {Feature} objects or any inherited class
     */
    register(...features) {
        for (const feature of features) {
            const index = this.features.findIndex((item) => item.type === feature.type && item.id === feature.id);
            if (index > -1) {
                this.features[index] = this.features[index].combine(feature);
            }
            else {
                this.features.push(feature);
            }
        }
    }
    /**
     * Perform a set of queries in the registry, supporting wildcards (*) as
     * expressed in Aries RFC 0557.
     *
     * @see https://github.com/hyperledger/aries-rfcs/blob/560ffd23361f16a01e34ccb7dcc908ec28c5ddb1/features/0557-discover-features-v2/README.md
     *
     * @param queries set of {FeatureQuery} objects to query features
     * @returns array containing all matching features (can be empty)
     */
    query(...queries) {
        const output = [];
        for (const query of queries) {
            const items = this.features.filter((item) => item.type === query.featureType);
            // An * will return all features of a given type (e.g. all protocols, all goal codes, all AIP configs)
            if (query.match === '*') {
                output.push(...items);
                // An string ending with * will return a family of features of a certain type
                // (e.g. all versions of a given protocol, all subsets of an AIP, etc.)
            }
            else if (query.match.endsWith('*')) {
                const match = query.match.slice(0, -1);
                output.push(...items.filter((m) => m.id.startsWith(match)));
                // Exact matching (single feature)
            }
            else {
                output.push(...items.filter((m) => m.id === query.match));
            }
        }
        return output;
    }
};
FeatureRegistry = __decorate([
    (0, tsyringe_1.injectable)()
], FeatureRegistry);
exports.FeatureRegistry = FeatureRegistry;
//# sourceMappingURL=FeatureRegistry.js.map