import { Component, OnInit } from '@angular/core';
import { NbAccessChecker } from '@nebular/security';
import { OwlOptions } from 'ngx-owl-carousel-o';

@Component({
  selector: 'ngx-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  customOptions: OwlOptions = {
    loop: true,
    autoplay:true,
    autoHeight:true,
    autoWidth:true,
    dots:false,
    center:true,
    responsive: {
      0: {
        items:1
      },
      500: {
        items:1
      },
      1000: {
        items:1
      }
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

}
