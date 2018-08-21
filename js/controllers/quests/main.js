app.controller('quests', function($scope, $http, categories) {
	$scope.init = function() {
		$scope.searchString = "";
		$scope.questsPerPage = 20;
		$scope.statOnly = false;
		$scope.catService = categories;

		categories.setSelectedCategory(getUrlParameter('eraId'));
		categories.setSelectedSubcategory(getUrlParameter('areaId'));
		$scope.searchString = getUrlParameter('search');

		$scope.getAreas();

		if (categories.hasSelectedCategory() || $scope.searchString) {
			$scope.search();
		}
		else {
			$scope.getRecentQuests();
		}

		$http({
			url: '/php/login/getLoggedInUser.php'
		}).then(function succcessCallback(response) {
			$scope.isLoggedIn = response.data.success;
		}, function errorCallback(response) {

		});
	}

	$scope.getAreas = function() {
		$http({
			url: '/php/mobs/getAreas.php'
		}).then(function succcessCallback(response) {
			var eras = [];
			var eraCount = 0;
			for (var i = 0; i < response.data.length; ++i) {
				if (!eras.includes(response.data[i].Era)) {
					eras[response.data[i].EraId] = response.data[i].Era;
				}
				response.data[i].CategoryId = response.data[i].EraId;
			}
			
			var eraCategories = [];
			for (var i = 1; i < eras.length; ++i) {
				eraCategories.push({Id: i, Name: eras[i]});
			}
			
			categories.setCategories(eraCategories);
			categories.setSubcategories(response.data);
		})
	}

	$scope.getRecentQuests = function() {
		$http({
			url: '/php/quests/getRecentQuests.php',
			method: 'POST'
		}).then(function succcessCallback(response) {
			$scope.quests = response.data;
			$scope.recent = true;

			$scope.totalPages = Math.floor(($scope.quests.length - 1) / $scope.questsPerPage) + 1;
			$scope.currentPage = 1;
		}, function errorCallback(response){

		});
	}

	$scope.search = function() {
		$http({
			url: '/php/quests/getQuests.php',
			method: 'POST',
			data: {"searchString": $scope.searchString, "statOnly": $scope.statOnly, "eraId": categories.getCategoryId(), "areaId": categories.getSubcategoryId()}
		}).then(function succcessCallback(response) {
			$scope.quests = response.data;
			$scope.recent = false;

			$scope.totalPages = Math.floor(($scope.quests.length - 1) / $scope.questsPerPage) + 1;
			$scope.currentPage = 1;
		}, function errorCallback(response){

		});
	}

	$scope.onSearchClicked = function() {
		var url = "/quests/index.html?";
		if (categories.hasSelectedCategory()) {
			url += "eraId=" + categories.getCategoryId() + "&";
		}

		if (categories.hasSelectedSubcategory()) {
			url += "areaId=" + categories.getSubcategoryId() + "&";
		}

		url += "search=" + $scope.searchString;
		window.location = url;
	}

	$scope.onPreviousClicked = function() {
		$scope.currentPage -= 1;
		if ($scope.currentPage < 1) {
			$scope.currentPage = 1;
		}
	}

	$scope.onNextClicked = function() {
		$scope.currentPage += 1;
		if ($scope.currentPage > $scope.totalPages) {
			$scope.currentPage = $scope.totalPages;
		}
	}

	$scope.onPageClicked = function(num) {
		$scope.currentPage = num;
	}

	$scope.onQuestClicked = function(item) {
		window.location = "/quests/details.html?id=" + item.Id;
	}

	$scope.onStatClicked = function() {
		$scope.statOnly = !$scope.statOnly;
	}

	$scope.getPageArray = function() {
		var nums = [];
		if ($scope.totalPages > 7) {
			var nums = [1];
			if ($scope.currentPage < 5) {
				nums.push(2, 3, 4, 5, 6);
			}
			else if ($scope.currentPage > $scope.totalPages - 3) {
				var digit = $scope.totalPages - 6;
				nums.push(++digit, ++digit, ++digit, ++digit, ++digit);
			}
			else {
				var digit = $scope.currentPage - 3;
				nums.push(++digit, ++digit, ++digit, ++digit, ++digit);
			}
			nums.push($scope.totalPages);
		}
		else {
			for (var i = 1; i <= $scope.totalPages; ++i) {
				nums.push(i);
			}
		}
		return nums;
	}

	getUrlParameter = function(name) {
		name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
		var results = regex.exec(location.search);
		return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
	};

	$scope.init();
});
