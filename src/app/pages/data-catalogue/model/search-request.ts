import { SearchDateFilter } from "./search-date-filter";
import { SearchEuroVocFilter } from "./search-euro-voc-filter";
import { SearchFilter } from "./search-filter";
import { SortOption } from "./sort-option";

export class SearchRequest {
  filters: Array<SearchFilter>=[new SearchFilter()];
  releaseDate?: SearchDateFilter;
  updateDate?: SearchDateFilter;
  live: boolean = false;
  euroVocFilter: SearchEuroVocFilter=new SearchEuroVocFilter();
  sort: SortOption=new SortOption();
  rows: number=20;
  start: number=0;
  nodes?: number[]=[];

  constructor(){}
}