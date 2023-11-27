export class SearchFilter {
    field: string='ALL';
    value: string="";

    constructor(field?:string,value?:string){
        this.field=(field!=undefined)?field:'ALL';
        this.value=(value!=undefined)?value:"";
    }
}