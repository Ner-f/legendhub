app.controller('builder', function($scope, $cookies, $http, itemConstants) {
	//#region ~~~~~~~~~ INITIALIZATION ~~~~~~~~~
	// constants
	$scope.initialize = function() {
		$scope.slots = itemConstants.selectShortOptions.Slot;
        $scope.selectShortOptions = itemConstants.selectShortOptions;

		$scope.itemsPerPage = 20;

		$scope.slotOrder = [0, 1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 11,12,13,13,14,15,15,16,16,17,18,19,20,21,21,21,21];
		$scope.longhouseList = ["Bear -- ( spi - min )",
								"Beaver -- ( min - dex )",
								"Eagle -- ( per - str )",
								"Moose -- ( str - con )",
								"Snake -- ( dex - per )",
								"Turtle -- ( con - spi )"];

		$scope.amuletList = ["Strength", "Mind", "Dexterity", "Constitution", "Perception", "Spirit"];

		// item searching vars
		$scope.searchString = "";
		$scope.currentItem = null;
		$scope.itemsBySlot = [];
		$scope.filteredItems = [];
		$scope.sortStat = "";
		$scope.sortDir = "";

		for (var i = 0; i < $scope.slots.length; ++i) {
			$scope.itemsBySlot[i] = [];
		}

		$scope.getStatCategories();
	}

	$scope.getStatCategories = function() {
		$http({
			url: '/php/items/getItemCategories.php'
		}).then(function succcessCallback(response) {
			$scope.statCategories = response.data;

			$scope.getStatInfo();
		}, function errorCallback(response){

		});
	}

	$scope.getStatInfo = function() {
		$http({
			url: '/php/items/getItemStats.php'
		}).then(function succcessCallback(response) {
			$scope.statInfo = response.data;
			$scope.defaultStatInfo = angular.copy(response.data);

			$scope.loadCookies();
		}, function errorCallback(response){
		});
	}

	$scope.getDefaultList = function(name) {
		list = {};
		list.Name = name;

		// base stats
		list.baseStats = {"Strength": 0, "Mind": 0, "Dexterity": 0, "Constitution": 0, "Perception": 0, "Spirit": 0, "Longhouse": -1, "Amulet": -1};

		// items
		list.items = [];
		for (var i = 0; i < $scope.slotOrder.length; ++i) {
			list.items.push({"Slot": $scope.slotOrder[i], "Name": "-"});
		}

		return list;
	}

	//#endregion

	//#region ~~~~~~~~~ SAVING / LOADING ~~~~~~~~~

	$scope.loadCookies = function() {
		// delete old cookies
		$cookies.remove("sc1", {"path": "/"});

		// load columns
		var columnCookie = $cookies.get("sc2");
		if (columnCookie) {
			// wipe initial values
			for (var i = 0; i < $scope.statInfo.length; ++i) {
				$scope.statInfo[i]["showColumn"] = false;
			}

			var columns = columnCookie.split("-");
			for (var i = 0; i < columns.length; ++i) {
				for (var j = 0; j < $scope.statInfo.length; ++j) {
					if (columns[i] == $scope.statInfo[j]["short"]) {
						$scope.statInfo[j]["showColumn"] = true;
					}
				}
			}
		}

		// load lists
		$scope.allLists = [];

		var listCookieStr = localStorage.getItem("cl");
		if (!listCookieStr) {
			listCookieStr = $cookies.get("cl1");
		}
		if (listCookieStr) {
			var listStrs = listCookieStr.split("*").filter(function(el) {return el.length != 0});;
			for (var i = 0; i < listStrs.length; ++i) {
				$scope.allLists.push({});

				var listStr = listStrs[i];
				var each = listStr.split("_");

				// name
				$scope.allLists[i].Name = each[0];
				each.shift();

				// base stats
				$scope.allLists[i].baseStats = {};
				$scope.allLists[i].baseStats.Strength = Number(each[0]);
				each.shift();

				$scope.allLists[i].baseStats.Mind = Number(each[0]);
				each.shift();

				$scope.allLists[i].baseStats.Dexterity = Number(each[0]);
				each.shift();

				$scope.allLists[i].baseStats.Constitution = Number(each[0]);
				each.shift();

				$scope.allLists[i].baseStats.Perception = Number(each[0]);
				each.shift();

				$scope.allLists[i].baseStats.Spirit = Number(each[0]);
				each.shift();

				$scope.allLists[i].baseStats.Longhouse = Number(each[0]);
				each.shift();

				$scope.allLists[i].baseStats.Amulet = Number(each[0]);
				each.shift();

				// items
				$scope.allLists[i].items = [];
				for (var j = 0; j < each.length; ++j) {
					$scope.allLists[i].items.push({"Id": Number(each[j]), "Slot": $scope.slotOrder[j]});
				}

				if (each.length < 29) {
					for (var k = 0; k < (29 - each.length); ++k) {
						$scope.allLists[i].items.push({"Id": Number(each[j]), "Slot": 21});
					}
				}
			}
		}
		if ($scope.allLists.length > 0) {
			var selectedListCookie = localStorage.getItem("scl");
			if (!selectedListCookie) {
				selectedListCookie = $cookies.get("scl1");
			}
			if (selectedListCookie) {
				var found = false;
				for (var i = 0; i < $scope.allLists.length; ++i) {
					if ($scope.allLists[i].Name == selectedListCookie) {
						$scope.selectedListIndex = i;
						found = true;
						break;
					}
				}

				if (!found) {
					$scope.selectedListIndex = 0;
				}
			}
			else {
				$scope.selectedListIndex = 0;
			}
		}
		else {
			$scope.allLists.push($scope.getDefaultList("Untitled"));
			$scope.selectedListIndex = 0;
		}
		$scope.selectList();
	}

	$scope.saveCookies = function() {
		// save columns
		var cookieDate = new Date();
		cookieDate.setFullYear(cookieDate.getFullYear() + 20);

		$savedColumns = "";
		for (var i = 0; i < $scope.statInfo.length; ++i) {
			if ($scope.statInfo[i]["showColumn"]) {
				$savedColumns += $scope.statInfo[i]["short"] + "-";
			}
		}
		$cookies.put("sc2", $savedColumns, {"path": "/", 'expires': cookieDate});

		// save lists
		listCookieStr = "";
		for (var i = 0; i < $scope.allLists.length; ++i) {
			listCookieStr += $scope.allLists[i].Name + "_";
			listCookieStr += $scope.allLists[i].baseStats.Strength + "_";
			listCookieStr += $scope.allLists[i].baseStats.Mind + "_";
			listCookieStr += $scope.allLists[i].baseStats.Dexterity + "_";
			listCookieStr += $scope.allLists[i].baseStats.Constitution + "_";
			listCookieStr += $scope.allLists[i].baseStats.Perception + "_";
			listCookieStr += $scope.allLists[i].baseStats.Spirit + "_";
			listCookieStr += $scope.allLists[i].baseStats.Longhouse + "_";
			listCookieStr += $scope.allLists[i].baseStats.Amulet;
			for (var j = 0; j < $scope.allLists[i].items.length; ++j) {
				if ($scope.allLists[i].items[j].Id) {
					listCookieStr += "_" + $scope.allLists[i].items[j].Id;
				}
				else {
					listCookieStr += "_0";
				}
			}
			listCookieStr += "*";
		}

		localStorage.setItem("cl", listCookieStr);
		localStorage.setItem("scl", $scope.selectedList.Name);

		if ($cookies.get("cl1")) {
			$cookies.remove("cl1");
			$cookies.remove("scl1");
			console.log("Migrated lists successfully.");
		}
	}

	//#endregion

	//#region ~~~~~~~~~ EVENTS ~~~~~~~~~
	$scope.onStatChanged = function(index) {
		// check stat total
		$scope.showStatError = false;
		if ($scope.selectedList.baseStats) {
			var total = $scope.selectedList.baseStats.Strength + $scope.selectedList.baseStats.Mind + $scope.selectedList.baseStats.Dexterity + $scope.selectedList.baseStats.Constitution + $scope.selectedList.baseStats.Perception + $scope.selectedList.baseStats.Spirit;

			if (total != 198 && total != 244) {
				$scope.showStatError = true;
			}
		}

		$scope.applyItemRestrictions();
		$scope.saveCookies();
	}
	$scope.onRowClicked = function(index) {
		var item = $scope.selectedList.items[index];
		$scope.loadingModal = false;
		$scope.searchString = "";
		$scope.sortStat = "";
		$scope.sortDir = "";
		$scope.currentItem = item;
		$scope.currentItemIndex = index;
		if ($scope.itemsBySlot[item.Slot].length == 0) {
			$scope.loadingModal = true;
			$http({
				url: '/php/items/getItemsBySlot.php',
				method: 'POST',
				data: {"slot": item.Slot}
			}).then(function succcessCallback(response) {
				// force the items coming in to be the slot we want (for weapons/hold slot shenanigans)
				for (var i = 0; i < response.data.length; ++i) {
					response.data[i].Slot = item.Slot;
				}

				$scope.itemsBySlot[item.Slot] = response.data;
				$scope.itemsBySlot[item.Slot].splice(0, 0, {"Slot": item.Slot, "Id": 0, "Name": "-"});
				$scope.loadingModal = true;

				$scope.filterSearchResults();
			}, function errorCallback(response){
			});
		}

		$('#itemChoiceModal').modal();
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
		$scope.currentPage = num + 1;
	}

	$scope.onSearchRowClicked = function(item) {
		$scope.selectedList.items[$scope.currentItemIndex] = item;
		$scope.saveCookies();
		$scope.applyItemRestrictions();
		$('#itemChoiceModal').modal('hide');
	}

	$scope.onSearchChange = function() {
		$scope.currentPage = 1;
		$scope.filterSearchResults();
	}

	$scope.onColumnHeaderClicked = function(statVar) {
		if ($scope.sortStat != statVar) {
			$scope.sortStat = statVar;
			$scope.sortDir = "-";
		}
		else {
			if ($scope.sortDir == "+") {
				$scope.sortDir = "-";
			}
			else {
				$scope.sortDir = "+";
			}
		}
		$scope.filteredItems.sort($scope.dynamicSort($scope.sortDir + $scope.sortStat));
	}

	$scope.sortClass = function(statVar) {
		if ($scope.sortStat == "") {
			return "fas fa-sort";
		}

		if ($scope.sortStat != statVar) {
			return "";
		}

		if ($scope.sortDir == "+") {
			return "fas fa-sort-up";
		}

		return "fas fa-sort-down";
	}

	$('#itemChoiceModal').on('shown.bs.modal', function() {
		$scope.currentPage = 1;
		$scope.filterSearchResults();
		$('#itemChoiceSearch').focus();
	});

	$('#addCharacterModal').on('shown.bs.modal', function() {
		$('#addCharacterModalName').focus();
	});

	$('#editCharacterModal').on('shown.bs.modal', function() {
		$('#editCharacterModalName').focus();
	});
	//#endregion

	//#region ~~~~~~~~~ COMMANDS ~~~~~~~~~
	$scope.selectList = function() {
		$scope.selectedList = $scope.allLists[$scope.selectedListIndex];
		$scope.editCharacterModel = {"Name": $scope.selectedList.Name};
		var list = $scope.selectedList;

		var ids = [];
		for (var i = 0; i < list.items.length; ++i) {
			if (list.items[i].Id > 0) {
				if (!list.items[i].Name) {
					var slotItems = $scope.itemsBySlot[list.items[i].Slot];
					var found = false;
					if (slotItems.length > 0) {
						for (var j = 0; j < slotItems.length; ++j) {
							if (slotItems[j].Id == list.items[i].Id) {
								found = true;
								list.items[i] = slotItems[j];
								break;
							}
						}
					}

					if (!found) {
						list.items[i].Name = "Loading...";
						ids.push(list.items[i].Id);
					}
				}
			}
			else {
				list.items[i].Name = "-";
			}
		}

		if (ids.length > 0) {
			$http({
				url: '/php/items/getItemsInIds.php',
				method: 'POST',
				data: {"ids": ids}
			}).then(function succcessCallback(response) {
				for (var i = 0; i < list.items.length; ++i) {
					for (var j = 0; j < response.data.length; ++j) {
						if (list.items[i].Id == response.data[j].Id) {
							list.items[i] = angular.copy(response.data[j]);
							list.items[i].Slot = $scope.slotOrder[i];
							break;
						}
					}

					if (list.items[i].Name == "Loading...") {
						list.items[i].Name = "DELETED";
					}
				}
				$scope.onStatChanged(); // to apply restrictions
			}, function errorCallback(response){
			});
		}
		$scope.onStatChanged(); // to apply restrictions

		$scope.characterName = list.Name;
		$scope.saveCookies();
	}

	$scope.addCharacter = function() {
		// add new list
		$scope.allLists.push($scope.getDefaultList($scope.addCharacterModel.Name));
		$scope.selectedListIndex = $scope.allLists.length - 1;
		$scope.selectList();

		// reset modal
		$("#addCharacterModal").modal("hide");
		$scope.addCharacterModel.Name = "";
	}

	$scope.editCharacter = function() {
		$scope.selectedList.Name = $scope.editCharacterModel.Name;

		$("#editCharacterModal").modal("hide");
	}

	$scope.deleteCharacter = function() {
		var index = $scope.allLists.indexOf($scope.selectedList);
		if (index > -1) {
			$scope.allLists.splice(index, 1);
			if ($scope.allLists.length == 0) {
				$scope.allLists.push($scope.getDefaultList("Untitled"));
				$scope.selectedListIndex = 0;
			}
			if ($scope.selectedListIndex >= $scope.allLists.length) {
				$scope.selectedListIndex = $scope.allLists.length - 1;
			}
			$scope.selectList();
		}
	}

	$scope.openDeleteModal = function() {
		$scope.confirmMessage = "Are you sure you want to delete " + $scope.selectedList.Name + "?";

		$scope.confirmFunc = $scope.deleteCharacter;
		$("#confirmModal").modal("show");
	}

	$scope.clearItemsFromList = function() {
		for (var i = 0; i < $scope.selectedList.items.length; ++i) {
			$scope.selectedList.items[i] = {"Slot": $scope.selectedList.items[i].Slot, "Id": 0, "Name": "-"};
		}
		$scope.saveCookies();
	}

	$scope.openClearModal = function() {
		$scope.confirmMessage = "Are you sure you want to clear all of " + $scope.selectedList.Name + "'s items?";

		$scope.confirmFunc = $scope.clearItemsFromList;
		$("#confirmModal").modal("show");
	}

	$scope.confirm = function() {
		$scope.confirmFunc();

		$("#confirmModal").modal("hide");
	}

	$scope.deleteAllLists = function() {
		localStorage.remove("cl")
		localStorage.remove("scl");
		window.location.reload();
	}
	//#endregion

	//#region ~~~~~~~~~ VALIDATION ~~~~~~~~~
	$scope.validateAddCharacter = function() {
		$scope.addCharacterForm.nameInput.$setValidity("duplicate", null);
		$scope.addCharacterForm.nameInput.$setValidity("limit", null);
		for (var i = 0; i < $scope.allLists.length; ++i) {
			if ($scope.allLists[i].Name === $scope.addCharacterModel.Name) {
				$scope.addCharacterForm.nameInput.$setValidity("duplicate", false);
				break;
			}
		}
		if ($scope.allLists.length == 20000) {
			$scope.addCharacterForm.nameInput.$setValidity("limit", false);
		}
	}

	$scope.validateEditCharacter = function() {
		$scope.editCharacterForm.nameInput.$setValidity("duplicate", null);
		for (var i = 0; i < $scope.allLists.length; ++i) {
			if ($scope.allLists[i].Name === $scope.selectedList.Name) {
				continue;
			}
			if ($scope.allLists[i].Name === $scope.editCharacterModel.Name) {
				$scope.editCharacterForm.nameInput.$setValidity("duplicate", false);
				break;
			}
		}
	}
	//#endregion

	$scope.sumStats = function(statName) {
		if (!$scope.selectedList) {
			return;
		}

		if (statName == 'AlignRestriction') {
			var canUseG = true;
			var canUseN = true;
			var canUseE = true;

			for (var i = 0; i < $scope.selectedList.items.length; ++i) {
				switch($scope.selectedList.items[i].AlignRestriction) {
					case 0:
						break;
					case 1:
						canUseN = false;
						canUseE = false;
						break;
					case 2:
						canUseG = false;
						canUseE = false;
						break;
					case 3:
						canUseG = false;
						canUseN = false;
						break;
					case 4:
						canUseG = false;
						break;
					case 5:
						canUseN = false;
						break;
					case 6:
						canUseE = false;
						break;
					default:
						break;
				}
			}

			if (!canUseG && !canUseN && !canUseE) {
				return "ERROR";
			}

			return (canUseG ? "G " : "  ") + (canUseN ? "N " : "  ") + (canUseE ? "E" : " ");
		}

		for (var i = 0; i < $scope.statInfo.length; ++i) {
			if ($scope.statInfo[i].var == statName) {
				if ($scope.statInfo[i].type != "int") {
					return "";
				}
				break;
			}
		}

		var fromBaseStats = 0;
		if ($scope.selectedList.baseStats[statName]) {
			fromBaseStats += $scope.selectedList.baseStats[statName];
		}

		var totalBaseStats = $scope.selectedList.baseStats.Strength + $scope.selectedList.baseStats.Mind + $scope.selectedList.baseStats.Dexterity + $scope.selectedList.baseStats.Constitution + $scope.selectedList.baseStats.Perception + $scope.selectedList.baseStats.Spirit;

		var fromStatQuests = 0;
		switch (statName) {
			case "Strength":
				if (totalBaseStats < 244) {
					fromStatQuests += 3;
				}
				if ($scope.selectedList.baseStats["Amulet"] == 0) {
					fromStatQuests += 10;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 3) {
					fromStatQuests += 5;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 2) {
					fromStatQuests += 3;
				}
				break;
			case "Mind":
				if (totalBaseStats < 244) {
					fromStatQuests += 3;
				}
				if ($scope.selectedList.baseStats["Amulet"] == 1) {
					fromStatQuests += 10;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 1) {
					fromStatQuests += 5;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 0) {
					fromStatQuests += 3;
				}
				break;
			case "Dexterity":
				if (totalBaseStats < 244) {
					fromStatQuests += 3;
				}
				if ($scope.selectedList.baseStats["Amulet"] == 2) {
					fromStatQuests += 10;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 4) {
					fromStatQuests += 5;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 1) {
					fromStatQuests += 3;
				}
				break;
			case "Constitution":
				if (totalBaseStats < 244) {
					fromStatQuests += 3;
				}
				if ($scope.selectedList.baseStats["Amulet"] == 3) {
					fromStatQuests += 10;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 5) {
					fromStatQuests += 5;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 3) {
					fromStatQuests += 3;
				}
				break;
			case "Perception":
				if (totalBaseStats < 244) {
					fromStatQuests += 3;
				}
				if ($scope.selectedList.baseStats["Amulet"] == 4) {
					fromStatQuests += 10;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 2) {
					fromStatQuests += 5;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 4) {
					fromStatQuests += 3;
				}
				break;
			case "Spirit":
				if (totalBaseStats < 244) {
					fromStatQuests += 13;
				}
				if ($scope.selectedList.baseStats["Amulet"] == 5) {
					fromStatQuests += 10;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 0) {
					fromStatQuests += 5;
				}
				if ($scope.selectedList.baseStats["Longhouse"] == 5) {
					fromStatQuests += 3;
				}
				break;
		}

		var fromItems = 0;
		for (var i = 0; i < $scope.selectedList.items.length; ++i) {
			if ($scope.selectedList.items[i][statName]) {
				fromItems += $scope.selectedList.items[i][statName];
			}
		}

		// limit stats from items
		switch (statName) {
			default:
				break;
		}

		var fromBonus = 0;
		switch (statName)
		{
			case "Spelldam":
			fromBonus += parseInt(($scope.sumStats("Mind") - 52) / 2);
				break;
			case "Spellcrit":
				fromBonus += parseInt(($scope.sumStats("Mind") - 60) / 4);
				fromBonus += parseInt(Math.max($scope.sumStats("Perception") - 60, 0) / 8);
				fromBonus += parseInt(Math.max($scope.sumStats("Spirit") - 60, 0) / 8);
				fromBonus += 5;
				break;
			case "Hit":
				var str = $scope.sumStats("Strength");
				var dex = $scope.sumStats("Dexterity");
				var con = $scope.sumStats("Constitution");

				var bestStat = dex;
				var wearingStrWeap = false;
				var wearingConWeap = false;
				for (var i = 0; i < $scope.selectedList.items.length; ++i) {
					if ($scope.selectedList.items[i].Slot == 14 || $scope.selectedList.items[i].Slot == 15) {
						if ($scope.selectedList.items[i].WeaponType == 1) {
							wearingStrWeap = true;
						}
						else if ($scope.selectedList.items[i].WeaponType == 3) {
							wearingConWeap = true;
						}
					}
				}
				if (wearingStrWeap && str > bestStat) { // replace false with wearingStrWeap
					bestStat = str;
				}
				if (wearingConWeap && con > bestStat) { // replace false with wearingConWeap
					bestStat = con;
				}

				fromBonus += parseInt((bestStat - 30) / 3);
				fromBonus += parseInt(Math.max(dex - 70, 0) / 6);
				break;
			case "Dam":
				fromBonus += parseInt(($scope.sumStats("Strength") - 30) / 3);
				break;
			case "Mitigation":
				var con = $scope.sumStats("Constitution");
				var hasBattleTraining = false;
				for (var i = 25; i < $scope.selectedList.items.length; ++i) { // loop through Other slots
					if ($scope.selectedList.items[i].Id == 1144 || $scope.selectedList.items[i].Id == 1137) {
						hasBattleTraining = true;
						break;
					}
				}

				if (hasBattleTraining) {
					fromBonus += parseInt(Math.max(con - 75, 0) / 5);
				}
				break;
			case "Ac":
				var str = $scope.sumStats("Strength");
				var dex = $scope.sumStats("Dexterity");
				var con = $scope.sumStats("Constitution");
				var per = $scope.sumStats("Perception");

				var totalAC = 83;
				totalAC += parseInt(Math.max(dex - 40, 0) * -0.5);
				totalAC += parseInt(Math.max(per - 30, 0) * -0.5);
				if (str >= 20 && dex >= 20 && con >= 20) {
					totalAC -= 5;
					if (dex >= 40 && con >= 40) {
						totalAC -= 5;
					}
				}

				fromBonus += totalAC;
				break;
		}

		var overallCap = 0;
		// apply overallCap
		switch (statName) {
			case "Mitigation":
				var hasBattleTraining = false;
				for (var i = 25; i < $scope.selectedList.items.length; ++i) { // loop through Other slots
					if ($scope.selectedList.items[i].Id == 1144 || $scope.selectedList.items[i].Id == 1137) {
						hasBattleTraining = true;
						break;
					}
				}

				var overallCap = parseInt(Math.max(Math.min($scope.sumStats("Constitution"), 70) - 30, 0) / 2);
				if (hasBattleTraining) {
					overallCap += 10;
				}
				break;
		}

		var total = fromBaseStats + fromStatQuests + fromItems + fromBonus;
		if (overallCap > 0) {
			total = Math.min(total, overallCap);
		}
		return total;
	}

	$scope.applyItemRestrictions = function() {
		// initialize restriction array
		$scope.itemRestrictions = [];
		for (var i = 0; i < $scope.selectedList.items.length; ++i) {
			$scope.itemRestrictions.push([]);
		}

		var handCount = 0;
		var handApplied = false;
		for (var i = 0; i < $scope.selectedList.items.length; ++i) {
			var curItem = $scope.selectedList.items[i];
			// unique
			if (curItem.Slot == 1 || curItem.Slot == 2 || curItem.Slot == 13 || curItem.Slot == 14 || curItem.Slot == 15 || curItem.Slot == 16) {
				if (curItem.UniqueWear) {
					for (var j = 0; j < $scope.selectedList.items.length; ++j) {
						if (i == j) {
							continue;
						}
						if (curItem.Id != 0 && curItem.Id == $scope.selectedList.items[j].Id) {
							$scope.itemRestrictions[i].push("unique");
							break;
						}
					}
				}
			}

			var strength = $scope.sumStats("Strength");

			// weight
			if (curItem.Slot == 14) {
				if (curItem.Weight * 4 > strength) {
					$scope.itemRestrictions[i].push("weight");
				}
			}
			else if (curItem.Slot == 15) {
				if (curItem.Weight * 5 > strength) {
					$scope.itemRestrictions[i].push("holdWeight");
				}
			}

			// hand limit
			if (!handApplied && curItem.Slot == 14 || curItem.Slot == 15) {
				if (curItem.TwoHanded !== undefined) {
					handCount += curItem.TwoHanded ? 2 : 1;
				}
				if (handCount > 3) {
					for (var j = 0; j < $scope.selectedList.items.length; ++j) {
						if ($scope.selectedList.items[j].Slot == 14 ||
						    $scope.selectedList.items[j].Slot == 15) {
							$scope.itemRestrictions[j].push("twohanded");
						}
					}
					handApplied = true;
				}
			}
		}
	}

	$scope.anyItemRestrictions = function(index) {
		return $scope.itemRestrictions[index].length > 0;
	}

	$scope.hasItemRestriction = function(index, name) {
		return $scope.itemRestrictions[index].includes(name);
	}

	$scope.getItemRestrictionText = function(index) {
		var text = "";
		for (var i = 0; i < $scope.itemRestrictions[index].length; ++i) {
			switch($scope.itemRestrictions[index][i]) {
				case "unique":
					text += "You cannot wear two of this item.";
					break;
				case "weight":
					var req = $scope.selectedList.items[index].Weight * 4;
					text += "You need " + req + " strength to wield this.";
					break;
				case "holdWeight":
					var req = $scope.selectedList.items[index].Weight * 5;
					text += "You need " + req + " strength to hold this with one hand.";
					break;
				case "twohanded":
					text += "You do not have enough hands to hold this item.";
					break;
				default:
					break;
			}
			if (i != $scope.itemRestrictions[index].length - 1) {
				text += "<br /><br />";
			}
		}
		return text;
	}

	$scope.dynamicSort = function(property) {
		var sortOrder = 1;
		if (property[0] === "+") {
			property = property.substr(1);
		}
		else if (property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function(a,b) {
			if (a[property] === undefined) {
				return -1;
			}
			else if (b[property] === undefined) {
				return 1;
			}

			var a = a[property];
			var b = b[property];
			if (typeof(a) == "string") {
				a = a.toUpperCase();
			}
			if (typeof(b) == "string") {
				b = b.toUpperCase();
			}
			var result = (a < b) ? -1 : (a > b) ? 1 : 0;
			return result * sortOrder;
		}
	}

	$scope.getFilteredSearchResults = function() {
		$scope.totalPages = Math.floor(($scope.filteredItems.length - 1) / $scope.itemsPerPage) + 1;

		var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
		return $scope.filteredItems.slice(start, start + $scope.itemsPerPage);
	}

	$scope.filterSearchResults = function() {
		var items = $scope.itemsBySlot[$scope.currentItem.Slot];
		if (items) {
			var filteredItems = items.slice(0);
			var i = filteredItems.length;
			while (i--) {
				if ($scope.searchString != '' && !filteredItems[i].Name.toLowerCase().includes($scope.searchString.toLowerCase())) {
					filteredItems.splice(i, 1);
				}
			}

			$scope.filteredItems = filteredItems;
		}
		else {
			$scope.filteredItems = items;
		}

	}

	$scope.resetColumns = function() {
		for (var i = 0; i < $scope.defaultStatInfo.length; ++i) {
			for (var j = 0; j < $scope.statInfo.length; ++j) {
				$scope.statInfo[j].showColumn = $scope.defaultStatInfo[i].showColumn;
			}
		}
	};

	$scope.resetFilters = function() {
		for (var i = 0; i < $scope.defaultStatInfo.length; ++i) {
			for (var j = 0; j < $scope.statInfo.length; ++j) {
				$scope.statInfo[j].filter = $scope.defaultStatInfo[i].filter;
			}
		}
	};

	$scope.getNumberArray = function(num) {
		return new Array(num);
	}

	$scope.showStatQuests = function() {
		if (!$scope.selectedList || !$scope.selectedList.baseStats) {
			return false;
		}
		var total = $scope.selectedList.baseStats.Strength + $scope.selectedList.baseStats.Mind + $scope.selectedList.baseStats.Dexterity + $scope.selectedList.baseStats.Constitution + $scope.selectedList.baseStats.Perception + $scope.selectedList.baseStats.Spirit;

		return total < 244;
	}

	$scope.initialize();
});
