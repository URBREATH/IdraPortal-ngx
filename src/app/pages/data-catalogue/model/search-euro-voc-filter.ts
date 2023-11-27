import { EuroVocLanguage } from "./euro-voc-language";

export class SearchEuroVocFilter {
    euroVoc?: boolean=false;
    sourceLanguage?: EuroVocLanguage;
    targetLanguages?: EuroVocLanguage[];

    constructor() { }
}
