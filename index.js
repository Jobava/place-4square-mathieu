window.module = angular.module('FoursquareApp', ['WebApp', 'FoursquareService'])
	.directive('ngModelDelay', function($timeout) {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function(scope, elm, attr, ngModelCtrl) {
				if (attr.type === 'radio' || attr.type === 'checkbox') return;

				elm.unbind('input').unbind('keydown').unbind('change');
				
				var promise = null;
				
				elm.bind('input', function() {
					if(promise !== null) {
						$timeout.cancel(promise);
					}
					promise = $timeout(function() {
						promise = null;
						ngModelCtrl.$setViewValue(elm.val());
					}, 200, true);
				});
			}
		};
	})
	.config(function FoursquareAppRun(FoursquareProvider) {
		FoursquareProvider.config({
			clientId: location.hostname === 'place.texthtml.net' ? 'BPZJXWFV0BBYQTIC04N34Q2QIRKKULRQIGX0OVNWALFSNFEI' : 'KUSZIXIYTQ252MLOAXHMFTTQOSMJS14G544EJA3EKTRUVRB4', 
			clientSecret: location.hostname === 'place.texthtml.net' ? 'ZF3DCPSVCW4VZFTVUVOKRGXGMSLQWTXER24JS2BJATDKEMHI' : '2YKQWTLKJBYTE4ASWIGEZ5ERU4N3GN4AQCQ5P2O0SWVKBYFY', 
			redirectURI: document.location.href + '?authenticated'
		});
	})
	.controller('FoursquareApp', function FoursquareApp($scope, $rootScope, Foursquare) {
		$scope.fsq = Foursquare;
		
		$scope.setVenue = function(venue) {
			$rootScope.$broadcast('venue', venue);
		};
		
		$scope.$watch('fsq.logged', function(logged) {
			if(logged) {
				$scope.me = Foursquare.api.users();
			}
			else {
				delete $scope.me;
			}
		});
	})
	.controller('FoursquareHome', function FoursquareHome($scope, Foursquare) {
		$scope.loading = false;
		
		$scope.$watch('fsq.logged', function(logged) {
			$scope.checkins = [];
			if(logged) {
				$scope.loading = true;
				Foursquare.api.checkins.recent().then(function(response) {
					$scope.checkins = [];
					[].push.apply($scope.checkins, response.data);
					$scope.loading = false;
				});
			}
		});
	})
	.controller('FoursquareCheckin', function FoursquareCheckin($scope) {
		$scope.loading = false;
		$scope.$watch('checkin', function() {
			if(
				$scope.checkin !== undefined && 
				$scope.checkin.id !== undefined && 
				($scope.checkin.user === undefined || $scope.checkin.comments === undefined)
			) {
				$scope.loading = true;
				Foursquare.api.checkins({checkin_id: $scope.checkin.id}).then(function(response) {
					$scope.checkin = response.data;
					$scope.loading = false;
					$scope.replaceState();
				});
			}
		});
		
		$scope.posting = false;
		$scope.postComment = function() {
			if($scope.checkin.comments === undefined) {
				$scope.checkin.comments = {
					count: 1, 
					items: []
				}
			}
			var comment = {
				text: $scope.new_comment, 
				user: $scope.me, 
				createdAt: Date.now()/1000
			};
			
			var i = $scope.checkin.comments.items.push(comment) - 1;
			
			$scope.posting = true;
			Foursquare.api.checkins.addcomment({
				checkin_id: $scope.checkin.id, 
				text: $scope.new_comment
			}).then(function(response) {
				$scope.posting = false;
				$scope.new_comment = '';
				$scope.checkin.comments.items[i] = response.data;
				$scope.replaceState();
			});
		};
		
		$scope.checkingin = false;
		$scope.checkIn = function() {
			$scope.checkingin = true;
			$scope.checkin.shout = $scope.new_shout;
			$scope.checkin.createdAt = Date.now()/1000;
			
			var checkin = {
				venueId: $scope.checkin.venue.id, 
				shout: $scope.new_shout
			};
			
			Foursquare.api.checkins.add(checkin).then(function(response) {
				$scope.checkingin = false;
				$scope.new_shout = '';
				$scope.checkin = response.data.checkin;
				$scope.replaceState();
			});
		}
	})
	.controller('FoursquareSearch', function FoursquareSearch($scope, $timeout, $rootScope, Foursquare) {
		$scope.venues = [];
		$scope.geocode = {};
		$scope.loading = false;
		
		window.Foursquare = Foursquare;
		
		var search_venues = function() {
			var request = 0;
			
			return function() {
				if(request !== 0 && arguments[0] === arguments[1]) return;
				var request_id = ++request;
				
				if($scope.query !== undefined && $scope.query.length > 2) {
					$scope.loading = true;
					Foursquare.api.venues.search({
						query: $scope.query, 
						near: $scope.place
					}).then(function(response) {
						if(request !== request_id) return;
						
						$scope.loading = false;
						$scope.venues = [];
						[].push.apply($scope.venues, response.data.venues);
						$scope.geocode = response.data.geocode.feature;
					}, function() {
						if(request !== request_id) return;
						
						$scope.venues = [];
						$scope.geocode = false;
						$scope.loading = false;
					});
				}
				else {
					$scope.loading = false;
				}
			};
		} ();
		
		$scope.$watch('query', search_venues);
		$scope.$watch('place', search_venues);
	})
	.controller('FoursquareVenue', function FoursquareVenue($scope, $timeout, Foursquare) {
		$scope.loading = false;
		
		$scope.$watch('venue', function(venue) {
			if(venue !== undefined && venue.id !== undefined && venue.photos === undefined) {
				$scope.loading = true;
				Foursquare.api.venues({venueId: venue.id}).then(function(response) {
					$scope.venue = response.data;
					$scope.loading = false;
					$scope.replaceState();
				});
			}
			else {
				$scope.loading = false;
			}
		}, true)
	})
	.controller('FoursquareSettings', function FoursquareSettings($scope, Foursquare) {
	});
