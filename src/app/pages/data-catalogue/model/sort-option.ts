import { SortMode } from "./sort-mode.enum";

export class SortOption {
    field?: string = 'id';
    mode?: SortMode = SortMode.Asc;

    constructor(){}
}