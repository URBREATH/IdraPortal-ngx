import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'SERVICES',
    group: true,
  },
  {
    title: 'Home',
    icon: 'home-outline',
    link: "/pages/home",
    data:{
      name:"home"
    }
  },
  {
    title: 'Data Analysis',
    icon: 'bar-chart-2-outline',
    link: "/pages/tecnalia",
    data:{
      name:"tecnalia"
    },
    children: [
      {
        title: 'Traffic Prediction',
        link: '/pages/tecnalia/traffic',
      },
      {
        title: 'Bike Analysis',
        link: '/pages/tecnalia/bike',
      }
    ],
    hidden: true
  },
  {
    title: 'Data Catalogue',
    icon: 'search-outline',
    link: "/pages/datasets",
    data:{
      name:"catalogues"
    }
  },
  {
    title: 'Mqa Scoring',
    icon: 'bar-chart-outline',
    link: "/pages/mqa",
    data:{
      name:"mqa"
    }
  },
  {
    title: 'Administration',
    icon: 'settings-2-outline',
    children: [
      {
        title: 'Data Catalogue Administration',
		link: "/pages/administration/adminCatalogues",
        //url: '',
        //target: '_blank',
      },
      {
        title: 'Datalet Administration',
		link: "/pages/administration/dataletsManagement",
      },
	   {
        title: 'Configurations Administration',
		link: "/pages/administration/configuration",
      },
      {
        title: 'IDM Administration',
        url: '',
        target: '_blank',
        data:{
          name:'idm-administration'
        }
      }
    ],
    data:{
      name:'administration'
    }
  },
  {
    title: 'Maps',
    icon: 'map-outline',
    data:{
      name:"maps"
    },
    children: [
      {
        title: 'Amsterdam Tram Maps',
        link: '/pages/maps/leaflet',
      },
      {
        title: 'Amsterdam Tram Compare',
        link: '/pages/maps/single-map',
      }
    ],
    hidden: true
  },
  {
    title: 'Charts',
    icon: 'pie-chart-outline',
    data:{
      name:"charts"
    },
    children: [
      {
        title: 'Echarts',
        link: '/pages/charts/echarts',
      },
      {
        title: 'Charts.js',
        link: '/pages/charts/chartjs',
      },
      {
        title: 'D3',
        link: '/pages/charts/d3',
      },
    ],
    hidden: true
  },
  {
    title: 'Additional Applications',
    icon: 'external-link-outline',
    link: '/pages/external-app',
    data:{
      name:"external-app"
    },
    children: [
      {
        title: 'Card Links',
        link: '/pages/external-app/card-links',
      }
      // {
      //   title: 'Iframes',
      //   link: '/pages/external-app/iframes',
      // }
    ],
    hidden: true
  },
  {
    title: 'Urbanite Project',
    icon: 'info-outline',
    link: '/pages/about',
    data:{
      name:"about"
    },
    children: [{
      title:"About Urbanite",
      link:"/pages/about/info"
    }
  ],
  hidden: true
  },
  {
    title: 'UI Features',
    icon: 'keypad-outline',
    link: '/pages/ui-features',
    data:{
      name:"ui-features"
    },
    children: [
      {
        title: 'Grid',
        link: '/pages/ui-features/grid',
      },
      {
        title: 'Icons',
        link: '/pages/ui-features/icons',
      },
      {
        title: 'Typography',
        link: '/pages/ui-features/typography',
      }
    ],
    hidden: true
  },
  
];
