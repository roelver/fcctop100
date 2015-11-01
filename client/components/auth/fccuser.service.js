'use strict';

angular.module('fccuserlistApp')
  .factory('Fccuser', function ($resource) {
    return $resource('/api/fccusers/:id', {
      id: '@username'
    },
    {
      get: {
        method: 'GET',
        params: {
          id:'me'
        }
      }
	  });
  });
