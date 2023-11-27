# IdraPortal - ngx-admin 
This repository contains IdraPortal UI Template. This template is built starting from [NGX-Admin](https://akveo.github.io/ngx-admin/), an open source dashboard based on [Angular](https://angular.io/), [Nebular](https://akveo.github.io/nebular/) with [Eva Design System](https://eva.design/).

## Table of Contents
- [UI Template](#IdraPortal-ngx)
  - [Table of Contents](#table-of-contents)
  - [Requirements](#requirements)
  - [Install](#install)
  - [Build & Deploy](#build--deploy)
  - [Docker](#docker)
    - [Docker-compose](#docker-compose)
  - [Development](#development)
    - [Create a Module](#create-a-module)
    - [Create a Component](#create-a-component)
    - [Create a Service](#create-a-service)
    - [Manage Routing](#manage-routing)
      - [IdraPortal-ngx routing](#urbanite-ui-routing)
      - [Module routing](#module-routing)
    - [Add Sidebar entry](#add-sidebar-entry)
    - [Run the template](#run-the-template)


## Requirements
To properly install and start the template, the following tools should be installed:
- Git
- Npm
- [Angular CLI](https://cli.angular.io/)

## Install
To properly install the template, follow these steps:

```bash
$ git clone https://github.com/OPSILab/IdraPortal-ngx.git
$ cd IdraPortal-ngx
$ npm install
```

## Build & Deploy
To build and deploy the template, follow these steps:

```bash
$ cd IdraPortal-ngx
$ ng build --prod
```

This command generates a **dist** folder within the *IdraPortal-ngx* folder.
To properly deploy the application, the content of the **dist** folder should be placed within a server for instance: [Nginx](https://www.nginx.com/) or [Apache HTTP Server](https://httpd.apache.org/).

Please, refer to the official documentation for furhter details:
- [Angular basic deployment to a remote server](https://angular.io/guide/deployment#basic-deployment-to-a-remote-server)
- [Server configuration](https://angular.io/guide/deployment#server-configuration)

## Docker

Build docker image:

```bash
$ cd IdraPortal-ngx
$ docker build -t <repo>/<imageName> .
```

Run docker image:

```bash
$ cd IdraPortal-ngx
$ docker run -it -p 80:80 <repo>/<imageName>
```

### Docker-compose

The provided **docker-compose.yml** build and deploy the application with an instance of the IDM (Keycloak).

Run the following command to use the docker-compose:

```bash
$ cd IdraPortal-ngx
$ docker-compose up
```

## Development

This section summarizes the basic commands and configurations needed to integrate a new tool into the IdraPortal-ngx.

It is suggested to fork the repository or to create a specific branch for any new tool to be integrated.

### Create a Module

An [Angular module](https://angular.io/guide/architecture-modules) should be created, for any new tool to be integrated.
To properly create a new module, execute the following command:

```bash
$ cd IdraPortal-ngx
$ ng generate module pages/<MODULE_NAME> --routing
```

Replace *<MODULE_NAME>* with the name of the new module.

This command will generate a new folder within the **pages** folder with the specific module and routing files. 
The routing file is mandatory if the new module is expected to contain more than one [components](#create-a-component).

### Create a Component

An [Angular component](https://angular.io/guide/architecture-components) manages the views.
At least a component should be created for any new tool to be integrated.
To create a new component, execute the following command:

```bash
$ cd IdraPortal-ngx
$ ng generate component pages/<MODULE_FOLDER>/<COMPONENT_NAME>
```
Replace *<MODULE_FOLDER>* with the path of the folder to the new module.
Replace *<COMPONENT_NAME>* with the name of the new component.
This command will generate a new folder within the **pages/<MODULE_FOLDER>** folder with the component details. 

### Create a Service

An [Angular service](https://angular.io/guide/architecture-services) is used, for instance, to build a REST client.
To create a new service, execute the following command:

```bash
$ cd IdraPortal-ngx
$ ng generate service pages/<MODULE_FOLDER>/<SERVICE_NAME>
```

Replace *<MODULE_FOLDER>* with the path of the folder to the new module.
Replace *<SERVICE_NAME>* with the name of the new service.

Please, refer to the angular official [documentation](https://angular.io/guide/http#communicating-with-backend-services-using-http) to build a REST client.

### Manage Routing

To visualize the content for any new module the developer needs to manage routing.
In the IdraPortal-ngx there are two levels of routing:
- [IdraPortal-ngx routing](#urbanite-ui-routing)
- [Module routing](#module-routing)

Refer to the official [routing documentation](https://angular.io/guide/router) for additional details.

#### IdraPortal-ngx routing

To allow the a module to be accessed, the developer should open the ***IdraPortal-ngx/src/app/pages/pages-routing.module.ts*** file with the configured IDE and add the following entry:

```typescript
const routes: Routes = [{
  path: '',

  component: PagesComponent,
  children: [
    {
      path: 'home',
      loadChildren: () => import('./home/home.module')
        .then(m => m.HomeModule),
    },
    ...
    {
      path: '<module>',
      loadChildren: () => import('./<MODULE_FOLDER>/<MODULE_NAME>.module')
        .then(m => m.<MODULE_NAME>),
    },
    ...
```

The **path** represents how the module will be accessible through the browser url.
Replace *<MODULE_FOLDER>* and *<MODULE_NAME>* with the specific values.

#### Module routing

To allow to access the components defined within each module, the developer should open and edit the ***IdraPortal-ngx/src/app/pages/<MODULE_FOLDER>/<MODULE_ROUTING>.module.ts***

Please, replace *<MODULE_FOLDER>* and *<MODULE_ROUTING>* with the corresponding paths.

```typescript
const routes: Routes = [{
  path: '',
  children: [{
    path: '<COMPONENT_1_URL>',
    component: <COMPONENT_1>,
  },
  {
    path: '<COMPONENT_2_URL>',
    component: <COMPONENT_2>,
  },
  ...
  ],
}];
```

Each **path**, of the above, represents how the component will be accessible through the browser url.
The **component** is the component name created within the module.

### Add Sidebar entry

To add a sidebar entry, the developer should open and edit the ***IdraPortal-ngx/src/app/pages/pages-menu.ts*** and add the following entry:

```typescript
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
  ...
  {
    title: '<MODULE_TITLE>',
    icon: '<MODULE_ICON>',
    link: "/pages/<MODULE>",
    data:{
      name:"<MODULE>"
    }
  },
  ...
```

The **title** is the label that would be added to the sidebar.
Replace in the **link** and in the **name** the value defined for the **path** variable on [IdraPortal-ngx routing](#urbanite-ui-routing).
About the icon, please select an icon among the [following](https://akveo.github.io/eva-icons/#/) and put its identifier.

### Run the template

To start the application, follow these steps:
```
cd IdraPortal-ngx
ng serve
```
The application will be available at http://localhost:4200

