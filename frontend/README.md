# Angular

This project was generated with
[Angular CLI](https://github.com/angular/angular-cli) version 10.0.3.

## New RadioK Angular version.

It turned out that it was impossible to move incrementally from the original AngularJs based version to a new Angular version. So the decision was made to start from scratch.

### Installation

It is possible to build the application from scratch by following the instructions provided in the Angular [documentation](https://angular.io/guide/setup-local) and by carrying out the steps described below.
But it is easier to start from the content in this github repository : it has to be cloned locally and updated.

#### Starting from scratch

Here are the first steps made to build progressively the new version from scratch. It is a sort of guide line to follow when developping a new application. Since the Angular framework is pretty complex to master it is good to keep track of what has to be done and in which order.

The angular module of this application is 'app'
```
npm install -g @angular/cli
edit tsconfig.json
ng new webui
ng add @ng-bootstrap/ng-bootstrap
npm install bootswatch
```
The chosen theme is [journal](https://bootswatch.com/journal/)

#### In directory webui

Check and possibly update the json files.

#### In directory src

Check and edit the topmost files :

```
app.component.html
app.component.scss
app.component.ts
app.module.ts
```

```
ng generate component station
```
```
ng generate component radio
cd radio
ng generate interface radio
ng generate service radio
```

```
ng generate component trigger
cd trigger
ng generate interface trigger
ng generate service trigger
ng generate service scheduler
```

#### Installing from the github repository

Once enough code has been pushed to the github repository it is possible to pull the existing content and start working on another computer. On a regular basis the local copies can be synchonized by pushing and pulling from the remote repository.

```
git clone git@github.com:jplf/radiok.git
cd radiok/www/webui
npm install -g @angular/cli
npm install
```

#### Configuration

Read advice about the [runtime configuration](https://www.tektutorialshub.com/angular/angular-runtime-configuration/) of an Angular app.

```
edit app.module.ts to import APP_INITIALIZER
ng generate service config
edit app.component.ts to inject the config service
possibly define a local configuration in environments/environment.ts
edit assets/radiok-conf.json or assets/local-conf.json
```


## The backend server

The backend server developed for [RadioG](https://github.com/jplf/radiog/tree/master/backend) is reused.

## Running the app

```
ng serve --host $HOSTNAME --port 18200
```
## Miscellaneous

#### Comments

I spent some time trying to figure out how to implement some features since the learning curve for Angular is not short.
Here are some issues :

* How to get the result of a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) eventually
* Initialisation using [APP_INITIALIZER](https://dzone.com/articles/how-to-use-the-app-initializer-token-to-hook-into)
* Choosing constructor() vs NgOnInit() [methods](https://indepth.dev/the-essential-difference-between-constructor-and-ngoninit-in-angular/)
* Typescript getter and setter [syntax](https://www.typescriptlang.org/docs/handbook/classes.html#accessors)


#### Running unit tests (not yet ready)

Run `ng test` to execute the unit tests via
[Karma](https://karma-runner.github.io).

#### Running end-to-end tests (not yet ready)

Run `ng e2e` to execute the end-to-end tests via
[Protractor](http://www.protractortest.org/).

### Further help

To get more help on the Angular CLI use `ng help` or go check out the
[Angular CLI README]
(https://github.com/angular/angular-cli/blob/master/README.md).
