'use strict';

angular.module('fccuserlistApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.campers = [];
    $scope.onRecentPage = true;

    $scope.getDataRecent = function() {

      $scope.recentActivity = "recent activity from ";
      $scope.onRecentPage = true;
      $http.get('/api/fccusers/top100/recent').success(function(campers) {
         $scope.campers = campers;
      });
    };

    $scope.getDataAlltime = function() {
       $scope.onRecentPage = false;
       $http.get('/api/fccusers/top100/alltime').success(function(campers) {
         $scope.campers = campers;
       });
    };

    $scope.refreshUser = function(username) {
      $http.get('/api/fccusers/update/'+username).success(function() {
        setTimeout(function() {
            if ($scope.onRecentPage) {
              $scope.getDataRecent();
            }
            else {
              $scope.getDataAlltime();
            }
            $scope.$apply();
        }, 3000);
      });
    };

    $scope.getDataRecent();

  });
