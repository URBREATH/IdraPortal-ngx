import { DCATDataset } from "./dcatdataset";
import { SearchFacetsList } from "./search-facets-list";

export class SearchResult {
    count?: number;
    results?: DCATDataset[];
    facets?: SearchFacetsList[];

    constructor(){}
}