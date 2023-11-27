import { DCTLicenseDocument } from "./dctlicense-document";
import { DCTStandard } from "./dctstandard";
import { SKOSConcept } from "./skosconcept";
import { SPDXChecksum } from "./spdxchecksum";

export class DCATDistribution {
  id: string;
  storedRDF?: boolean;
  nodeID: string;
  accessURL: string;
  description?: string;
  format?: string;
  license?: DCTLicenseDocument;
  byteSize?: string;
  checksum?: SPDXChecksum;
  documentation?: string[];
  downloadURL?: string;
  language?: string[];
  linkedSchemas?: DCTStandard[];
  mediaType?: string;
  releaseDate?: string;
  updateDate?: string;
  rights?: string;
  status?: SKOSConcept;
  title?: string;
  hasDatalets?: boolean;

  constructor(){}
}