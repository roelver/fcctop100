'use strict';

angular.module('fccuserlistApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.campers = [];

    $scope.getData = function() {
       $http.get('/api/fccusers/top100').success(function(campers) {
         $scope.campers = campers;
       });
    };

    $scope.refreshUser = function(username) {
      $http.get('/api/fccusers/update/'+username).success(function() {
        setTimeout(function() {
            $scope.getData();
            $scope.$apply();
        }, 2000);
       // $scope.getData();
      });
    };

    $scope.getData();

  });
