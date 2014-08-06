//__________________________________________________________________________
/**
 * Fonteny javascript library - March 2014

 * This software is governed by the
 * Gnu general public license (http://www.gnu.org/licenses/gpl.html)

 * This is a module running on the client and
 * managing operations on the server side.
 * @author Jean-Paul Le Fèvre <lefevre@fonteny.org>
 */
//__________________________________________________________________________

"use strict";

/**
 * This an AngularJS module
 * @see http://angularjs.org/
 */
var mainModule = angular.module('main-module', ['ui.bootstrap', 'ui.slider']);

angular.module('main-module')
    .constant('version',
              {'release': '1.2',
               'date':    '06 August 2014'
              })
/**
 * The routing configuration
 */
    .config(function ($routeProvider, $locationProvider) {

        console.log('Main module configuration');
        $locationProvider.html5Mode(true);

        $routeProvider
            .when('/', {
                templateUrl: '/home.html'
            })
            .when('/state', {
                templateUrl: '/state.html'
            })
            .when('/trigger', {
                templateUrl: '/trigger.html'
            })
            .otherwise({
                redirectTo: '/home.html'
            });
    })
//__________________________________________________________________________
/**
 * Prepares the main page.
 * Initializes the list of radio stations; checks the status of the box.
 */
    .controller('MainCtrl',
     ['$rootScope', '$scope', '$http', 'version',
      function($rootScope, $scope, $http, version) {

          $scope.header = 'Radio Box Kontrol';
          console.log('MainCtrl version:', version.release, version.date);
          $rootScope.version = 'Version ' + version.release
                         + ' - ' + version.date;

          // Fetch the list of radio stations from the server.
          $http.get('/box/stations')
              .success(function(data) {
                  $scope.stations = data;
              })
              .error(function(data) {
                  console.log('Get stations error:', data);
              })

          // Fetches information about the radio
          // Which station, is it playing or not ?
          $http.get('/box/status')
              .success(function(data) {
                  // Should be something like "a-fip, 1789"
                  console.log("Status: " + data.status);
                  var strings = data.status.split(',');

                  // Something went wrong
                  if (strings.length != 2) {
                      $rootScope.stationName = "Undefined";
                      $rootScope.stationKey  = "unknown";
                      $rootScope.running     = false;
                      $rootScope.onOff       = "?";
                      return;
                  }

                  // Get rid of white spaces
                  strings[0] = strings[0].trim();
                  strings[1] = strings[1].trim();

                  // Lookup the index of the current station
                  var stationIdx = -1;

                  for (var i=0; i <$scope.stations.length; i++) {
                      if ($scope.stations[i].key === strings[0]) {
                          stationIdx = i;
                          break;
                      }
                  }

                  // Is the station found or not ?
                  if (stationIdx < 0) {
                      // Wtf ?
                      $rootScope.stationName = "Undefined";
                      $rootScope.stationKey  = "unknown";
                      $rootScope.onOff       = "?";
                  }
                  else {
                      // Got it !
                      $scope.stationIdx  = stationIdx;
                      $rootScope.stationName = $scope.stations[stationIdx].name;
                      $rootScope.stationKey  = $scope.stations[stationIdx].key;
                  }

                  $rootScope.running = (strings[1] != '0');
                  if ($rootScope.running) {
                      $rootScope.onOff = "Off";
                  }
                  else {
                       $rootScope.onOff = "On";
                  }

              })
              .error(function(data) {
                  // Status was not guessed from the server
                  $rootScope.stationName = "Undefined";
                  $rootScope.stationKey  = "unknown";
                  $rootScope.running     = false;
                  $rootScope.onOff       = "?";
             });
      }])
//__________________________________________________________________________

    .controller('OnOffCtrl',
     ['$rootScope', '$scope', '$http',
      function($rootScope, $scope, $http) {

          $scope.setOnOff = function() {

              var arg = '-h';
              if ($rootScope.running) {
                  console.log('Stopping ' + $rootScope.stationName);
                  $rootScope.running = false;
                  $rootScope.onOff   = "On";
                  arg = '-k';
              }
              else {
                  console.log('Starting ' + $rootScope.stationName);
                  $rootScope.running = true;
                  $rootScope.onOff   = "Off";
                  arg = $rootScope.stationKey;
              }
              
              $http.get('/box/start/' + arg)
                  .success(function(data) {
                      if (arg === '-k') {
                          console.log('Radio stopped ');
                      }
                      else {
                          console.log($rootScope.stationKey + ' started ');
                      }
                  })
                  .error(function(data) {
                      console.log("Error when starting radio: " + data);
                  });
              }
      }])
//__________________________________________________________________________

    .controller('TuneCtrl',
     ['$rootScope', '$scope', '$http', 
      function($rootScope, $scope, $http) {

          $rootScope.message = null;
          $scope.selectRadio = function(index) {
              
              console.log('Station ' + index + ' selected');

              // No change
              if ($rootScope.stationKey === $scope.stations[index].key) {
                  return;
              }


              $rootScope.stationKey  = $scope.stations[index].key;
              $rootScope.stationName = $scope.stations[index].name;

              // Stop the running radio if any
              if ($rootScope.running) {
                  $http.get('/box/start/-k')
                      .success(function(data) {

                          console.log('Radio stopped');
                          $rootScope.running = false;
                          $rootScope.onOff   = "On";

                          $http.get('/box/start/' + $rootScope.stationKey)
                              .success(function(data) {
                                  $rootScope.running = true;
                                  $rootScope.onOff   = "Off";
                                  console.log(
                                      $rootScope.stationKey + ' started ');
                              })
                              .error(function(data) {
                                  console.log(
                                      "Error when starting radio: " + data);
                              });
                      })
                      .error(function(data) {
                          console.log("Error when stopping radio: " + data);
                      });
              }
          };
      }])
//__________________________________________________________________________

    .controller('VolumeCtrl', ['$rootScope', '$scope', '$http', 
      function($rootScope, $scope, $http) {

          $rootScope.message = null;

          $http.get('/box/get_volume')
              .success(function(data) {
                  $scope.volume = data; 
              })
              .error(function(data) {
                  console.log("Error when getting volume value: " + data);
              });

          $scope.setVolume = function() {
              console.log("Setting volume to: " + $scope.volume);

              $http.get('/box/set_volume/' + $scope.volume)

                  .success(function(data) {
                      console.log("Volume set to: " + $scope.volume);
                  })
                  .error(function(data) {
                      console.log("Error when setting volume value !");
                  });
          };
     }])
//__________________________________________________________________________

    .controller('StateCtrl', ['$rootScope', '$scope', '$http', 
      function($rootScope, $scope, $http) {

          $rootScope.message = null;

          $http.get('/box/get_state')
              .success(function(data) {

                  $scope.state = data; 
              })
              .error(function(data) {
                  console.log("Error when getting state: " + data);
              });
     }])
//__________________________________________________________________________
/**
 * Manages the cronjob on the server.
 */
    .controller('TriggerCtrl', ['$rootScope', '$scope', '$http',
      function($rootScope, $scope, $http) {

          $rootScope.message = null;

          $http.get('/box/cronjob')
              .success(function(data) {

                  $scope.triggerTime = new Date();
                  
                  $scope.triggerTime.setHours(data.hour);
                  $scope.triggerTime.setMinutes(data.minute);

                  $scope.alarm = data.set;
                  if (data.set) {
                      $scope.setUnset = "Set";
                  }
                  else {
                      $scope.setUnset = "Unset";
                  }

                  $scope.cronjob='On server ' + data.hour + ':' + data.minute
                      + ' ' + $scope.setUnset;

              })
              .error(function(data) {
                  console.log("Error when getting cron state: " + data);
                  $rootScope.message = "Can't get cron state";
                  $scope.cronjob='On server ?';
              });

          $scope.toggle = function() {
              if ($scope.alarm) {
                  $scope.alarm    = false;
                  $scope.setUnset = "Unset";
              }
              else {
                  $scope.alarm    = true;
                  $scope.setUnset = "Set";
              }
          }

          $scope.validate = function() {

              var h  = $scope.triggerTime.getHours();
              var m  = $scope.triggerTime.getMinutes();
              var on = $scope.alarm;

              $http.get('/box/trigger/' + h + '/' + m + '/' + on)
                  .success(function(data) {

                      $rootScope.message="Cronjob successfully updated !";
                      var s;
                      if (data.set) {
                          s = "Set";
                          $scope.setUnset = "Unset";
                      }
                      else {
                          s = "Unset";
                          $scope.setUnset = "Set";
                     }

                      $scope.cronjob='On server '
                          + data.hour + ':' + data.minute + ' ' + s;

                  })
                  .error(function(data) {
                      console.log("Error when setting cronjob: " + data);
                      $rootScope.message = "Can't update cronjob !";
                  });
          }
     }])
;
//__________________________________________________________________________
