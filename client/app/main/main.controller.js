'use strict';

angular.module('fccuserlistApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.campers = [];

    $http.get('/api/fccusers/top100').success(function(campers) {
      $scope.campers = campers;
    });

  });
