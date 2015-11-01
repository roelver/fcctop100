'use strict';

angular.module('fccuserlistApp')




  .factory('Auth', function Auth($location, $rootScope, $http, Fccuser, $cookieStore, $q) {
    var currentUser = {};
    console.log('Get token - Auth service')
    if($cookieStore.get('token')) {
      $http.get('/api/fccusers/me', function(err, data) {
        if (err) return err;
        currentUser = Fccuser.get();
      });
    }

    return {

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      login: function(callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();

        $http.get('/auth/github')
          .success(function(data) {
            $cookieStore.put('token', data.token);
            currentUser = Fccuser.get();
            deferred.resolve(data);
            return cb();
          })
          .error(function(err) {
             this.logout();
             deferred.reject(err);
             return cb(err);
           }.bind(this));

        return deferred.promise;
      },

      /**
       * Delete access token and user info
       *
       * @param  {Function}
       */
      logout: function() {
        $cookieStore.remove('token');
        currentUser = {};
      },

      /**
       * Gets all available info on authenticated user
       *
       * @return {Object} user
       */
      getCurrentUser: function() {
        return currentUser;
      },

      /**
       * Waits for currentUser to resolve before checking if user is logged in
       */
      isLoggedInAsync: function(cb) {
        console.log('isLoggedInAsync', currentUser);
        if(currentUser.hasOwnProperty('$promise')) {
          currentUser.$promise.then(function() {
            cb(true);
          }).catch(function() {
            cb(false);
          });
        } else if(currentUser.hasOwnProperty('username')) {
          cb(true);
        } else {
          cb(false);
        }
      },
/**
       * Check if a user is logged in
       *
       * @return {Boolean}
       */
      isLoggedIn: function() {
        return currentUser.hasOwnProperty('username');
      },

      /**
       * Get auth token
       */
      getToken: function() {
        return $cookieStore.get('token');
      }
    };
 });
;