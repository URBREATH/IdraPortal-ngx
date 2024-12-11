import { ODMSCatalogueImage } from "./odmscatalogue-image";
import { ODMSCatalogueType } from "./odmscatalogue-type.enum";


export class ODMSCatalogueNode {
    id: string;
    name:string;
    section: string;
      phoneNumber: string;

    publisherName: string;
    nameInvalid:boolean;
    pubNameInvalid:boolean;
    nodeType:ODMSCatalogueType;
    federationLevel:string;
    host:string;
    hostInvalid:boolean;
    homepage:string;
    homepageInvalid:boolean;
    refreshPeriod:string;
    description:string;
    APIKey: string;
    communities : string;
    location:string;
    locationDescription:string;
    dcatProfile:string;
    image:{
        imageData:string;
    };
    sitemap:{};
    dumpURL:string;
    dumpFilePath:null;
    dumpString:string;
    country:string;
    category:string;
    isActive:true;
    additionalConfig : {
        ngsild:null;
        isAuthenticated:null;
        authToken:null;
        refreshToken:null;
        clientID:null;
        clientSecret:null;
        oauth2Endpoint:null;
        orionDatasetDumpString:null;
            sparqlDatasetDumpString:null
        };
    synchLock : string;
    nodeState : string;
    datasetCount : number;
    registerDate : Date;
    lastUpdateDate : Date;
    inserted : boolean

    constructor() { }
}