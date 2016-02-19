'use strict';

angular.module('fccuserlistApp')
  .controller('MainCtrl', [ '$scope', '$http', '$auth', '$location',
    function ($scope, $http, $auth, $location ) {
    $scope.campers = [];
    $scope.onRecentPage = true;
    $scope.showingFollowing = false;

    $scope.singleUser;

    $scope.me;

    $scope.notFound = false;

    $scope.isLoggedIn = $auth.isAuthenticated;

// Sorting the table
      $scope.predicate = 'totalRecent';

      $scope.reverse = true;
      $scope.order = function(predicate) {
        $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : true;
        $scope.predicate = predicate;
      };


    $scope.authenticate = function(provider) {
      $auth.authenticate(provider)
        .then($scope.getMe);
    };

    $scope.getMe = function(response) {
      $http.get('/auth/github/me')
        .success(function(data) {
          $scope.me = data;
      })
    };

    $scope.handleEnter = function($event){
      var keyCode = $event.which || $event.keyCode;
      if (keyCode === 13) {
         $scope.getUserRanking();
      }
    };

    $scope.getDataRecent = function() {

      $scope.recentActivity = "recent activity from ";
      $scope.singleUser = undefined;
      $scope.onRecentPage = true;
      $scope.showingFollowing = false;
      $http.get('/api/fccusers/top100/recent').success(function(campers) {
    //     $scope.order($scope.newPredicate());
         $scope.reverse = true;
         $scope.campers = campers;
      });
    };


    $scope.newPredicate = function() {
      if ($scope.predicate === 'username') return $scope.predicate;
      if ($scope.predicate === 'totalRecent') return 'total';
      if ($scope.predicate === 'total') return 'totalRecent';
      if ($scope.predicate === 'pointsRecent') return 'points';
      if ($scope.predicate === 'points') return 'pointsRecent';
      if ($scope.predicate === 'projectsRecent') return 'projects';
      if ($scope.predicate === 'projects') return 'projectsRecent';
      if ($scope.predicate === 'algorithmsRecent') return 'algorithms';
      if ($scope.predicate === 'algorithms') return 'algorithmsRecent';
      return 'totalRecent';
    };

    $scope.getDataFollowing = function() {

      $scope.recentActivity = "recent activity from ";
      $scope.onRecentPage = true;
      $scope.showingFollowing = true;
      $http.get('/api/fccusers/following/recent/'+$scope.me.username).success(function(campers) {
         $scope.campers = campers;
      });
    };

    $scope.getDataAlltime = function() {
       $scope.onRecentPage = false;
       $scope.singleUser = undefined;
       $scope.showingFollowing = false;
       $http.get('/api/fccusers/top100/alltime').success(function(campers) {
//         $scope.order($scope.newPredicate());
         $scope.reverse = true;
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

    $scope.followUser = function(username) {
      if (username === 'input') {
        $http.get('/api/fccusers/verify/username/'+$scope.username)
         .then(function(response) {
           var user = response.data;
           username = user.username;
           $http.put('/api/fccusers/follow/'+$scope.me.username+'/'+username).success(function() {
              $scope.getMe();
           }); 
        }, function(err) {
          $scope.notFound = true;
        });
      }
      else {
        $scope.notFound = false;
        $http.put('/api/fccusers/follow/'+$scope.me.username+'/'+username).success(function() {
              $scope.getMe();
        }); 
      }
    };

    $scope.unfollowUser = function(username) {
      if ($scope.showingFollowing) {
        for (var i=0;i<$scope.campers.length; i++) {
          if ($scope.campers[i].username === username) {
            $scope.campers.splice(i,1);
            break;
          }
        }
      }

      $http.put('/api/fccusers/unfollow/'+$scope.me.username+'/'+username).success(function() {
        $scope.getMe();
      });
    };

    $scope.isFollowing = function(username) {
      return ($scope.me && $scope.me.username !== username && $scope.me.following.indexOf(username) >= 0);
    };

    $scope.isNotFollowing = function(username) {
      return ($scope.me && $scope.me.username !== username && $scope.me.following.indexOf(username) < 0);
    };

    $scope.getUserRanking = function() {
		if (!$scope.username) return false;

		$scope.notFound = false;
      $http.get('/api/fccusers/ranking-'+($scope.onRecentPage?'r':'o')+'/'+$scope.username)
         .then(function(response) {
      		$scope.singleUser = response.data;
      }, function(err) {
      	$scope.notFound = true;
      });
    };

    if ($scope.isLoggedIn()) {
      $scope.getMe();
    }

    $scope.getDataRecent();

  }]);
