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
    title: 'Data Catalogue',
    icon: 'search-outline',
    link: "/pages/datasets",
    data:{
      name:"catalogues"
    }
  },
  {
    title: 'Catalogues',
    icon: 'list-outline',
    link: "/pages/catalogues",
    data:{
      name:"catalogues"
    }
  },
  {
    title: 'Statistics',
    icon: 'pie-chart-outline',
    link: "/pages/statistics",
    data:{
      name:"statistics"
    }
  },
  {
    title: 'Mqa Scoring',
    icon: 'bar-chart-outline',
    link: "/pages/mqa",
    data:{
      name:"mqa"
    },
    hidden: true,
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
    ],
    data:{
      name:'administration'
    },
    hidden: true,
  },

];
