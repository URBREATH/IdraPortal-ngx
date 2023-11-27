import { SKOSPrefLabel } from "./skospref-label";

export class SKOSConcept {
    id?: string;
    nodeID?: string;
    resourceUri?: string;
    propertyUri?: string;
    prefLabel?: SKOSPrefLabel[];

    constructor(){}
}