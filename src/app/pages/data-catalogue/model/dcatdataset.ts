import { DCATDistribution } from "./dcatdistribution";
import { DCTLocation } from "./dctlocation";
import { DCTPeriodOfTime } from "./dctperiod-of-time";
import { DCTStandard } from "./dctstandard";
import { FOAFAgent } from "./foafagent";
import { SKOSConcept } from "./skosconcept";
import { VCardOrganization } from "./vcard-organization";

export class FormatCount{
  format:string;
  count:number=0;
  constructor(){}
}

export class DCATDataset {
  id: string;
  nodeID: string;
  title: string;
  description: string;
  distributions?: DCATDistribution[];
  theme?: SKOSConcept[];
  publisher?: FOAFAgent;
  contactPoint?: VCardOrganization[];
  keywords?: string[];
  accessRights?: string;
  conformsTo?: DCTStandard[];
  documentation?: string[];
  frequency?: string;
  hasVersion?: string[];
  isVersionOf?: string[];
  landingPage?: string;
  language?: string[];
  provenance?: string[];
  releaseDate?: string;
  updateDate?: string;
  identifier: string;
  otherIdentifier?: string[];
  sample?: string[];
  source?: string[];
  spatialCoverage?: DCTLocation;
  temporalCoverage?: DCTPeriodOfTime;
  type?: string;
  version?: string;
  versionNodes?: string[];
  rightsHolder?: FOAFAgent;
  creator?: FOAFAgent;
  subject?: SKOSConcept[];
  legacyIdentifier?: string;
  distributionFormats?: Array<FormatCount>=[];
  versionNotes?:string[];
  nodeName: any;
  constructor(){}
}