import { IDMRoles } from './idmroles';

export class IDMUser {
    id:string;
    username:string;
    roles:Array<IDMRoles>=[];
    role?:string="";
    image?:string=null;
    email:string;
    displayName:string;

    constructor(init?: Partial<IDMUser>) {
        Object.assign(this, init);

        if(this.roles.length!=0){
            for(let i=0; i<this.roles.length; i++){
                console.log(i+" "+this.roles[i].name)
                this.role += this.roles[i].name;

                if(i!=this.roles.length-1)
                    this.role+=" - ";
            }
        }else{
            this.role = "GUEST";
        }

        console.log(this.role)
    }
}
