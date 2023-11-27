import { Component, OnInit } from '@angular/core';
import { ConfigService } from '@ngx-config/core';

class Card {
  url: string; //url link
  title: string; //application name
  image: string; //path into assets
  description: string; //application description
  responsible_partner?:string;
  subtitle?:string;
  avatar?:string;

  constructor(init?: Partial<Card>) {
    Object.assign(this, init);
  }

}

@Component({
  selector: 'ngx-card-links',
  templateUrl: './card-links.component.html',
  styleUrls: ['./card-links.component.scss']
})
export class CardLinksComponent implements OnInit {

  constructor(private configService: ConfigService) { }

  cards = Array<Card>();

  ngOnInit(): void {
    this.cards = this.configService.getSettings("external-application-cards");
    console.log(this.cards)
  }

}
