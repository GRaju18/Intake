sap.ui.define([
	"com/9b/inTake/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/9b/inTake/model/models",
	"sap/ui/core/format/DateFormat"

], function (BaseController, Fragment, Filter, FilterOperator, model, DateFormat) {
	"use strict";

	return BaseController.extend("com.9b.inTake.controller.InTake", {
		formatter: model,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 **/
		onInit: function () {
			this.hanldeMessageDialog();
			this.getAppConfigData();
			this.getUsersService();
			this.getMetricsCredentials();
			var inTakeTable = this.getView().byId("inTakeTable");
			var tableHeader = this.byId("tableHeader");
			inTakeTable.addEventDelegate({
				onAfterRendering: function () {
					var oBinding = this.getBinding("rows");
					oBinding.attachChange(function (oEvent) {
						var oSource = oEvent.getSource();
						var count = oSource.iLength; //Will fetch you the filtered rows length
						var totalCount = oSource.oList.length;
						tableHeader.setText("Packages (" + count + "/" + totalCount + ")");
					});
				}
			}, inTakeTable);
			this.combinedFilter = [];
			var that = this;
			/*	setInterval(function () {
					that.loadMasterData();
				}, 1800000);*/
			this.getOwnerComponent().getRouter(this).attachRoutePatternMatched(this._objectMatched, this);
		},

		_objectMatched: function (oEvent) {
			if (oEvent.getParameter("name") == 'intake') {
				sap.ui.core.BusyIndicator.hide();
				this.getView().byId("inTakeTable").clearSelection();
				var jsonModel = this.getOwnerComponent().getModel("jsonModel");
				jsonModel.setProperty("/tagArray", []);
				jsonModel.setProperty("/isSingleSelect", false);
				jsonModel.setProperty("/enableChangeGrowth", false);
				jsonModel.setProperty("/batchDetailButton", false);
				this.getMetricsCredentials();
				this.getUsersService();
				//this.loadLicenseData();

			}
		},

		// loadLicenseData: function () {
		// 	var jsonModel = this.getOwnerComponent().getModel("jsonModel");
		// 	jsonModel.setProperty("/licBusy", true);
		// 	var that = this;
		// 	var authModel = sap.ui.getCore().getModel("authModel");
		// 	var sFilters = "?$filter=Inactive eq 'tNO' and not(startswith(Sublevel1,'SYSTEM'))";
		// 	var sSelect = "&$select=BinCode,U_MetrcLicense,U_MetrcLocation,U_Branch";
		// 	var order = "&$orderby=U_MetrcLicense asc,BinCode asc";
		// 	this.readServiecLayer("/b1s/v2/BinLocations" + sFilters + sSelect + order, function (data) {
		// 		jsonModel.setProperty("/licBusy", false);
		// 		jsonModel.setProperty("/licenseList", data.value);
		// 		authModel.setProperty("/licenseList", data.value);
		// 		jsonModel.setProperty("/sLinObj", data.value[0]);
		// 		authModel.setProperty("/selectedLicense", data.value[0].U_MetrcLicense);
		// 		jsonModel.setProperty("/selectedLicense", data.value[0].U_MetrcLicense);
		// 		jsonModel.setProperty("/selectedLocation", data.value[0].U_MetrcLocation);
		// 		jsonModel.setProperty("/selectedBincode", data.value[0].BinCode);
		// 		jsonModel.setProperty("/selectedBranchNUM", data.value[0].U_Branch);
		// 		jsonModel.setProperty("/selectedLocationDesc", data.value[0].BinCode + " - " + data.value[0].U_MetrcLicense);
		// 		that.loadMasterData(data.value[0].U_MetrcLocation);
		// 		that.loadLocationData();
		// 	});
		// },

		loadLicenseData: function () {
			var that = this;
			var compressedLisence = [];
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var authModel = sap.ui.getCore().getModel("authModel");
			var userAccessLicense = jsonModel.getProperty("/userAccessLicense");
			jsonModel.setProperty("/busyView", true);
			var sFilters = "?$filter=Inactive eq 'tNO' and not(startswith(Sublevel1,'SYSTEM'))";
			var sSelect = "&$select=BinCode,U_MetrcLicense,U_MetrcLocation,U_Branch";
			var order = "&$orderby=U_MetrcLicense asc,BinCode asc";
			this.readServiecLayer("/b1s/v2/BinLocations" + sFilters + sSelect + order, function (data) {
				if (userAccessLicense.length > 0 && userAccessLicense != undefined) {
					$.each(userAccessLicense, function (i, m) {
						$.each(data.value, function (j, n) {
							if (m.key == n.U_MetrcLicense) {
								compressedLisence.push(n);
							}
						});
					});
					jsonModel.setProperty("/busyView", false);
					jsonModel.setProperty("/licenseList", compressedLisence);
					authModel.setProperty("/licenseList", compressedLisence);
					jsonModel.setProperty("/sLinObj", compressedLisence[0]);
					authModel.setProperty("/selectedLicense", compressedLisence[0].U_MetrcLicense);
					jsonModel.setProperty("/selectedLicense", compressedLisence[0].U_MetrcLicense);
					jsonModel.setProperty("/selectedLocation", compressedLisence[0].U_MetrcLocation);
					jsonModel.setProperty("/selectedBincode", compressedLisence[0].BinCode);
					jsonModel.setProperty("/selectedBranchNUM", compressedLisence[0].U_Branch);
					jsonModel.setProperty("/selectedLocationDesc", compressedLisence[0].BinCode + " - " + compressedLisence[0].U_MetrcLicense);
					jsonModel.refresh(true);
					that.loadMasterData(compressedLisence[0].U_MetrcLocation);
					that.loadLocationData();
				} else {
					jsonModel.setProperty("/busyView", false);
					sap.m.MessageBox.error("Locations not available for this user");
					/*jsonModel.setProperty("/licenseList", data.value);
					authModel.setProperty("/licenseList", data.value);
					jsonModel.setProperty("/sLinObj", data.value[0]);
					authModel.setProperty("/selectedLicense", data.value[0].U_MetrcLicense);
					jsonModel.setProperty("/selectedLicense", data.value[0].U_MetrcLicense);
					jsonModel.setProperty("/selectedLocation", data.value[0].U_MetrcLocation);
					jsonModel.setProperty("/selectedBincode", data.value[0].BinCode);
					jsonModel.setProperty("/selectedBranchNUM", data.value[0].U_Branch);
					jsonModel.setProperty("/selectedLocationDesc", data.value[0].BinCode + " - " + data.value[0].U_MetrcLicense);
					that.loadMasterData(data.value[0].U_MetrcLocation);
					that.loadLocationData();*/
				}
			});
		},
		onSearchLicense: function (evt) {
			var oItem = evt.getParameter("suggestionItem");
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			if (oItem) {
				var sObj = oItem.getBindingContext("jsonModel").getObject();
				jsonModel.setProperty("/sLinObj", sObj);
				jsonModel.setProperty("/selectedLicense", sObj.U_MetrcLicense);
				jsonModel.setProperty("/selectedLocation", sObj.U_MetrcLocation);
				jsonModel.setProperty("/selectedBincode", sObj.BinCode);
				jsonModel.setProperty("/selectedWarehouse", sObj.Warehouse);
				jsonModel.setProperty("/selectedAbsEntry", sObj.AbsEntry);
				jsonModel.setProperty("/selectedBranchNUM", sObj.U_Branch);
				this.loadMasterData(sObj.U_MetrcLocation);
				this.loadLocationData();
			} else if (evt.getParameter("clearButtonPressed")) {
				evt.getSource().fireSuggest();

			}
		},

		onSuggestLocation: function (event) {
			this.oSF = this.getView().byId("locDropDown");
			var sValue = event.getParameter("suggestValue"),
				aFilters = [];
			if (sValue) {
				aFilters = [
					new Filter([
						new Filter("BinCode", function (sText) {
							return (sText || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
						}),
						new Filter("U_MetrcLicense", function (sDes) {
							return (sDes || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
						})
					], false)
				];
			}

			this.oSF.getBinding("suggestionItems").filter(aFilters);
			this.oSF.suggest();
		},

		onChanageLicenseType: function (evt) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sObj = evt.getSource().getSelectedItem().getBindingContext("jsonModel").getObject();
			jsonModel.setProperty("/sLinObj", sObj);
			jsonModel.setProperty("/selectedLicense", sObj.U_MetrcLicense);
			jsonModel.setProperty("/selectedLocation", sObj.U_MetrcLocation);
			jsonModel.setProperty("/selectedBranchNUM", sObj.U_Branch);
			jsonModel.setProperty("/selectedBincode", sObj.BinCode);
			this.loadMasterData();
			this.loadLocationData();
		},

		onChangingInventoryLicense: function (evt) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sKey = evt.getSource().getSelectedKey();
			jsonModel.setProperty("/LicenseName", sKey);
			// var locationForTrans = sap.ui.core.Fragment.byId("InventoryTransferDialog", "locationForTras");
			// locationForTrans.getBinding("items").filter([
			// 	new sap.ui.model.Filter("U_MetrcLicense", "EQ", sKey)
			// ]);

			// var filters = "?$filter=U_MetrcLicense eq " + "'" + sKey.split("$")[1] + "' and not(startswith(BinCode,'LIC'))";

			var filters = "?$filter=U_MetrcLicense eq " + "'" + sKey + "' and not(startswith(BinCode,'LIC'))";
			var fields = "&$select=" + ["U_MetrcLicense", "U_MetrcLocation", "Sublevel2", "BinCode", "AbsEntry", "Warehouse"].join();
			this.readServiecLayer("/b1s/v2/BinLocations" + filters + fields, function (data) {
				jsonModel.setProperty("/binlocationData", data.value);
			});

		},

		onChanageNavigate: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var serLayerTargetUrl = jsonModel.getProperty("/target");
			var pageTo = this.byId("navigate").getSelectedKey();
			var AppNavigator;
			if (pageTo === "Strain") {
				AppNavigator = serLayerTargetUrl.Strain;
			}
			if (pageTo === "ClonePlanner") {
				AppNavigator = serLayerTargetUrl.ClonePlanner;
			}
			if (pageTo === "VegPlanner") {
				AppNavigator = serLayerTargetUrl.VegPlanner;
			}
			if (pageTo === "FlowerPlanner") {
				AppNavigator = serLayerTargetUrl.FlowerPlanner;
			}
			if (pageTo === "Harvest") {
				AppNavigator = serLayerTargetUrl.Harvest;
			}
			if (pageTo === "MotherPlanner") {
				AppNavigator = serLayerTargetUrl.MotherPlanner;
			}
			if (pageTo === "DestroyedPlants") {
				AppNavigator = serLayerTargetUrl.DestroyedPlants;
			}
			if (pageTo === "Waste") {
				AppNavigator = serLayerTargetUrl.Waste;
			}
			if (pageTo === "inTake") {
				AppNavigator = serLayerTargetUrl.inTake;
			}
			if (pageTo === "METRCTag") {
				AppNavigator = serLayerTargetUrl.METRCTag;
			}
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: AppNavigator
				}
			});
		},

		ReloadingdMasterData: function () {
			var that = this;
			var sLicnse;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			if (!licenseNo) {
				sLicnse = jsonModel.getProperty("/selectedLicense");
			} else {
				sLicnse = licenseNo;
			}
			this.getView().setBusy(true);
			var filters = "?$filter=Status ne '1' and U_Phase eq 'Package' and U_MetrcLicense eq " + "'" + sLicnse + "' ";
			this.readServiecLayer("/b1s/v2/sml.svc/CV_GH_BATCHQUERY_VW" + filters, function (data) {
				jsonModel.setProperty("/packagesData", data.value);
			});
		},

		/** Method Called when we call oData service and store the data in model and bing the data to master plant table.*/
		loadMasterData: function (licenseNo) {
			var that = this;
			var selectedLocation;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var selectedLocation = jsonModel.getProperty("/selectedLocation");
			var selectedBincode = jsonModel.getProperty("/selectedBincode");
			// if (!selectedLocation && jsonModel.getProperty("/licenseList").length > 0) {
			// 	selectedLocation = jsonModel.getProperty("/licenseList")[0].U_MetrcLocation;
			// 	selectedBincode = jsonModel.getProperty("/licenseList")[0].BinCode;
			// }
			this.getView().setBusy(true);
			var filters = "?$filter=Status ne '1' and U_Phase eq 'Package' and BinLocationCode eq '" + selectedBincode +
				"'";
			var itemGrpCodeIntake = jsonModel.getProperty("/itemGrpCodeIntake");
			if (itemGrpCodeIntake) {
				filters = filters + " and (";
				$.each(itemGrpCodeIntake, function (i, e) {
					if (i < itemGrpCodeIntake.length - 1) {
						filters = filters + "ItemGroupCode eq " + e.key + " or ";
					} else {
						filters = filters + "ItemGroupCode eq " + e.key;
					}

				});
				filters = filters + ")";
			}
			var orderBy = "&$orderby=CreateDate desc,METRCUID desc";
			// var filters = "?$filter=U_MetrcLocation eq '" + selectedLocation + "'&$orderby=CreateDate desc,METRCUID desc";
			this.readServiecLayer("/b1s/v2/sml.svc/CV_GH_BATCHQUERY_VW" + filters + orderBy, function (data) {

				$.each(data.value, function (i, e) {
					e.reportBusy = true;
					e.LABSTATUS = "Loading...";
				});

				var cDate = new Date();
				var dateFormat = DateFormat.getDateTimeInstance({
					pattern: "KK:mm:ss a"
				});
				var refreshText = dateFormat.format(cDate);
				jsonModel.setProperty("/refreshText", "Last Updated " + refreshText);

				jsonModel.setProperty("/refreshState", "Success");
				that.byId("tableHeader").setText("Packages (" + data.value.length + ")");
				jsonModel.setProperty("/packagesData", data.value);
				that.getView().setBusy(false);
				that.loadItemData();

				/*	setTimeout(function () {
						var promises = [];
						$.each(data.value, function (i, e) {
							promises.push(that.getLabStatus(e.METRCUID));
						});
						Promise.all(promises).then(function (values) {
							$.each(values, function (i, e) {
								data.value[i].reportBusy = false;
								if (e === "Network Error" || e === "Unauthorized") {
									data.value[i].LABSTATUS = e;
									data.value[i].ENLAB = false;
								} else {
									data.value[i].LABSTATUS = e.LabTestingState;
									data.value[i].Id = e.Id;
									if (e.LabTestingState === "TestPassed" || e.LabTestingState === "TestFailed") {
										data.value[i].ENLAB = true;
									} else {
										data.value[i].ENLAB = false;
									}
								}
							});
							jsonModel.setProperty("/packagesData", data.value);
						});
					}, 1000);*/
			});
		},
		loadItemData: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var itemGrpCodes = jsonModel.getProperty("/itemGrpCodes");
			itemGrpCodes = JSON.parse(itemGrpCodes);
			var dryCanGrpItem = $.grep(itemGrpCodes, function (e) {
				if (e.text === "Dry Cannabis") {
					return e;
				}
			});
			var dryCanGrpCode = "";
			if (dryCanGrpItem.length > 0) {
				dryCanGrpCode = dryCanGrpItem[0].key;
			}
			var filters = "?$filter=ItemsGroupCode eq " + dryCanGrpCode;
			var fields = "&$select=" + ["ItemName", "ItemsGroupCode", "ItemCode", "InventoryUOM", "ProdStdCost"].join();
			this.readServiecLayer("/b1s/v2/Items" + filters + fields, function (data1) {
				jsonModel.setProperty("/itemCodeList", data1.value);
			});
			// var cloneItem = $.grep(itemGrpCodes, function (e) {
			// 	if (e.text === "Clone") {
			// 		return e;
			// 	}
			// });
			// var cloneItemKey = "";
			// if (cloneItem.length > 0) {
			// 	cloneItemKey = cloneItem[0].key;
			// }
			//var cloneFilters = "?$filter=ItemsGroupCode eq " + cloneItemKey;

			var cloneFilters = "?$filter=(contains(ItemName,'Clone') or contains(ItemName,'Teen'))";
			var cloneFields = "&$select=" + ["ItemName", "ItemsGroupCode", "ItemCode", "InventoryUOM", "ProdStdCost"].join();
			this.readServiecLayer("/b1s/v2/Items" + cloneFilters + cloneFields, function (data1) {
				jsonModel.setProperty("/cloneItemCodeList", data1.value);
			});

			var fieldsItem = "?$select=" + ["ItemName", "ItemsGroupCode", "ItemCode", "InventoryUOM", "ProdStdCost"].join();
			this.readServiecLayer("/b1s/v2/Items" + fieldsItem, function (data1) {
				jsonModel.setProperty("/allItemsList", data1.value);
			});
		},

		/*Methods for multiInput for sarch field for scan functionality start*/
		fillFilterLoad: function (elementC, removedText) { //changed by susmita for filter
			var orFilter = [];
			var andFilter = [];
			$.each(elementC.getTokens(), function (i, info) {
				var value = info.getText();
				if (value !== removedText) {
					orFilter.push(new sap.ui.model.Filter("METRCUID", "Contains", value.toLowerCase())); //tag
					orFilter.push(new sap.ui.model.Filter("ItemName", "Contains", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("SourceUID", "Contains", value.toLowerCase())); // location  
					orFilter.push(new sap.ui.model.Filter("WhsName", "Contains", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("HarvestName", "Contains", value.toLowerCase())); // location
					orFilter.push(new sap.ui.model.Filter("CreateDate", "Contains", value.toLowerCase())); //harvest batch 
					orFilter.push(new sap.ui.model.Filter("BinLocationCode", "Contains", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("BinLocationName", "Contains", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("Quantity", "EQ", value.toLowerCase()));
					//	orFilter.push(new sap.ui.model.Filter("U_NLQTY", "Contains", value.toLowerCase())); // quantity
					//orFilter.push(new sap.ui.model.Filter("U_NVGRD", "GE",   value.toLowerCase() ));  //date,total plants,waste weight
					andFilter.push(new sap.ui.model.Filter({
						filters: orFilter,
						and: false,
						caseSensitive: false
					}));
				}
			});
			this.byId("inTakeTable").getBinding("rows").filter(andFilter);
		},

		handlechangeGrowthPhase: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			jsonModel.setProperty("/enableOk", true);
			var sItems;
			var updateObject, changegrowthphasedata = [];
			var table = this.getView().byId("inTakeTable");
			sItems = table.getSelectedIndices();

			$.each(sItems, function (i, e) {

				updateObject = table.getContextByIndex(e).getObject();
				updateObject.SNO = i + 1;
				changegrowthphasedata.push(updateObject);
			});
			jsonModel.setProperty("/changegrowthphasedata", changegrowthphasedata);

			if (sItems.length > 0) {
				if (!this.changeGrowthPhaseDialog) {
					this.changeGrowthPhaseDialog = sap.ui.xmlfragment("changeGrowthPhaseDialog",
						"com.9b.inTake.view.fragments.ChangeGrowthPhase", this);
					this.getView().addDependent(this.changeGrowthPhaseDialog);
				}
				this.changeGrowthPhaseDialog.open();

			} else {
				sap.m.MessageToast.show("Please select atleast one batch");
			}
		},

		onConfirmChangeGrowthPhase: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sItems;
			var table = this.getView().byId("inTakeTable");
			var sArrayObj = [];
			sItems = table.getSelectedIndices();
			// var changegrowthphasedata = jsonModel.getProperty("/changegrowthphasedata");
			var that = this;
			if (sItems.length > 0) {
				sap.m.MessageBox.confirm("Do you want to move the selected packages to Drying?", {
					onClose: function (action) {
						if (action === "OK") {
							var payLoadInventory, batchUrl = [],
								payLoadUpdate;
							$.each(sItems, function (i, e) {
								payLoadInventory = {};
								var sObj = table.getContextByIndex(e).getObject();
								var payLoadInventoryEntry = {
									U_Phase: "Drying"
								};
								batchUrl.push({
									url: "/b1s/v2/BatchNumberDetails(" + sObj.BatchAbsEntry + ")",
									data: payLoadInventoryEntry,
									method: "PATCH"
								});
							});
							jsonModel.setProperty("/errorTxt", []);
							that.getView().setBusy(true);
							that.createBatchCall(batchUrl, function () {
								that.getView().setBusy(false);
								sap.m.MessageToast.show("Change growth phase completed succsessfully");
								// that.onChangeGrowthPhaseClose();
								that.byId("inTakeTable").setSelectedIndex(-1);
								that.loadMasterData();
							});
						}
					}
				});

			} else {
				sap.m.MessageToast.show("Please select atleast one batch");
			}
		},

		onChangeGrowthPhaseClose: function () {
			this.changeGrowthPhaseDialog.close();
		},

		/***Method start for change location ***/
		onLocationDelete: function (evt) {
			var jsonModel = this.getView().getModel("jsonModel");
			var changeLocData = jsonModel.getProperty("/changeLocData");
			var sIndex = evt.getSource().getParent().getParent().indexOfItem(evt.getSource().getParent());
			changeLocData.splice(sIndex, 1);
			jsonModel.setProperty("/changeLocData", changeLocData);
		},

		handlechangeLocation: function () {
			var deviceModel = this.getView().getModel("device");
			var sItems, that = this;
			var table = this.getView().byId("inTakeTable");
			var sArrayObj = [];
			sItems = table.getSelectedIndices();

			if (sItems.length > 0) {
				if (!this.changeLocationDialog) {
					this.changeLocationDialog = sap.ui.xmlfragment("changeLocationDialog", "com.9b.inTake.view.fragments.ChangeLocation",
						this);
					this.getView().addDependent(this.changeLocationDialog);
				}
				var selObj;
				$.each(sItems, function (i, e) {
					selObj = table.getContextByIndex(e).getObject();
					selObj.SelLocation = "";
					selObj.U_NLCNM_TO = "";
					selObj.SNO = "#" + (i + 1);
					sArrayObj.push(selObj);
				});

				this.changeLocationDialog.open();
			} else {
				sap.m.MessageToast.show("Please select a batch");
			}
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			jsonModel.setProperty("/SelLocation", "");
			var licenseNo = jsonModel.getProperty("/selectedLicense");
			jsonModel.setProperty("/SelLicense", "");
			jsonModel.setProperty("/changeLocData", sArrayObj);
			jsonModel.setProperty("/temChangeLoc", "");

			var filters = "?$filter=U_MetrcLicense eq " + "'" + licenseNo + "' and not(startswith(BinCode,'LIC'))";
			var fields = "&$select=" + ["U_MetrcLicense", "U_MetrcLocation", "Sublevel2", "BinCode", "AbsEntry", "Warehouse"].join();
			this.readServiecLayer("/b1s/v2/BinLocations" + filters + fields, function (data) {
				jsonModel.setProperty("/ChangeLocationList", data.value);
			});
		},

		onChangeLocTemApply: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var temLocation = sap.ui.core.Fragment.byId("changeLocationDialog", "temLocationId");
			var sLocText = "";
			if (temLocation.getSelectedItem()) {
				var sLocText = temLocation.getSelectedItem().getText();
			}
			var changeLocData = jsonModel.getProperty("/changeLocData");
			var sLoc = jsonModel.getProperty("/temChangeLoc");
			$.each(changeLocData, function (i, e) {
				e.SelLocation = sLoc;
				e.U_NLCNM_TO = sLocText;
			});
			jsonModel.setProperty("/changeLocData", changeLocData);
		},

		onChangeLocationClose: function () {
			this.changeLocationDialog.close();
		},
		onLocationChangeSelect: function (evt) {
			var sItem = evt.getSource().getSelectedItem();
			if (sItem) {
				var sItemContext = sItem.getBindingContext("jsonModel").getObject();
				var rowContext = evt.getSource().getParent().getBindingContext("jsonModel").getObject();
				rowContext.Warehouse = sItemContext.Warehouse;
				rowContext.AbsEntry = sItemContext.AbsEntry;
				rowContext.U_MetrcLocation = sItemContext.U_MetrcLocation;
				rowContext.BinCode = sItemContext.BinCode;
			}
		},
		onConfirmLocation: function () {
			//code for get clone planner data based on licence selected. 
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var deviceModel = this.getView().getModel("device");
			var changeLocData = jsonModel.getProperty("/changeLocData");
			var isPhone = deviceModel.getProperty("/system/phone");
			var sItems;

			var inTakeTable = this.getView().byId("inTakeTable");
			sItems = inTakeTable.getSelectedIndices();
			var isValidated = true;
			// var locationID = sap.ui.core.Fragment.byId("changeLocationDialog", "location").getSelectedKey();
			$.each(changeLocData, function (i, Obj) {
				if (!Obj.SelLocation) {
					isValidated = false;
					sap.m.MessageToast.show("Please select location");
					return;
				}
				if (Obj.WhsName.toLowerCase() == Obj.U_MetrcLocation.toLowerCase()) {
					isValidated = false;
					sap.m.MessageToast.show("You have selected same location, Please select another location");
					return;
				}
			});

			if (isValidated) {
				var cDate = this.convertUTCDate(new Date());
				var that = this;
				var count = sItems.length;
				var invTransferPostData = [];
				var locationChangeData = [];
				var payLoadInventory = {};
				var itemCodeList = jsonModel.getProperty("/itemCodeList");

				var metrcData = jsonModel.getProperty("/metrcData");
				var Locations = jsonModel.getProperty("/ChangeLocationList");
				var metricPayload = [],
					metrcObj,
					locationID = "",
					locationName = "";
				$.each(changeLocData, function (i, updateObject) {
					locationID = updateObject.SelLocation;
					var AbslocationEntry = "",
						BinCode = "";
					var ChangeLocationList = jsonModel.getProperty("/ChangeLocationList");
					$.each(ChangeLocationList, function (i, obj) {
						if (updateObject.BinLocationCode.toLowerCase() == obj.BinCode.toLowerCase()) {
							AbslocationEntry = obj.AbsEntry;
							BinCode = obj.BinCode;
						}
					});
					locationName = updateObject.U_MetrcLocation;
					var BatchNumber = updateObject.METRCUID;
					var quantity = updateObject.Quantity;
					payLoadInventory = {
						"FromWarehouse": updateObject.WhsCode.split("-")[0],
						"ToWarehouse": locationID.split("-")[0],
						"BPLID": jsonModel.getProperty("/sLinObj").U_Branch,
						"Comments": "Manage Packages - Change Location",
						"StockTransferLines": []
					};
					payLoadInventory.StockTransferLines.push({
						"LineNum": 0,
						"ItemCode": updateObject.ItemCode, //<THIS IS THE QTY OF CLONES>
						"Quantity": quantity, //<THIS IS FROM CLONE ROOM>
						//	"UnitPrice": ProdStdCost,
						"WarehouseCode": locationID.split("-")[0], // <THIS IS TAG>
						"FromWarehouseCode": updateObject.WhsCode.split("-")[0],
						"BatchNumbers": [{
							"Quantity": quantity, // <THIS IS TAG>
							"BatchNumber": BatchNumber,
							"Location": locationID.replace(locationID.split("-")[0], "").replace("-", "").replace(locationID.split("-")[1], "").replace(
								"-", ""),
						}],
						"StockTransferLinesBinAllocations": [{
							"BinAbsEntry": Number(AbslocationEntry),
							"Quantity": quantity,
							"SerialAndBatchNumbersBaseLine": 0,
							"BinActionType": "batFromWarehouse",
							"BaseLineNumber": 0
						}, {
							"BinAbsEntry": Number(locationID.split("-")[1]),
							"Quantity": quantity,
							"SerialAndBatchNumbersBaseLine": 0,
							"BinActionType": "batToWarehouse",
							"BaseLineNumber": 0
						}]
					});
					invTransferPostData.push(payLoadInventory);
					locationChangeData.push(updateObject);
					if (metrcData && metrcData.U_NACST === "X") {
						if (updateObject.U_MetrcLocation !== null && updateObject.U_MetrcLocation !== "null") {
							metrcObj = {
								Label: updateObject.METRCUID,
								Location: updateObject.U_MetrcLocation,
								MoveDate: that.getSystemDate()
							};
							metricPayload.push(metrcObj);
						}

					}
				});
				var that = this;
				if (metrcData && metrcData.U_NACST === "X" && metricPayload.length > 0) {
					that.changeLocationDialog.setBusy(true);
					var metrcUrl = "/packages/v2/location?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
					that.callMetricsService(metrcUrl, "PUT", metricPayload, function () {
						sap.m.MessageToast.show("METRC sync completed successfully");
						that.changeLocationtoTable(invTransferPostData, inTakeTable, that);
					}, function (error) {
						that.changeLocationDialog.setBusy(false);
						sap.m.MessageToast.show(JSON.stringify(error));
					});
				} else {
					that.changeLocationtoTable(invTransferPostData, inTakeTable, that);
				}
			}
		},
		changeLocationtoTable: function (invTransferPostData, inTakeTable, that) {
			that.changeLocationDialog.setBusy(true);
			var count = invTransferPostData.length;
			$.each(invTransferPostData, function (i, postObj) {
				that.updateServiecLayer("/b1s/v2/StockTransfers", function () {
					count--;
					if (count == 0) {
						that.changeLocationDialog.setBusy(false);
						that.changeLocationDialog.close();
						sap.m.MessageToast.show("Batch location changed successfully");
						inTakeTable.clearSelection();
						that.loadMasterData();
					}
				}.bind(that), postObj, "POST", that.changeLocationDialog);
			});
		},

		validateEnteredQty: function (evt) {
			var value = evt.getParameter("newValue");
			value = value.replace(/[^.\d]/g, '').replace(/^(\d*\.?)|(\d*)\.?/g, "$1$2");
			//value = value.replace(/\D/, "");
			evt.getSource().setValue(value);
			var sObj = evt.getSource().getBindingContext("jsonModel").getObject();
			if (isNaN(value)) {
				sObj.STATUSQTY = "Error";
				sObj.QTYTXT = "enter numeric value only";
				evt.getSource().focus();
			} else if (Number(sObj.U_NLQTY) < Number(value)) {
				sObj.STATUSQTY = "Error";
				sObj.QTYTXT = "Entered Quantity is more than Available Quantity";
				evt.getSource().focus();
			} else {
				sObj.STATUSQTY = "None";
			}
		},
		tagSelectionChange: function (evt) {
			var sBox = evt.getSource();
			var cObj = sBox.getBindingContext("jsonModel").getObject();
			var sPath = sBox.getSelectedItem().getBindingContext("jsonModel").getObject().DocNum;
			cObj.tagCode = sPath;
		},
		loadTagsDataInPkg: function (evt) {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var licenseNo = jsonModel.getProperty("/selectedLicense");
			jsonModel.setProperty("/ComboBoxBusy", true);
			var metrcUrl = "/tags/v2/package/available?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
			this.callMetricsGETService(metrcUrl, function (itemData) {
				jsonModel.setProperty("/harvestTagsData", itemData);

			}, function (error) {
				that.getView().setBusy(false);
				sap.m.MessageToast.show(JSON.stringify(error));
			});
		},
		loadLocationData: function () {
			var jsonModel = this.getView().getModel("jsonModel");
			var licenseNo = jsonModel.getProperty("/selectedLicense");
			var filters = "?$filter=U_MetrcLicense eq " + "'" + licenseNo + "' ";
			var fields = "&$select=" + ["U_MetrcLicense", "U_MetrcLocation", "Sublevel2", "BinCode", "AbsEntry", "Warehouse"].join();
			this.readServiecLayer("/b1s/v2/BinLocations" + filters + fields, function (data) {
				if (data.value.length > 0) {
					jsonModel.setProperty("/allLocData", data.value);
				} else {
					jsonModel.setProperty("/allLocData", []);
				}
			});
		},
		loadLocationsDataInPkg: function (evt) {
			var jsonModel = this.getView().getModel("jsonModel");
			var licenseNo = jsonModel.getProperty("/selectedLicense");
			var filters = "?$filter=U_MetrcLicense eq " + "'" + licenseNo + "' and not(startswith(BinCode,'LIC'))";
			var fields = "&$select=" + ["U_MetrcLicense", "U_MetrcLocation", "Sublevel2", "BinCode", "AbsEntry", "Warehouse"].join();
			jsonModel.setProperty("/ComboBoxBusy", true);
			this.readServiecLayer("/b1s/v2/BinLocations" + filters + fields, function (data) {
				if (data.value.length > 0) {
					jsonModel.setProperty("/ComboBoxBusy", false);
					jsonModel.setProperty("/harvestLocData", data.value);
				} else {
					jsonModel.setProperty("/ComboBoxBusy", false);
					jsonModel.setProperty("/harvestLocData", []);
				}
			});
		},
		loadDropDownDataForTransfer: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			jsonModel.setProperty("/BPDataBusy", true);
			var busPartner = [];
			var custFilters = "?$select=CardCode,CardName,CardForeignName,Address,City,Country,ZipCode&$filter=CardType eq 'cCustomer'";
			this.readServiecLayer("/b1s/v2/BusinessPartners" + custFilters, function (bpData) {
				jsonModel.setProperty("/BPData", bpData.value);

				jsonModel.setProperty("/BPDataBusy", false);
			});
			jsonModel.setProperty("/driverDataBusy", true);
			this.readServiecLayer("/b1s/v2/U_DRIVERDETAILS", function (driverDetails) {
				jsonModel.setProperty("/DriverData", driverDetails.value);
				jsonModel.setProperty("/driverDataBusy", false);
			});
			jsonModel.setProperty("/vehicleDataBusy", true);
			this.readServiecLayer("/b1s/v2/U_VEHICLEDETAILS", function (vehicleDetails) {
				jsonModel.setProperty("/VehicleData", vehicleDetails.value);
				jsonModel.setProperty("/vehicleDataBusy", false);
			});

			jsonModel.setProperty("/TransporterDataBusy", true);
			var transporterFilters = "?$select=CardCode,CardName,CardForeignName,Address&$filter=GroupCode eq 105";
			this.readServiecLayer("/b1s/v2/BusinessPartners" + transporterFilters, function (transData) {
				jsonModel.setProperty("/TransporterData", transData.value);
				jsonModel.setProperty("/TransporterDataBusy", false);
			});
			jsonModel.setProperty("/transporterBusy", false);

		},
		onCustSelect: function (evt) {
			var sObj = evt.getSource().getSelectedItem().getBindingContext("jsonModel").getObject();
			var createTras = this.getModel("jsonModel").getProperty("/createTras");
			var totalAdress = [];
			totalAdress.push(sObj.Address);
			totalAdress.push(sObj.City);
			totalAdress.push(sObj.Country + ", " + sObj.ZipCode);
			createTras.address = totalAdress.join("\n");
		},

		onConfirmTransfer: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var deviceModel = this.getView().getModel("device");
			var isPhone = deviceModel.getProperty("/system/phone");
			var inTakeTable = this.getView().byId("inTakeTable");
			var that = this;
			var cDate = that.convertUTCDateTime(new Date());
			var sLincense = jsonModel.getProperty("/transLincense");
			var transLoc = jsonModel.getProperty("/transLoc");
			var ChangeLocation2 = jsonModel.getProperty("/ChangeLocation2");
			var sItems;

			var inTakeTable = this.getView().byId("inTakeTable");
			sItems = inTakeTable.getSelectedIndices();
			var batchUrl = [],
				ItemCode,
				BPLID;
			// var sItems = inTakeTable.getSelectedIndices();
			var locationForTras = sap.ui.core.Fragment.byId("InventoryTransferDialog", "locationForTras");
			var bplId = locationForTras.getSelectedItem().getBindingContext("jsonModel").getObject().BusinessPlaceID;
			$.each(sItems, function (i, e) {
				var payLoadInventory = {};
				var sObj = inTakeTable.getContextByIndex(e).getObject();
				// InventoryExits

				var returnObj = $.grep(jsonModel.getProperty("/allLocationList"), function (ele) {
					if (sObj.BinLocationCode === ele.BinCode) {
						return ele;
					}
				});
				var absExitCall = returnObj[0].AbsEntry;

				ItemCode = sObj.ItemCode;
				var batchNumber = sObj.METRCUID;
				var payLoadInventoryExits = {
					"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
					"Comments": "Manage Packages – Transfer Template",
					"DocumentLines": []
				};
				payLoadInventoryExits.DocumentLines.push({
					"ItemCode": ItemCode, //<THIS IS SELECTED ITEM> 
					"WarehouseCode": sObj.WhsCode, // <THIS IS FROM CLONE ROOM>
					"Quantity": sObj.Quantity, // <THIS IS THE QTY OF CLONES>
					"BatchNumbers": [{
						"BatchNumber": batchNumber, // <THIS IS TAG>
						"Quantity": sObj.Quantity, //<THIS IS THE QTY OF CLONES>
						"Location": sObj.BinLocationCode //<THIS IS FROM CLONE ROOM>
					}],
					"DocumentLinesBinAllocations": [{
						"BinAbsEntry": Number(absExitCall),
						"Quantity": sObj.Quantity,
						"SerialAndBatchNumbersBaseLine": 0
					}]
				});

				batchUrl.push({
					url: "/b1s/v2/InventoryGenExits",
					data: payLoadInventoryExits,
					method: "POST"
				});

				// InventoryEntry
				var payLoadInventoryEntry = {
					"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch, //bplId,
					"Comments": "Manage Packages – Transfer Template",
					"DocumentLines": []
				};
				payLoadInventoryEntry.DocumentLines.push({
					"ItemCode": ItemCode, //<THIS IS SELECTED ITEM> 
					"WarehouseCode": transLoc.split("-")[0], // <THIS IS FROM CLONE ROOM>
					"Quantity": sObj.Quantity, // <THIS IS THE QTY OF CLONES>
					"BatchNumbers": [{
						"BatchNumber": batchNumber, // <THIS IS TAG>
						"Quantity": sObj.Quantity, //<THIS IS THE QTY OF CLONES>
						"Location": transLoc.replace(transLoc.split("-")[0], "").replace("-", "").replace(transLoc.split("-")[1], "").replace("-",
							""), //<THIS IS FROM CLONE ROOM>
						"U_IsPackage": "NO"
					}],
					"DocumentLinesBinAllocations": [{
						"BinAbsEntry": Number(transLoc.split("-")[1]),
						"Quantity": sObj.Quantity,
						"SerialAndBatchNumbersBaseLine": 0
					}]
				});
				batchUrl.push({
					url: "/b1s/v2/InventoryGenEntries",
					data: payLoadInventoryEntry,
					method: "POST"
				});
			});
			jsonModel.setProperty("/errorTxt", []);
			jsonModel.setProperty("/createTrasBusy", true);
			this.createBatchCall(batchUrl, function () {
				var errorTxt = jsonModel.getProperty("/errorTxt");
				if (errorTxt.length > 0) {
					sap.m.MessageBox.error(errorTxt.join("\n"));
				} else {
					sap.m.MessageToast.show("Tranfer completed successfully");
				}
				that.loadMasterData();
				that.InventoryTransferDialog.close();
				jsonModel.setProperty("/createTrasBusy", false);
				inTakeTable.clearSelection();
			});

		},

		//transfer template
		handleTransferTemplate: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var packagesData = jsonModel.getProperty("/packagesData");
			var sModel = new sap.ui.model.json.JSONModel();
			sModel.setProperty("/packagesData", packagesData);
			var selectedLicense = jsonModel.getProperty("/selectedLicense");
			if (!this.transTemDialog) {
				this.transTemDialog = sap.ui.xmlfragment("TransTem", "com.9b.inTake.view.fragments.TransferTemplate", this);
				this.getView().addDependent(this.transTemDialog);
			}
			that.transTemDialog.open();
			that.loadTagsDataInPkg();
			that.loadLocationsDataInPkg();
			var oDateTimePicker = sap.ui.core.Fragment.byId("TransTem", "EstArrival");
			var oCurrentDate = new Date();
			oCurrentDate.setHours(17, 0, 0, 0);
			var formattedDateTime = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "MMM-dd-yyyy hh:mm a"
			}).format(oCurrentDate);

			oDateTimePicker.setValue(formattedDateTime);
			var oDateTimePicker2 = sap.ui.core.Fragment.byId("TransTem", "EstDeparture");
			var oCurrentDate2 = new Date();

			oCurrentDate2.setHours(6, 0, 0, 0);

			var formattedDateTime2 = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "MMM-dd-yyyy hh:mm a"
			}).format(oCurrentDate2);

			oDateTimePicker2.setValue(formattedDateTime2);

			var transTemplate = {
				temName: "",
				transType: "",
				deliveryDate: "",
				arrivalDate: "",
				customer: "",
				salesOrder: "",
				plannedRoute: "",
				driverDetail: "",
				vehicleDetail: "",
				shipinput: "",
				transporter: "",
				valueStateTextdriver: "",
				valueStatephone: "None",
				valueStateTextphone: "",
				valueStateTextvehicle: "",
				valueStateTexttranspoter: "",
				valueStateTextplannedroute: "",
				valueStateTextTemplatetype: "",
				valueStateTextTemplatename: "",
				valueStateshipinput: "None",
				valueStatecustomer: "None",
				valueStateTextCustomer: "",
				valueStateTextshipinput: "",
				valueStateTextsalesorder: "",
				valueStatesalesorder: "None",
				valueStatetemplatename: "None",
				valueStatetemplattype: "None",
				valueStateestdeparture: "None",
				valueStateestarrrival: "None",
				valueStateplannedroute: "None",
				valueStatetranspoter: "None",
				valueStatedriver: "None",
				valueStatevehicle: "None"

			};
			this.getModel("jsonModel").setProperty("/transTemplate", transTemplate);
			this.getModel("jsonModel").setProperty("/driverDataphoneNUM", "");
			this.getModel("jsonModel").setProperty("/shiptoInput", "");
			jsonModel.setProperty("/shippedQtyEditable", false);
			jsonModel.setProperty("/SalesOrderData", []);
			jsonModel.setProperty("/valueStatecustomer", "None");
			jsonModel.setProperty("/valueStateTextCustomer", "");
			jsonModel.setProperty("/valueStatesalesorder", "None");
			jsonModel.setProperty("/valueStateTextsalesorder", "");
			jsonModel.setProperty("/valueStateshipinput", "None");
			jsonModel.setProperty("/valueStateTextshipinput", "Please enter ship to");
			jsonModel.setProperty("/valueStatetemplatename", "None");
			jsonModel.setProperty("/valueStateTextTemplatename", "");
			jsonModel.setProperty("/valueStatetemplattype", "None");
			jsonModel.setProperty("/valueStateTextTemplatetype", "");
			jsonModel.setProperty("/valueStateplannedroute", "None");
			jsonModel.setProperty("/valueStateTextplannedroute", "");
			jsonModel.setProperty("/valueStatetranspoter", "None");
			jsonModel.setProperty("/valueStateTexttranspoter", "");
			jsonModel.setProperty("/valueStatedriver", "None");
			jsonModel.setProperty("/valueStateTextdriver", "");
			jsonModel.setProperty("/valueStatevehicle", "None");
			jsonModel.setProperty("/valueStateTextvehicle", "");
			jsonModel.setProperty("/STATUS", "None");
			jsonModel.setProperty("/STATUSTXT", "");
			jsonModel.setProperty("/TransferTemDocLines", []);
			this.loadDropDownsForTransTemplate();
			sap.ui.core.Fragment.byId("TransTem", "lineTable").setModel(sModel);
		},

		onConfirmTemplateTranfer: function () {
			var that = this;
			var isValidated = true;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var transTemplate = jsonModel.getProperty("/transTemplate");
			if (!transTemplate.customer) {
				jsonModel.setProperty("/valueStatecustomer", "Error");
				jsonModel.setProperty("/valueStateTextCustomer", "Please select customer");
				// transTemplate.valueStatecustomer = "Error";
				// transTemplate.valueStateTextCustomer = "Please select Customer";
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatecustomer", "None");
				jsonModel.setProperty("/valueStateTextCustomer", "");
			}
			if (!transTemplate.salesOrder) {
				jsonModel.setProperty("/valueStatesalesorder", "Error");
				jsonModel.setProperty("/valueStateTextsalesorder", "Please select sales order");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatesalesorder", "None");
				jsonModel.setProperty("/valueStateTextsalesorder", "");
			}
			if (jsonModel.getProperty("/shiptoInput") == "") {
				jsonModel.setProperty("/valueStateshipinput", "Error");
				jsonModel.setProperty("/valueStateTextshipinput", "Please enter ship to");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStateshipinput", "None");
				jsonModel.setProperty("/valueStateTextshipinput", "");
			}
			if (!transTemplate.temName) {
				jsonModel.setProperty("/valueStatetemplatename", "Error");
				jsonModel.setProperty("/valueStateTextTemplatename", "Please enter template name");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatetemplatename", "None");
				jsonModel.setProperty("/valueStateTextTemplatename", "");
			}
			if (!transTemplate.transType) {
				jsonModel.setProperty("/valueStatetemplattype", "Error");
				jsonModel.setProperty("/valueStateTextTemplatetype", "Please enter template type");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatetemplattype", "None");
				jsonModel.setProperty("/valueStateTextTemplatetype", "");
			}
			if (!transTemplate.plannedRoute) {
				jsonModel.setProperty("/valueStateplannedroute", "Error");
				jsonModel.setProperty("/valueStateTextplannedroute", "Please enter planned route");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStateplannedroute", "None");
				jsonModel.setProperty("/valueStateTextplannedroute", "");
			}
			if (!transTemplate.transporter) {
				jsonModel.setProperty("/valueStatetranspoter", "Error");
				jsonModel.setProperty("/valueStateTexttranspoter", "Please select transporter");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatetranspoter", "None");
				jsonModel.setProperty("/valueStateTexttranspoter", "");
			}
			if (!transTemplate.driverDetail) {
				jsonModel.setProperty("/valueStatedriver", "Error");
				jsonModel.setProperty("/valueStateTextdriver", "Please select driver detail");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatedriver", "None");
				jsonModel.setProperty("/valueStateTextdriver", "");
			}
			transTemplate.vehicleDetail = sap.ui.core.Fragment.byId("TransTem", "vehicleDetails").getSelectedKey();
			if (!transTemplate.vehicleDetail) {
				jsonModel.setProperty("/valueStatevehicle", "Error");
				jsonModel.setProperty("/valueStateTextvehicle", "Please select vehicle detail");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatevehicle", "None");
				jsonModel.setProperty("/valueStateTextvehicle", "");
			}
			var sPackages = jsonModel.getProperty("/TransferTemDocLines");

			if (sPackages[0].PACKAGE == undefined || sPackages[0].PACKAGE == null) {
				sap.m.MessageToast.show("Please select Package Tags");
				// jsonModel.setProperty("/STATUS", "Error");
				// jsonModel.setProperty("/STATUSTXT", "Please select Package Tags");
				isValidated = false;
			} else {
				// jsonModel.setProperty("/STATUS", "None");
				// jsonModel.setProperty("/STATUSTXT", "");
				isValidated = true;
			}

			if (isValidated) {

				var shippedInputId = sap.ui.core.Fragment.byId("TransferTemDocLines", "shippedInputId");
				var customer = sap.ui.core.Fragment.byId("TransTem", "customer");
				var customerObj = customer.getSelectedItem().getBindingContext("jsonModel").getObject();
				var salesOrder = sap.ui.core.Fragment.byId("TransTem", "salesOrder");
				var salesOrderObj = salesOrder.getSelectedItem().getBindingContext("jsonModel").getObject();
				var driverDetails = sap.ui.core.Fragment.byId("TransTem", "driverDetails");
				var driverObj = driverDetails.getSelectedItem().getBindingContext("jsonModel").getObject();
				var vehicleDetails = sap.ui.core.Fragment.byId("TransTem", "vehicleDetails");
				var vehicleObj = vehicleDetails.getSelectedItem().getBindingContext("jsonModel").getObject();
				var tranporterDetails = sap.ui.core.Fragment.byId("TransTem", "transporter");
				var tranporterObj = tranporterDetails.getSelectedItem().getBindingContext("jsonModel").getObject();
				var baseLine = salesOrder.getSelectedItem().getBindingContext("jsonModel").getPath().split("/")[2];
				var deptDate = sap.ui.core.Fragment.byId("TransTem", "EstDeparture").getValue();
				var arrDate = sap.ui.core.Fragment.byId("TransTem", "EstArrival").getValue();
				var payloadTransfer = {
					"CardCode": transTemplate.customer,
					"DocDueDate": that.convertUTCDateMETRC(arrDate),
					"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
					"U_Driver": transTemplate.driverDetail,
					"U_Vehicle": transTemplate.vehicleDetail,
					"U_Transfer": transTemplate.temName,
					"U_TransferType": transTemplate.transType,
					"OpeningRemarks": transTemplate.plannedRoute,
					"U_SNBICO": salesOrderObj.U_SNBICO,
					"U_DelDate": that.convertUTCDateMETRC(arrDate),
					DocumentLines: []
				};
				var itemObj, updatePayload;
				var metricPayloadForTT = [];
				var metrcObj = {
					Name: transTemplate.temName,
					TransporterFacilityLicenseNumber: tranporterObj.Code,
					//	DriverOccupationalLicenseNumber: driverObj.U_NLCNM,
					DriverName: driverObj.Name,
					DriverLicenseNumber: driverObj.U_NLCNM,
					PhoneNumberForQuestions: driverObj.U_NPHNE,
					VehicleMake: vehicleObj.U_NVHMK,
					VehicleModel: vehicleObj.U_NVHMD,
					VehicleLicensePlateNumber: vehicleObj.U_NVHLC,
					Destinations: [{
						RecipientLicenseNumber: jsonModel.getProperty("/shiptoInput"),
						TransferTypeName: transTemplate.transType,
						PlannedRoute: jsonModel.getProperty("/transTemplate/plannedRoute"),
						EstimatedDepartureDateTime: that.convertUTCDateMETRC(deptDate),
						EstimatedArrivalDateTime: that.convertUTCDateMETRC(arrDate),
						Transporters: [{
							TransporterFacilityLicenseNumber: tranporterObj.Code,
							//	DriverOccupationalLicenseNumber: "U_NLCNM",
							DriverName: driverObj.Name,
							DriverLicenseNumber: driverObj.U_NLCNM,
							PhoneNumberForQuestions: driverObj.U_NPHNE,
							VehicleMake: vehicleObj.U_NVHMK,
							VehicleModel: vehicleObj.U_NVHMD,
							VehicleLicensePlateNumber: vehicleObj.U_NVHLC,
							IsLayover: false,
							EstimatedDepartureDateTime: that.convertUTCDateMETRC(deptDate),
							EstimatedArrivalDateTime: that.convertUTCDateMETRC(arrDate),
						}],
						Packages: []
					}]
				};
				var newPkgData = [],
					newPkgTags = [],
					cObj;
				$.each(sPackages, function (lineNum, sObj) {
					if (sObj.NEWPKG !== "" && sObj.NEWPKG !== "Select a New Tag") {
						cObj = {...sObj
						};
						newPkgData.push(that.createPkgForTransfer(cObj, that));
						newPkgTags.push(sObj.NEWPKG);
					}

					var insideArray = [];
					itemObj = {
						"LineNum": lineNum,
						"ItemCode": sObj.ItemCode,
						"Quantity": sObj.shippedQuantity,
						"WarehouseCode": sObj.WarehouseCode,
						"U_InternalBatch": sObj.PACKAGE[0],
						"U_Strain": "",
						"BaseType": 17,
						"BaseEntry": sObj.DocEntry,
						"BaseLine": sObj.LineNum,
						"CostingCode": sObj.CostingCode,
						"COGSCostingCode": sObj.COGSCostingCode,
						BatchNumbers: []
					};

					$.each(sObj.PACKAGE, function (j, pkg) {
						var rObj2 = $.grep(sObj.pkgData, function (pObj) {
							if (pkg == pObj.METRCUID) {
								return pObj;
							}
						});
						if (rObj2.length > 0) {
							var insideDocumentLines = {
								"BatchNumber": rObj2[0].METRCUID,
								"Location": rObj2[0].BinLocationCode,
								"Quantity": rObj2[0].Quantity,
								"ItemCode": rObj2[0].ItemCode
							};
							if (sObj.NEWPKG !== "" && sObj.NEWPKG !== "Select a New Tag") {
								insideDocumentLines.BatchNumber = sObj.NEWPKG;
								insideDocumentLines.Quantity = Number(sObj.shippedQuantityfromReqQty);
							}
							itemObj.BatchNumbers.push(insideDocumentLines);
						}

					});

					payloadTransfer.DocumentLines.push(itemObj);

					var dpkgObj, dpTag;
					if (sObj.AQTY && !sObj.isCannItem) {
						$.each(sObj.PACKAGE, function (index, tag) {
							if (sObj.NEWPKG !== "" && sObj.NEWPKG !== "Select a New Tag") {
								dpTag = sObj.NEWPKG;
							} else {
								dpTag = tag;
							}
							var dpkgObj = {
								PackageLabel: dpTag,
								WholesalePrice: null
							};
							metrcObj.Destinations[0].Packages.push(dpkgObj);
						});

					}
				});
				var checkForDuplicates = that.checkForDuplicates(newPkgTags);
				if (checkForDuplicates) {
					sap.m.MessageToast.show("Duplicate tags found");
					return;
				}
				metricPayloadForTT.push(metrcObj);
				if (newPkgData.length > 0) {
					Promise.allSettled(newPkgData).then(function (values) {
						if (values.length === newPkgData.length) {
							that.confirmCreateTrasferTemplate(payloadTransfer, metricPayloadForTT, that);
						}

					});
				} else {
					this.confirmCreateTrasferTemplate(payloadTransfer, metricPayloadForTT, that);
				}

			}
		},
		confirmCreateTrasferTemplate: function (payloadTransfer, metricPayloadForTT, that) {
			if (payloadTransfer.DocumentLines.length > 0) {
				var jsonModel = this.getOwnerComponent().getModel("jsonModel");
				var metrcData = jsonModel.getProperty("/metrcData");
				if (metrcData && metrcData.U_NACST === "X") {
					//	var metrcUrl = "/packages/v1/change/locations?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
					var metrcUrl = "/transfers/v2/templates/outgoing?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
					that.callMetricsService(metrcUrl, "POST", metricPayloadForTT, function () {
						sap.m.MessageToast.show("METRC sync completed successfully");
						that.transTemInternalPostings(payloadTransfer, that.transTemDialog);
					}, function (error) {
						that.transTemDialog.setBusy(false);
						//	sap.m.MessageToast.show(JSON.stringify(error));
					});
				} else {
					that.transTemInternalPostings(payloadTransfer, that.transTemDialog);
				}
			} else {
				sap.m.MessageToast.show("Please select mandatory fields");
			}
		},

		transTemInternalPostings: function (payloadTransfer, transTemDialog) {
			var that = this;
			that.updateServiecLayer("/b1s/v2/DeliveryNotes", function (evt) {
				sap.m.MessageToast.show("Template created successfully");
				that.loadMasterData();
				that.getModel("jsonModel").setProperty("/driverDataphoneNUM", "");
				that.getModel("jsonModel").setProperty("/shiptoInput", "");
				transTemDialog.close();
			}.bind(that), payloadTransfer, "POST", transTemDialog);
		},

		templateTransClose: function () {
			var transTemDialog = this.transTemDialog;
			sap.m.MessageBox.warning("Your entries will be lost when you leave this page.", {
				actions: ["Leave Page", "Cancel"],
				onClose: function (evt) {
					if (evt === "Leave Page") {
						transTemDialog.close();
					}
				}
			});

		},

		prepareListItem: function (sId, oContext) {
			var sObj = oContext.getObject();
			sObj.fLineNum = Number(sObj.LineNum) + 1;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var canitemsList = jsonModel.getProperty("/canitemsList");
			var packagesData = jsonModel.getProperty("/packagesData");
			var rObj = $.grep(packagesData, function (pkgObj) {
				if (pkgObj.ItemCode === sObj.ItemCode) {
					return pkgObj;
				}
			});
			var rItem = $.grep(canitemsList, function (cItem) {
				if (cItem.ItemCode && cItem.ItemCode === sObj.ItemCode) {
					return cItem;
				}
			});
			var isCannItem = false;
			if (rItem.length > 0 && rItem[0].U_ISCANNABIS === "Y") {
				isCannItem = true;
			}
			var tableModel = new sap.ui.model.json.JSONModel();
			tableModel.setProperty("/pkgData", rObj);
			sObj.pkgData = rObj;
			sObj.isCannItem = !isCannItem;
			//	sObj.AQTY = sObj.RemainingOpenQuantity;
			var shippedInput;
			if (sObj.isCannItem) {
				shippedInput = new sap.m.Input({
					value: '{jsonModel>shippedQuantityfromReqQty}'
				});
			} else {
				shippedInput = new sap.m.Text({
					text: '{jsonModel>shippedQuantityfromReqQty}'
				});
			}

			var pkgInput = new sap.m.MultiComboBox({
				//	id: "packageTagMulticombo",
				//	change: [this.onSuggestPkgSelected, this],
				selectionChange: [this.onSuggestPkgSelectionChange, this],
				selectionFinish: [this.onSuggestSelectionFinish, this],
				selectedKeys: "{jsonModel>PACKAGE}",
				width: "100%",
				showClearIcon: true,
				valueState: "{jsonModel>STATUS}",
				valueStateText: "{jsonModel>STATUSTXT}",
				showSecondaryValues: true,
				//	filterSecondaryValues: true,
				items: {
					path: '/pkgData',
					template: new sap.ui.core.ListItem({
						text: "{METRCUID}",
						key: "{METRCUID}",
						additionalText: "{Quantity}"
					})
				},
			});

			pkgInput.setFilterFunction(function (sTerm, oItem) {
				return oItem.getText().match(new RegExp(sTerm, "i")) || oItem.getKey().match(new RegExp(sTerm, "i"));
			});
			pkgInput.setModel(tableModel);
			var newPkgSelect = new sap.m.Select({
				forceSelection: true,
				width: "100%",
				selectedKey: "{jsonModel>NEWPKG}",
				valueState: "{jsonModel>STATUSTAG}",
				visible: "{jsonModel>SHOWNEWPKG}",
				valueStateText: "{jsonModel>TAGTXT}",
				items: {
					path: '/harvestTagsData',
					template: new sap.ui.core.Item({
						key: "{Label}",
						text: "{Label}"
					})
				},
				change: [this.onChangeNewPkgForTransfer, this],
			});
			var harvestTagsData = jsonModel.getProperty("/harvestTagsData");
			var cloneHarvestTagData = JSON.parse(JSON.stringify(harvestTagsData));
			var tableModel2 = new sap.ui.model.json.JSONModel();
			newPkgSelect.setModel(tableModel2);
			var dummyObj = {
				Label: "Select a New Tag"
			};
			cloneHarvestTagData.unshift(dummyObj);
			tableModel2.setProperty("/harvestTagsData", cloneHarvestTagData);
			sObj.NEWPKG = "Select a New Tag";
			return new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{jsonModel>fLineNum}"
					}),
					new sap.m.Text({
						text: "{jsonModel>ItemCode} {jsonModel>ItemDescription}"
					}),
					new sap.m.Text({
						text: "{jsonModel>RemainingOpenQuantity}"
					}),
					new sap.m.Text({
						text: "{jsonModel>UoMCode}"
					}),
					new sap.m.Text({
						text: "{jsonModel>UnitPrice}"
					}),
					new sap.m.VBox({
						items: [pkgInput,
							newPkgSelect
						]
					}),
					new sap.m.Text({
						text: "{jsonModel>AQTY}"
					}),
					shippedInput
				]
			});
		},
		onChangeNewPkgForTransfer: function (evt) {
			var newpkg = [];
			var linesData = evt.getSource().getModel("jsonModel").getProperty("/TransferTemDocLines");
			$.each(linesData, function (i, e) {
				if (e.NEWPKG && e.NEWPKG !== "Select a New Tag") {
					newpkg.push(e.NEWPKG);
				}
			});

			var checkState, newTagStatus;
			if (this.checkForDuplicates(newpkg)) {
				checkState = "Error";
				newTagStatus = "Duplicate tags found";
			} else {
				checkState = "None";
				newTagStatus = "";
			}
			$.each(linesData, function (i, e) {
				e.STATUSTAG = checkState;
				e.TAGTXT = newTagStatus;
			});
		},

		loadDropDownsForTransTemplate: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			jsonModel.setProperty("/BPDataBusy", true);
			var busPartner = [];
			var custFilters = "?$select=CardCode,CardName,CardForeignName,Address,City,Country,ZipCode&$filter=CardType eq 'cCustomer'";
			this.readServiecLayer("/b1s/v2/BusinessPartners" + custFilters, function (bpData) {
				jsonModel.setProperty("/BPData", bpData.value);

				$.each(bpData.value, function (i, e) {
					if (e.CardForeignName != null) {
						busPartner.push(e);
					}
				});
				jsonModel.setProperty("/busPartnerData", busPartner);

				jsonModel.setProperty("/BPDataBusy", false);
			});

			jsonModel.setProperty("/TransporterDataBusy", true);
			this.readServiecLayer("/b1s/v2/U_NTRANS", function (transData) {
				jsonModel.setProperty("/TransporterData", transData.value);
				jsonModel.setProperty("/TransporterDataBusy", false);
			});
			jsonModel.setProperty("/DriverData", []);
			jsonModel.setProperty("/VehicleData", []);
			var fieldsItem = "?$select=" + ["ItemCode", "ItemName", "U_ISCANNABIS"].join();
			this.readServiecLayer("/b1s/v2/Items" + fieldsItem, function (data1) {
				jsonModel.setProperty("/canitemsList", data1.value);
			});
		},

		onCustomerSelect: function (evt) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			jsonModel.setProperty("/SalesOrderData", []);
			jsonModel.setProperty("/valueStatecustomer", "None");
			jsonModel.setProperty("/valueStateTextCustomer", "");
			jsonModel.setProperty("/orderDataBusy", true);
			var sCustomer = evt.getSource().getSelectedKey();
			var sSelect = "?$select=CardCode,DocumentStatus,DocNum,U_SNBICO";
			var sFilter = "&$filter=DocumentStatus eq 'bost_Open' PickStatus eq 'tYES' and CardCode eq '" + sCustomer + "'";
			// var sFilter = "&$filter=DocumentStatus eq 'bost_Open' and CardCode eq '" + sCustomer + "' and LineStatus eq 'bost_Open'";
			this.readServiecLayer("/b1s/v2/Orders" + sSelect + sFilter, function (orderData) {
				jsonModel.setProperty("/SalesOrderData", orderData.value);
				jsonModel.setProperty("/orderDataBusy", false);

			});
		},

		onSalesOrderSelect: function (evt) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			jsonModel.setProperty("/tableBusy", true);
			jsonModel.setProperty("/valueStatesalesorder", "None");
			jsonModel.setProperty("/valueStateTextsalesorder", "");
			var orderDataArray = [];
			var sOrder = evt.getSource().getSelectedKey();
			var sSelect = "?$select=DocumentLines,AddressExtension,DocNum";
			var sFilter = "&$filter=DocumentStatus eq 'bost_Open' and DocNum eq " + sOrder;
			var sort = "&$sort=DocNum"
			this.readServiecLayer("/b1s/v2/Orders" + sSelect + sFilter, function (orderData) {
				if (orderData.value.length > 0) {
					$.each(orderData.value[0].DocumentLines, function (i, Obj) {
						if (Obj.LineStatus == "bost_Open") {
							Obj.shippedQuantityfromReqQty = Obj.RemainingOpenQuantity;
							Obj.SHOWNEWPKG = false;
							orderDataArray.push(Obj);
						}
					});

					jsonModel.setProperty("/TransferTemDocLines", orderDataArray);
					jsonModel.setProperty("/shiptoInput", orderData.value[0].AddressExtension.U_METRCS);
				} else {
					jsonModel.setProperty("/TransferTemDocLines", []);
				}

				jsonModel.setProperty("/tableBusy", false);
			});
		},

		onSuggestSelectionFinish: function (evt) {
			var lineObj = evt.getSource().getBindingContext("jsonModel").getObject();
			var sItems = evt.getSource().getSelectedItems();
			var qty = 0,
				showNewPkg;
			$.each(sItems, function (i, e) {
				qty = qty + Number(e.getAdditionalText());
			});
			qty = Number(qty.toFixed(4));
			lineObj.STATUS = "None";
			lineObj.STATUSTXT = "";
			if (qty > lineObj.RemainingOpenQuantity) {
				showNewPkg = true;
			} else {
				showNewPkg = false;
			}

			lineObj.SHOWNEWPKG = showNewPkg;
			var sModel = evt.getSource().getModel("jsonModel");
			var sPath = evt.getSource().getBindingContext("jsonModel").getPath();
			sModel.setProperty(sPath, lineObj);

		},

		onSuggestPkgSelectionChange: function (evt) {
			var isSelected = evt.getParameter("selected");
			var sKeys = evt.getSource().getSelectedKeys();
			var sItems = evt.getSource().getSelectedItems();
			var lineObj = evt.getSource().getBindingContext("jsonModel").getObject();
			var sPkgObj = evt.getParameter("changedItem").getBindingContext().getObject();
			var sourcePkgData = {...sPkgObj
			};
			lineObj.sourcePkgData = sourcePkgData;
			var qty = 0,
				isError = false;
			$.each(sItems, function (i, e) {
				qty = qty + Number(e.getAdditionalText());
			});
			qty = Number(qty.toFixed(4));
			if (qty > lineObj.RemainingOpenQuantity) {
				isError = true;
			}
			if (isError) {
				lineObj.AQTY = qty;
				lineObj.STATUS = "Information";
				lineObj.STATUSTXT = "Selected package qty is more than required qty.";
			} else {
				lineObj.AQTY = qty;
				lineObj.STATUS = "None";
				lineObj.STATUSTXT = "";
			}
			var sModel = evt.getSource().getModel("jsonModel");
			var sPath = evt.getSource().getBindingContext("jsonModel").getPath();
			sModel.setProperty(sPath, lineObj);

		},

		onSuggestPkgSelected: function (evt) {
			var that = this;
			var totalSelectedtagQty = 0,
				index;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var TransferTemDocLines = "packageTagMulticombo";
			var newValue = evt.getParameter("newValue");
			var lineObj = evt.getSource().getParent().getBindingContext("jsonModel").getObject();
			var pkgData = evt.getSource().getParent().getBindingContext("jsonModel").getObject().pkgData;

			if (newValue) {
				if (lineObj.RemainingOpenQuantity >= totalSelectedtagQty) {
					lineObj.AQTY = totalSelectedtagQty;
					lineObj.STATUS = "None";
					lineObj.STATUSTXT = "";
				} else {
					lineObj.AQTY = totalSelectedtagQty;
					lineObj.STATUS = "Error";
					lineObj.STATUSTXT = "selected package qty has more than remaining qty";
				}
			} else {
				lineObj.AQTY = totalSelectedtagQty;
				lineObj.STATUS = "None";
				lineObj.STATUSTXT = "";
			}
		},

		onTransportChange: function (evt) {
			var sObj = evt.getParameter("selectedItem").getBindingContext("jsonModel").getObject();
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			jsonModel.setProperty("/driverDataphoneNUM", "");
			jsonModel.setProperty("/driverDataBusy", true);
			jsonModel.setProperty("/valueStatevehicle", "None");
			jsonModel.setProperty("/valueStateTextvehicle", "");
			var sFilters = "?$filter=U_NTRAN eq " + "'" + sObj.Code + "' ";
			this.readServiecLayer("/b1s/v2/U_DRIVERDETAILS" + sFilters, function (driverDetails) {
				jsonModel.setProperty("/DriverData", driverDetails.value);
				jsonModel.setProperty("/driverDataBusy", false);
				this.ondriverdetailsChange();
			});
			jsonModel.setProperty("/vehicleDataBusy", true);
			this.readServiecLayer("/b1s/v2/U_VEHICLEDETAILS" + sFilters, function (vehicleDetails) {
				jsonModel.setProperty("/VehicleData", vehicleDetails.value);
				jsonModel.setProperty("/vehicleDataBusy", false);
			});

		},

		ondriverdetailsChange: function (evt) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			if (evt == undefined) {
				var DriverData = jsonModel.getProperty("/DriverData");
				if (DriverData.length > 0) {
					jsonModel.setProperty("/driverDataphoneNUM", DriverData[0].U_NPHNE);
				}
			} else {
				var sObj = evt.getParameter("selectedItem").getBindingContext("jsonModel").getObject();
				jsonModel.setProperty("/driverDataphoneNUM", sObj.U_NPHNE);

			}

		},

		handleChange1: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			// var data = new Date(sValue);
			// data.setHours("06");
			// data.setMinutes("00");
			// data.setSeconds("00");
			var datatest = new Date(sValue);
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MMM-dd-yyyy hh:mm a"
			});
			var newdateT = dateFormat.format(datatest);
			sap.ui.core.Fragment.byId("TransTem", "EstDeparture").setValue(newdateT);
		},

		handleChange2: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			// var data = new Date(sValue);
			// data.setHours("17");
			// data.setMinutes("00");
			// data.setSeconds("00");
			var datatest = new Date(sValue);
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MMM-dd-yyyy hh:mm a"
			});
			var newdateT = dateFormat.format(datatest);
			sap.ui.core.Fragment.byId("TransTem", "EstArrival").setValue(newdateT);
		},

		handleChange11: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			// var data = new Date(sValue);
			// data.setHours("06");
			// data.setMinutes("00");
			// data.setSeconds("00");
			var datatest = new Date(sValue);
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MMM-dd-yyyy hh:mm a"
			});
			var newdateT = dateFormat.format(datatest);
			sap.ui.core.Fragment.byId("InventoryTransferDialog", "EstDeparture").setValue(newdateT);
		},

		handleChange22: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			// var data = new Date(sValue);
			// data.setHours("17");
			// data.setMinutes("00");
			// data.setSeconds("00");
			var datatest = new Date(sValue);
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MMM-dd-yyyy hh:mm a"
			});
			var newdateT = dateFormat.format(datatest);
			sap.ui.core.Fragment.byId("InventoryTransferDialog", "EstArrival").setValue(newdateT);
		},

		onCombineItemSelected: function (evt) {
			var oItem = evt.getParameter("suggestionItem");
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			if (oItem) {
				var sObj = oItem.getBindingContext("jsonModel").getObject();
				jsonModel.setProperty("/combineObj", sObj);
			} else if (evt.getParameter("clearButtonPressed")) {
				evt.getSource().fireSuggest();

			}
		},
		onSuggestCombineItem: function (event) {
			this.oSFC = event.getSource();
			var sValue = event.getParameter("suggestValue"),
				aFilters = [];
			if (sValue) {
				aFilters = [
					new Filter([
						new Filter("ItemName", function (sDes) {
							return (sDes || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
						})
					], false)
				];
			}

			this.oSFC.getBinding("suggestionItems").filter(aFilters);
			this.oSFC.suggest();
		},

		//transfer template end

		// Inventory transfer starts

		createTransferCancel: function () {
			this.InventoryTransferDialog.close();
		},

		handleInventoryTransfer: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var mainlicense = jsonModel.getProperty("/selectedLicense");
			var selectedBranchNUM = jsonModel.getProperty("/selectedBranchNUM");
			// var isPhone = deviceModel.getProperty("/system/phone");
			// var dateFormat = DateFormat.getDateTimeInstance({
			// 	pattern: 'MM-dd-yyyy h:mm a'
			// });
			var filters = "?$filter=U_MetrcLicense eq " + "'" + mainlicense + "' and not(startswith(BinCode,'LIC'))";
			jsonModel.setProperty("/ComboBoxBusy", true);
			var fields = "&$select=" + ["U_MetrcLicense", "U_MetrcLocation", "Sublevel2", "BinCode", "AbsEntry", "Warehouse"].join();
			this.readServiecLayer("/b1s/v2/BinLocations" + filters + fields, function (data) {
				jsonModel.setProperty("/ComboBoxBusy", false);
				jsonModel.setProperty("/allLocationList", data.value);
			});

			var sItems, licenselistfortrans = [];
			var table = this.getView().byId("inTakeTable");
			//var transferdata = table.getContextByIndex(e).getObject();
			var inventoryTransferTem = [];
			sItems = table.getSelectedIndices();
			var sObj;
			$.each(sItems, function (i, e) {
				sObj = table.getContextByIndex(e).getObject();
				inventoryTransferTem.push(sObj);
			});

			jsonModel.setProperty("/inventoryTransferTem", inventoryTransferTem);
			// this.loadDropDownDataForTransfer();
			if (sItems.length > 0) {
				jsonModel.setProperty("/tranferdata", sItems);
				if (!this.InventoryTransferDialog) {
					this.InventoryTransferDialog = sap.ui.xmlfragment("InventoryTransferDialog",
						"com.9b.inTake.view.fragments.InventoryTransferDialog",
						this);
					this.getView().addDependent(this.InventoryTransferDialog);
				}
				var oDateTimePicker = sap.ui.core.Fragment.byId("InventoryTransferDialog", "EstArrival");
				var oCurrentDate = new Date();
				oCurrentDate.setHours(17, 0, 0, 0);
				var formattedDateTime = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "MMM-dd-yyyy hh:mm a"
				}).format(oCurrentDate);

				oDateTimePicker.setValue(formattedDateTime);
				var oDateTimePicker2 = sap.ui.core.Fragment.byId("InventoryTransferDialog", "EstDeparture");
				var oCurrentDate2 = new Date();

				oCurrentDate2.setHours(6, 0, 0, 0);

				var formattedDateTime2 = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "MMM-dd-yyyy hh:mm a"
				}).format(oCurrentDate2);

				oDateTimePicker2.setValue(formattedDateTime2);
				this.loadDropDownsForTransTemplate();
				var transTemplate = {
					temName: "",
					transType: "",
					deliveryDate: "",
					arrivalDate: "",
					customer: "",
					salesOrder: "",
					plannedRoute: "",
					driverDetail: "",
					vehicleDetail: "",
					shipinput: "",
					transporter: "",
					valueStateTextdriver: "",
					valueStatephone: "None",
					valueStateTextphone: "",
					valueStateTextvehicle: "",
					valueStateTexttranspoter: "",
					valueStateTextplannedroute: "",
					valueStateTextTemplatetype: "",
					valueStateTextTemplatename: "",
					valueStateshipinput: "None",
					valueStatecustomer: "None",
					valueStateTextCustomer: "",
					valueStateTextshipinput: "",
					valueStateTextsalesorder: "",
					valueStatesalesorder: "None",
					valueStatetemplatename: "None",
					valueStatetemplattype: "None",
					valueStateestdeparture: "None",
					valueStateestarrrival: "None",
					valueStateplannedroute: "None",
					valueStatetranspoter: "None",
					valueStatedriver: "None",
					valueStatevehicle: "None"

				};
				this.getModel("jsonModel").setProperty("/transTemplate", transTemplate);
				this.getModel("jsonModel").setProperty("/driverDataphoneNUM", "");
				this.getModel("jsonModel").setProperty("/shiptoInput", "");
				jsonModel.setProperty("/shippedQtyEditable", false);
				jsonModel.setProperty("/valueStatetemplatename", "None");
				jsonModel.setProperty("/valueStateTextTemplatename", "");
				jsonModel.setProperty("/valueStatetemplattype", "None");
				jsonModel.setProperty("/valueStateTextTemplatetype", "");
				jsonModel.setProperty("/valueStateplannedroute", "None");
				jsonModel.setProperty("/valueStateTextplannedroute", "");
				jsonModel.setProperty("/valueStatetranspoter", "None");
				jsonModel.setProperty("/valueStateTexttranspoter", "");
				jsonModel.setProperty("/valueStatedriver", "None");
				jsonModel.setProperty("/valueStateTextdriver", "");
				jsonModel.setProperty("/valueStatevehicle", "None");
				jsonModel.setProperty("/valueStateTextvehicle", "");
				jsonModel.setProperty("/STATUS", "None");
				jsonModel.setProperty("/STATUSTXT", "");
				jsonModel.setProperty("/TransferTemDocLines", []);

				sap.ui.core.Fragment.byId("InventoryTransferDialog", "licenseForTras").setSelectedKey();
				sap.ui.core.Fragment.byId("InventoryTransferDialog", "locationForTras").setSelectedKey();
				this.InventoryTransferDialog.open();

			} else {
				sap.m.MessageToast.show("Please select a batch");
			}

			var filter = "?$filter=U_NBRCD eq '" + selectedBranchNUM + "'";

			this.readServiecLayer("/b1s/v2/U_SNBLIC" + filter, function (data) {

				// jsonModel.setProperty("/licenseList2", data.value);
				let i = 0;
				while (i < data.value.length) {
					var licenseForTrans = data.value;
					if (mainlicense !== licenseForTrans[i].Code) {
						licenselistfortrans.push(licenseForTrans[i]);
					}
					jsonModel.setProperty("/licenseList2", licenselistfortrans);
					i++;
				}
			});

			// var licenseName = jsonModel.getProperty("/LicenseName");

		},

		onInventoryTranfer: function () {
			var that = this;
			var isValidated = true;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var transTemplate = jsonModel.getProperty("/transTemplate");
			var allItemsList = jsonModel.getProperty("/allItemsList");

			if (!transTemplate.temName) {
				jsonModel.setProperty("/valueStatetemplatename", "Error");
				jsonModel.setProperty("/valueStateTextTemplatename", "Please enter template name");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatetemplatename", "None");
				jsonModel.setProperty("/valueStateTextTemplatename", "");
			}
			if (!transTemplate.transType) {
				jsonModel.setProperty("/valueStatetemplattype", "Error");
				jsonModel.setProperty("/valueStateTextTemplatetype", "Please enter template type");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatetemplattype", "None");
				jsonModel.setProperty("/valueStateTextTemplatetype", "");
			}
			if (!transTemplate.plannedRoute) {
				jsonModel.setProperty("/valueStateplannedroute", "Error");
				jsonModel.setProperty("/valueStateTextplannedroute", "Please enter planned route");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStateplannedroute", "None");
				jsonModel.setProperty("/valueStateTextplannedroute", "");
			}
			if (!transTemplate.transporter) {
				jsonModel.setProperty("/valueStatetranspoter", "Error");
				jsonModel.setProperty("/valueStateTexttranspoter", "Please select transporter");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatetranspoter", "None");
				jsonModel.setProperty("/valueStateTexttranspoter", "");
			}
			if (!transTemplate.driverDetail) {
				jsonModel.setProperty("/valueStatedriver", "Error");
				jsonModel.setProperty("/valueStateTextdriver", "Please select driver detail");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatedriver", "None");
				jsonModel.setProperty("/valueStateTextdriver", "");
			}
			transTemplate.vehicleDetail = sap.ui.core.Fragment.byId("InventoryTransferDialog", "vehicleDetails").getSelectedKey();
			if (!transTemplate.vehicleDetail) {
				jsonModel.setProperty("/valueStatevehicle", "Error");
				jsonModel.setProperty("/valueStateTextvehicle", "Please select vehicle detail");
				isValidated = false;
			} else {
				jsonModel.setProperty("/valueStatevehicle", "None");
				jsonModel.setProperty("/valueStateTextvehicle", "");
			}
			var sPackages = jsonModel.getProperty("/TransferTemDocLines");

			if (isValidated) {
				var shippedInputId = sap.ui.core.Fragment.byId("TransferTemDocLines", "shippedInputId");
				// var customer = sap.ui.core.Fragment.byId("InventoryTransferDialog", "customer");
				// var customerObj = customer.getSelectedItem().getBindingContext("jsonModel").getObject();
				// var salesOrder = sap.ui.core.Fragment.byId("InventoryTransferDialog", "salesOrder");
				// var salesOrderObj = salesOrder.getSelectedItem().getBindingContext("jsonModel").getObject();
				var driverDetails = sap.ui.core.Fragment.byId("InventoryTransferDialog", "driverDetails");
				var driverObj = driverDetails.getSelectedItem().getBindingContext("jsonModel").getObject();
				var vehicleDetails = sap.ui.core.Fragment.byId("InventoryTransferDialog", "vehicleDetails");
				var vehicleObj = vehicleDetails.getSelectedItem().getBindingContext("jsonModel").getObject();
				var tranporterDetails = sap.ui.core.Fragment.byId("InventoryTransferDialog", "transporter");
				var tranporterObj = tranporterDetails.getSelectedItem().getBindingContext("jsonModel").getObject();
				// var baseLine = salesOrder.getSelectedItem().getBindingContext("jsonModel").getPath().split("/")[2];
				var deptDate = sap.ui.core.Fragment.byId("InventoryTransferDialog", "EstDeparture").getValue();
				var arrDate = sap.ui.core.Fragment.byId("InventoryTransferDialog", "EstArrival").getValue();

				var itemObj, updatePayload;
				var metricPayload = [];
				var metrcObj = {
					Name: transTemplate.temName,
					TransporterFacilityLicenseNumber: tranporterObj.Code,
					//	DriverOccupationalLicenseNumber: driverObj.U_NLCNM,
					DriverName: driverObj.Name,
					DriverLicenseNumber: driverObj.U_NLCNM,
					PhoneNumberForQuestions: driverObj.U_NPHNE,
					VehicleMake: vehicleObj.U_NVHMK,
					VehicleModel: vehicleObj.U_NVHMD,
					VehicleLicensePlateNumber: vehicleObj.U_NVHLC,
					Destinations: [{
						RecipientLicenseNumber: jsonModel.getProperty("/transLincense"),
						TransferTypeName: transTemplate.transType,
						PlannedRoute: jsonModel.getProperty("/transTemplate/plannedRoute"),
						EstimatedDepartureDateTime: that.convertUTCDateMETRC(deptDate),
						EstimatedArrivalDateTime: that.convertUTCDateMETRC(arrDate),
						Transporters: [{
							TransporterFacilityLicenseNumber: tranporterObj.Code,
							//	DriverOccupationalLicenseNumber: "U_NLCNM",
							DriverName: driverObj.Name,
							DriverLicenseNumber: driverObj.U_NLCNM,
							PhoneNumberForQuestions: driverObj.U_NPHNE,
							VehicleMake: vehicleObj.U_NVHMK,
							VehicleModel: vehicleObj.U_NVHMD,
							VehicleLicensePlateNumber: vehicleObj.U_NVHLC,
							IsLayover: false,
							EstimatedDepartureDateTime: that.convertUTCDateMETRC(deptDate),
							EstimatedArrivalDateTime: that.convertUTCDateMETRC(arrDate),
						}],
						Packages: []
					}]
				};

				var table = this.getView().byId("inTakeTable");
				var sItems = table.getSelectedIndices();
				var payloadTransfer = [],
					metrcPackageArr = [];

				$.each(sItems, function (lineNum, e) {
					var sObj = table.getContextByIndex(e).getObject();
					var ObjMETRC = {
						PackageLabel: sObj.METRCUID,
						WholesalePrice: null
					};

					// metrcPackageArr.push(ObjMETRC);
					metrcObj.Destinations[0].Packages.push(ObjMETRC);

					var locationID = jsonModel.getProperty("/transLoc");

					var ProdStdCost;
					$.each(allItemsList, function (j, k) {
						if (k.ItemCode && sObj.ItemCode == k.ItemCode) {
							ProdStdCost = k.ProdStdCost;
						}

					});

					var AbslocationEntry = "",
						BinCode = "";
					var ChangeLocationList = jsonModel.getProperty("/allLocData");
					$.each(ChangeLocationList, function (i, obj) {
						if (sObj.BinLocationCode == obj.BinCode) {
							AbslocationEntry = obj.AbsEntry;
							BinCode = obj.BinCode;
						}
					});

					var BatchNumber = sObj.METRCUID;
					var quantity = sObj.Quantity;
					var payLoadInventoryTransfer = {
						"FromWarehouse": sObj.WhsCode,
						"ToWarehouse": locationID.split("-")[1],
						"BPLID": jsonModel.getProperty("/sLinObj").U_Branch,
						"Comments": "Manage Packages - Inventory Transfer",
						"StockTransferLines": []
					};
					payLoadInventoryTransfer.StockTransferLines.push({
						"LineNum": 0,
						"ItemCode": sObj.ItemCode, //<THIS IS THE QTY OF CLONES>
						"Quantity": quantity, //<THIS IS FROM CLONE ROOM>
						"UnitPrice": ProdStdCost,
						"WarehouseCode": locationID.split("-")[1], // <THIS IS TAG>
						"FromWarehouseCode": sObj.WhsCode,
						"BatchNumbers": [{
							"Quantity": quantity, // <THIS IS TAG>
							"BatchNumber": BatchNumber,
							"Location": locationID.replace(locationID.split("-")[0], "").replace("-", "").replace(locationID.split("-")[1], "").replace(
								"-", ""),
						}],
						"StockTransferLinesBinAllocations": [{
							"BinAbsEntry": Number(AbslocationEntry),
							"Quantity": quantity,
							"SerialAndBatchNumbersBaseLine": 0,
							"BinActionType": "batFromWarehouse",
							"BaseLineNumber": 0
						}, {
							"BinAbsEntry": Number(locationID.split("-")[0]),
							"Quantity": quantity,
							"SerialAndBatchNumbersBaseLine": 0,
							"BinActionType": "batToWarehouse",
							"BaseLineNumber": 0
						}]
					});
					payloadTransfer.push({
						url: "/b1s/v2/StockTransfers",
						data: payLoadInventoryTransfer,
						method: "POST"
					});
				});

				// metrcObj.Destinations[0].Packages.push(metrcPackageArr);

				// if (sObj.AQTY) {
				// 	// if (sObj.AQTY && !sObj.isCannItem) {
				// 		$.each(sItems, function (index, tag) {
				// 			metrcObj.Destinations[0].Packages.push({
				// 				PackageLabel: tag,
				// 				WholesalePrice: null
				// 			});
				// 		});

				// 	}

				metricPayload.push(metrcObj);

				if (payloadTransfer.length > 0) {
					var that = this;
					var metrcData = jsonModel.getProperty("/metrcData");
					that.getView().setBusy(true);
					if (metrcData && metrcData.U_NACST === "X") {
						//	var metrcUrl = "/packages/v1/change/locations?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
						var metrcUrl = "/transfers/v2/templates/outgoing?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
						that.callMetricsService(metrcUrl, "POST", metricPayload, function () {
							sap.m.MessageToast.show("METRC sync completed successfully");
							that.InventoryInternalPostings(payloadTransfer, that.InventoryTransferDialog);
						}, function (error) {
							that.getView().setBusy(false);
							//	sap.m.MessageToast.show(JSON.stringify(error));
						});
					} else {
						that.InventoryInternalPostings(payloadTransfer, that.InventoryTransferDialog);
					}
				} else {
					sap.m.MessageToast.show("Please select mandatory fields");
				}
			}
		},

		InventoryInternalPostings: function (payloadTransfer, transTemDialog) {
			var that = this;
			this.createBatchCall(payloadTransfer, function () {
				that.getView().setBusy(false);
				sap.m.MessageToast.show("Inventory transfer created successfully");
				that.loadMasterData();
				that.getModel("jsonModel").setProperty("/driverDataphoneNUM", "");
				transTemDialog.close();
			});
		},

		onInventoryTransClose: function () {
			this.InventoryTransferDialog.close();
		},

		// Inventory Transfer Ends

		/******  batch details starts********/

		batchPriceChange: function (evt) {
			var Value = evt.getParameters().newValue;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var batchDetailsObj = jsonModel.getProperty("/batchDetailsObj");
			var actualPrice = batchDetailsObj.IntrSerialPrice;
			jsonModel.setProperty("/pricenewValue", Value);
			if (Number(Value) == Number(actualPrice)) {
				jsonModel.setProperty("/enableOkBatch", false);
			} else {
				jsonModel.setProperty("/enableOkBatch", true);
			}
			this._checkChanges();
		},

		onComboBoxBatchChange: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var oComboBox = oEvent.getSource();
			var sSelectedKey = oComboBox.getSelectedKey();
			jsonModel.setProperty("/batchComboBoxnewName", sSelectedKey);
			var batchDetailsObjName = "";
			if (jsonModel.getProperty("/batchDetailsObj").IntrSerial != null) {
				batchDetailsObjName = jsonModel.getProperty("/batchDetailsObj").IntrSerial.split("-")[0].trimEnd();
			}

			if (batchDetailsObjName == sSelectedKey) {
				jsonModel.setProperty("/enableOkBatch", false);
			} else {
				jsonModel.setProperty("/enableOkBatch", true);
			}
			this._checkChanges();
		},

		salesPersonCall: function (evt) {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var batchDetailsObj = jsonModel.getProperty("/batchDetailsObj");
			// var filter = "?$filter=SalesEmployeeName eq'" + evt + "'";

			jsonModel.setProperty("/onBusyBatchChange", true);
			this.readServiecLayer("/b1s/v2/SalesPersons", function (data1) {
				jsonModel.setProperty("/salesPersonDATA", data1.value);
				jsonModel.setProperty("/onBusyBatchChange", false);
				if (batchDetailsObj.IntrSerial != null) {
					var rObj = $.grep(data1.value, function (nItem) {
						if (nItem.SalesEmployeeName === batchDetailsObj.IntrSerial.split("-")[0].trimEnd()) {
							return nItem;
						}
					});
					if (rObj.length > 0) {
						sap.ui.core.Fragment.byId("batchDetailsDialog", "sRepo").setValue(rObj[0].SalesEmployeeName);
					} else {
						sap.ui.core.Fragment.byId("batchDetailsDialog", "sRepo").setValue(batchDetailsObj.IntrSerial.split("-")[0].trimEnd());

					}
				}

			});
		},
		onbatchDetailsClose: function () {
			this.batchDetailsDialog.close();
		},

		onCheckBoxSelect1: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var bSelected = oEvent.getParameter("selected");
			var sValue = bSelected ? 'Y' : 'N';
			jsonModel.setProperty("/batchDetailsObj/U_Yellowhead", sValue);
			this._checkChanges();
		},

		onCheckBoxSelect2: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var bSelected = oEvent.getParameter("selected");
			var sValue = bSelected ? 'Y' : 'N';
			jsonModel.setProperty("/batchDetailsObj/U_Bottoms", sValue);
			this._checkChanges();
		},

		onCheckBoxSelect3: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var bSelected = oEvent.getParameter("selected");
			var sValue = bSelected ? 'Y' : 'N';
			jsonModel.setProperty("/batchDetailsObj/U_PM", sValue);
			this._checkChanges();
		},

		onCheckBoxSelect4: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var bSelected = oEvent.getParameter("selected");
			var sValue = bSelected ? 'Y' : 'N';
			jsonModel.setProperty("/batchDetailsObj/U_CD", sValue);
			this._checkChanges();
		},

		onCheckBoxSelect5: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var bSelected = oEvent.getParameter("selected");
			var sValue = bSelected ? 'Y' : 'N';
			jsonModel.setProperty("/batchDetailsObj/U_Burned", sValue);
			this._checkChanges();
		},

		onCheckBoxSelect6: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var bSelected = oEvent.getParameter("selected");
			var sValue = bSelected ? 'Y' : 'N';
			jsonModel.setProperty("/batchDetailsObj/U_Bugs", sValue);
			this._checkChanges();
		},

		onCheckBoxSelect7: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var bSelected = oEvent.getParameter("selected");
			var sValue = bSelected ? 'Y' : 'N';
			jsonModel.setProperty("/batchDetailsObj/U_SeedBana", sValue);
			this._checkChanges();
		},

		onCheckBoxSelect8: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var bSelected = oEvent.getParameter("selected");
			var sValue = bSelected ? 'Y' : 'N';
			jsonModel.setProperty("/batchDetailsObj/U_Glass", sValue);
			this._checkChanges();
		},

		_checkChanges: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var oBatchDetails = jsonModel.getProperty("/batchDetailsObj");
			var batchDetailsObjName = "";
			if (oBatchDetails.IntrSerial != null) {
				batchDetailsObjName = oBatchDetails.IntrSerial.split("-")[0].trimEnd();
			}
			var pricenewValue = "",
				batchComboBoxnewName = "",
				IntrSerialoldPrice = "";
			if (jsonModel.getProperty("/pricenewValue") != undefined) {
				pricenewValue = jsonModel.getProperty("/pricenewValue");
			}
			if (jsonModel.getProperty("/batchComboBoxnewName") != undefined) {
				batchComboBoxnewName = jsonModel.getProperty("/batchComboBoxnewName")
			}

			if (oBatchDetails.IntrSerial != null) {
				IntrSerialoldPrice = oBatchDetails.IntrSerial.split("-")[1].replace(" $", "");
			}

			if (pricenewValue == "") {
				pricenewValue = IntrSerialoldPrice;
			}
			if (batchComboBoxnewName == "") {
				batchComboBoxnewName = batchDetailsObjName;
			}

			var bChanged = (
				this._initialStates.U_Yellowhead !== oBatchDetails.U_Yellowhead ||
				this._initialStates.U_Bottoms !== oBatchDetails.U_Bottoms ||
				this._initialStates.U_PM !== oBatchDetails.U_PM ||
				this._initialStates.U_CD !== oBatchDetails.U_CD ||
				this._initialStates.U_Burned !== oBatchDetails.U_Burned ||
				this._initialStates.U_Bugs !== oBatchDetails.U_Bugs ||
				this._initialStates.U_SeedBana !== oBatchDetails.U_SeedBana ||
				this._initialStates.U_Glass !== oBatchDetails.U_Glass ||
				this._initialStates.U_SalesNote !== oBatchDetails.U_SalesNote ||
				IntrSerialoldPrice !== pricenewValue ||
				batchDetailsObjName !== batchComboBoxnewName
			);

			jsonModel.setProperty("/enableOkBatch", bChanged);
		},

		handleBatchDetails: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sItems;
			var table = this.getView().byId("inTakeTable");
			sItems = table.getSelectedIndices();
			if (sItems.length > 0) {
				if (!this.batchDetailsDialog) {
					this.batchDetailsDialog = sap.ui.xmlfragment("batchDetailsDialog", "com.9b.inTake.view.fragments.BatchDetails", this);
					this.getView().addDependent(this.batchDetailsDialog);
				}

				var updateObject = table.getContextByIndex(sItems).getObject();
				this._initialStates = {
					U_Yellowhead: updateObject.U_Yellowhead,
					U_Bottoms: updateObject.U_Bottoms,
					U_PM: updateObject.U_PM,
					U_CD: updateObject.U_CD,
					U_Burned: updateObject.U_Burned,
					U_Bugs: updateObject.U_Bugs,
					U_SeedBana: updateObject.U_SeedBana,
					U_Glass: updateObject.U_Glass,
					IntrSerial: updateObject.IntrSerial,
					U_SalesNote: updateObject.U_SalesNote
				};

				var batchDetailsObj = {
					BatchAbsEntry: updateObject.BatchAbsEntry,
					METRCUID: updateObject.METRCUID,
					HarvestName: updateObject.HarvestName,
					SourceUID: updateObject.SourceUID,
					Quantity: updateObject.Quantity,
					U_Cart: updateObject.U_Cart,
					U_Yellowhead: updateObject.U_Yellowhead,
					U_Bottoms: updateObject.U_Bottoms,
					U_PM: updateObject.U_PM,
					U_CD: updateObject.U_CD,
					U_Burned: updateObject.U_Burned,
					U_Bugs: updateObject.U_Bugs,
					U_SeedBana: updateObject.U_SeedBana,
					U_Glass: updateObject.U_Glass,
					U_SalesRep: updateObject.U_SalesRep,
					U_Price: updateObject.U_Price,
					IntrSerial: updateObject.IntrSerial,
					IntrSerialPrice: "",
					newTag: "",
					newQty: "",
					sItem: "",
					U_SalesNote: updateObject.U_SalesNote,
					ItemName: updateObject.ItemName
				};
				sap.ui.core.Fragment.byId("batchDetailsDialog", "sRepo").setValue("");
				if (updateObject.IntrSerial != null || updateObject.IntrSerial != undefined) {
					batchDetailsObj.IntrSerialPrice = updateObject.IntrSerial.split("-")[1].replace(" $", "");
					// this.salesPersonCall(updateObject.IntrSerial.split("-")[0].trimEnd());
				} else {
					batchDetailsObj.IntrSerialPrice = "";
					// jsonModel.setProperty("/salesPersonDATA", "");
					// sap.m.MessageToast.show("No sales person found");
				}
				jsonModel.setProperty("/batchComboBoxnewName", "");
				jsonModel.setProperty("/pricenewValue", "");
				jsonModel.setProperty("/enableOkBatch", false);
				jsonModel.setProperty("/batchDetailsObj", batchDetailsObj);
				this.batchDetailsDialog.open();
				this.salesPersonCall();
			} else {
				sap.m.MessageToast.show("Please select atleast one Package");
			}
		},

		onconfirmBatchDetails: function () {
			var that = this;
			var jsonModel = this.getView().getModel("jsonModel");
			var batchDetailsObj = jsonModel.getProperty("/batchDetailsObj");
			var salesPerson = sap.ui.core.Fragment.byId("batchDetailsDialog", "sRepo").getValue();
			var priceTier = sap.ui.core.Fragment.byId("batchDetailsDialog", "priceTier").getValue();
			var isValtidate = true;
			if (salesPerson == "" || salesPerson == undefined) {
				sap.m.MessageToast.show("Select sales Person");
				isValtidate = false;
				return;
			}
			if (priceTier == "" || priceTier == undefined) {
				sap.m.MessageToast.show("Select Price Tier");
				isValtidate = false;
				return;
			}
			if (batchDetailsObj.IntrSerialPrice == "" || batchDetailsObj.IntrSerialPrice == undefined) {
				sap.m.MessageToast.show("Enter Price");
				isValtidate = false
				return;
			}
			if (isValtidate) {
				this.batchDetailsDialog.setBusy(true);
				// var patchPayload = {};

				var arttribute2 = salesPerson + " - $" + batchDetailsObj.IntrSerialPrice;
				var patchPayload = {
					"BatchAttribute2": arttribute2, //batchDetailsObj.IntrSerial,
					"U_Yellowhead": batchDetailsObj.U_Yellowhead,
					"U_Bottoms": batchDetailsObj.U_Bottoms,
					"U_PM": batchDetailsObj.U_PM,
					"U_CD": batchDetailsObj.U_CD,
					"U_Burned": batchDetailsObj.U_Burned,
					"U_Bugs": batchDetailsObj.U_Bugs,
					"U_SeedBana": batchDetailsObj.U_SeedBana,
					"U_Glass": batchDetailsObj.U_Glass,
					"U_PriceTier": priceTier,
					"U_SalesNote": batchDetailsObj.U_SalesNote
				};

				that.updateServiecLayer("/b1s/v2/BatchNumberDetails(" + batchDetailsObj.BatchAbsEntry + ")", function (res) {
					that.batchDetailsDialog.setBusy(false);
					that.loadMasterData();
					jsonModel.setProperty("/batchDetailButton", false);
					that.byId("inTakeTable").clearSelection();
					that.batchDetailsDialog.close();
				}.bind(that), patchPayload, "PATCH");
			}

		},
		onCustomerSelectTempNEW: function (evt) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			jsonModel.setProperty("/SalesOrderData", []);
			jsonModel.setProperty("/valueStatecustomer", "None");
			jsonModel.setProperty("/valueStateTextCustomer", "");
			jsonModel.setProperty("/orderDataBusy", true);
			var sCustomer = evt.getSource().getSelectedKey();
			var sSelect = "?$select=CardCode,DocumentStatus,DocNum,U_SNBICO";
			var sFilter = "&$filter=DocumentStatus eq 'bost_Open' and U_ReadyPick eq 'Y' and CardCode eq '" + sCustomer + "'";
			// var sFilter = "&$filter=DocumentStatus eq 'bost_Open' and CardCode eq '" + sCustomer + "' and LineStatus eq 'bost_Open'";
			this.readServiecLayer("/b1s/v2/Orders" + sSelect + sFilter, function (orderData) {
				jsonModel.setProperty("/SalesOrderData", orderData.value);
				jsonModel.setProperty("/orderDataBusy", false);

			});
			jsonModel.setProperty("/driverDataphoneNUM", "");
			jsonModel.setProperty("/valueStatecustomer", "None");
			jsonModel.setProperty("/valueStateTextCustomer", "");
			jsonModel.setProperty("/orderDataBusy", true);
			jsonModel.setProperty("/TransporterData", "");
			jsonModel.setProperty("/DriverData", "");
			jsonModel.setProperty("/VehicleData", "");
			var sCustomer = evt.getSource().getSelectedKey();
			var selectedLicense = jsonModel.getProperty("/selectedLicense");
			if (sCustomer != "") {
				var tFilter = "?$filter=U_CardCode eq '" + sCustomer + "'";
				this.readServiecLayer("/b1s/v2/U_NTRANS" + tFilter, function (transData) {
					jsonModel.setProperty("/TransporterData", transData.value);
					jsonModel.setProperty("/TransporterDataBusy", false);
					if (transData.value.length > 0) {
						// jsonModel.setProperty("/recipientLicenseCode", transData.value[0].Code);
						// jsonModel.setProperty("/transTemplate/transporter", );
						jsonModel.setProperty("/valueStatetranspoter", "None");
						jsonModel.setProperty("/valueStateTexttranspoter", "");
						jsonModel.setProperty("/transTemplate/transporter", transData.value[0].Code);
						var sFilters = "?$filter=U_NTRAN eq '" + transData.value[0].Code + "' and U_CardCode eq '" + sCustomer + "' ";
						this.readServiecLayer("/b1s/v2/U_DRIVERDETAILS" + sFilters, function (driverDetails) {
							jsonModel.setProperty("/DriverData", driverDetails.value);
							jsonModel.setProperty("/valueStatedriver", "None");
							jsonModel.setProperty("/valueStateTextdriver", "");
							jsonModel.setProperty("/driverDataBusy", false);
							jsonModel.setProperty("/transTemplate/driverDetail", driverDetails.value[0].Code);
							this.ondriverdetailsChange();
						});
						jsonModel.setProperty("/vehicleDataBusy", true);
						this.readServiecLayer("/b1s/v2/U_VEHICLEDETAILS" + sFilters, function (vehicleDetails) {
							jsonModel.setProperty("/VehicleData", vehicleDetails.value);
							jsonModel.setProperty("/valueStatevehicle", "None");
							jsonModel.setProperty("/valueStateTextvehicle", "");
							jsonModel.setProperty("/vehicleDataBusy", false);
							jsonModel.setProperty("/transTemplate/vehicleDetail", vehicleDetails.value[0].Code);

						});
					}
				});

			} else {

				this.readServiecLayer("/b1s/v2/U_NTRANS", function (transData) {
					jsonModel.setProperty("/TransporterData", transData.value);
					jsonModel.setProperty("/TransporterDataBusy", false);
					jsonModel.setProperty("/shiptoDropoDownVisible", false);
					jsonModel.setProperty("/shiptoINPUTVisible", true);
				});

			}

		},

		/******  batch details starts********/

		/*** change items in metrc start***/

		onChangeItemCloseMETRC: function () {
			this.changeItemMETRCDialog.close();
		},
		onSuggestionItemSelected: function (oEvent) {
			// Get the selected item
			var sInputObj = oEvent.getSource().getBindingContext("jsonModel").getObject();
			var selectedItem = oEvent.getParameter("selectedRow");
			var selectedName = selectedItem.getCells()[0].getText();
			var selectedProductId = selectedItem.getCells()[1].getText();
			sInputObj.newItemCode = selectedProductId;
			sInputObj.newItemName = selectedName;
		},

		validateItem: function (evt) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var oSource = evt.getSource();
			var sTerm = oSource.getValue();
			var sInputObj = oSource.getBindingContext("jsonModel").getObject();

			sInputObj.newItemName = sTerm;
			var ItemsCallDATA = jsonModel.getProperty("/ItemsDATA");
			var arrITEMS = [];

			$.each(ItemsCallDATA, function (i, obj) {
				if (obj.ItemName !== null) {
					if (obj.ItemName && obj.ItemCode && obj.ItemName.toLowerCase().includes(sTerm.toLowerCase()) == true || obj.ItemCode.includes(sTerm) == true) {
						arrITEMS.push(obj);
					}
				}
			});

			var localJson = new sap.ui.model.json.JSONModel();
			oSource.setModel(localJson);
			localJson.setProperty("/changeItemsdropdownData", arrITEMS);
			oSource._oSuggestionsTable.oParent.openBy(oSource);

		},

		valueHelpRequestDialog: function (oEvent) {
			var that = this;
			var jsonModel = this.getView().getModel("jsonModel");
			if (!this.createDialog) {
				this.createDialog = sap.ui.xmlfragment("ItemsDialog", "com.9b.inTake.view.fragments.Items", this);
				this.getView().addDependent(this.createDialog);
			}
			that.createDialog.refParent = oEvent.getSource();
			sap.ui.core.Fragment.byId("ItemsDialog", "itemTable").clearSelection();
			sap.ui.core.Fragment.byId("ItemsDialog", "searchFieldTableItems").clear();
			that.clearAllFiltersITEMS();
			this.createDialog.open();

		},

		handlechangeItemsMETRC: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var mPkgTable = this.getView().byId("inTakeTable");
			var metrcData = jsonModel.getProperty("/metrcData");
			var sItems = mPkgTable.getSelectedIndices();

			// if (metrcData && metrcData.U_NACST === "X") {
			if (sItems.length > 0) {
				if (!this.changeItemMETRCDialog) {
					this.changeItemMETRCDialog = sap.ui.xmlfragment("changeItemMETRCDialog",
						"com.9b.inTake.view.fragments.ChangeItemsMetrc", this);
					this.getView().addDependent(this.changeItemMETRCDialog);
				}
				var sObj, sArrayObj = [];
				jsonModel.setProperty("/changeItemsData", sArrayObj);
				$.each(sItems, function (i, e) {
					sObj = mPkgTable.getContextByIndex(e).getObject();
					sObj.newItemName = "";
					sObj.newItemCode = "";
					sObj.STATUSITEM = "None";
					sObj.ITEMTXT = "";
					sArrayObj.push(sObj);
				});
				jsonModel.setProperty("/changeItemsData", sArrayObj);
				that.changeItemMETRCDialog.open();
				var licenseNo = jsonModel.getProperty("/selectedLicense");
				var filters = "?$filter=U_MetrcLicense eq " + "'" + licenseNo + "' and not(startswith(BinCode,'LIC'))";
				var fields = "&$select=" + ["U_MetrcLicense", "U_MetrcLocation", "Sublevel2", "BinCode", "AbsEntry", "Warehouse"].join();
				var filterItems = "?$filter=U_ISCANNABIS eq 'Y'";
				var fieldsItem = "&$select=" + ["ItemCode", "ItemName", "U_ISCANNABIS", "ProdStdCost"].join();
				that.changeItemMETRCDialog.setBusy(true);

				this.readServiecLayer("/b1s/v2/Items" + filterItems + fieldsItem, function (data1) {
					jsonModel.setProperty("/ItemsDATA", data1.value);
					this.readServiecLayer("/b1s/v2/BinLocations" + filters + fields, function (data) {
						that.changeItemMETRCDialog.setBusy(false);
						jsonModel.setProperty("/ChangeLocationList", data.value);
					});
				});

			} else {
				sap.m.MessageToast.show("Please select a batch");
			}

			// } else {
			// 	sap.m.MessageToast.show("METRC SYNC is off");
			// }

		},

		onMETRCConfirmChangeItem: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var metrcData = jsonModel.getProperty("/metrcData");
			var sItems = this.changeItemMETRCDialog.getContent()[0].getItems();
			var changeItemMETRCDialog = this.changeItemMETRCDialog;
			var that = this;
			var changeItemsData = jsonModel.getProperty("/changeItemsData");
			var ItemsCallDATA = jsonModel.getProperty("/ItemsDATA");
			var isValidated = true;
			$.each(changeItemsData, function (i, sObj) {
				if (sObj.newItemName === "") {
					sObj.STATUSITEM = "Error";
					sObj.ITEMTXT = "Enter Item";
					isValidated = false;
				} else if (sObj.STATUSITEM === "Error") {
					isValidated = false;
				} else {
					sObj.STATUSITEM = "None";
				}

				if (sObj.newItemCode == "") {
					sObj.STATUSITEM = "Error";
					isValidated = false;
				}

				if (sObj.newItemName != "") {
					var rObj = $.grep(ItemsCallDATA, function (nItem) {
						if (nItem.ItemName && nItem.ItemName === sObj.newItemName) {
							return nItem;
						}
					});
					if (rObj.length > 0) {
						sObj.STATUSITEM = "None";
					} else {
						isValidated = false;
						sObj.STATUSITEM = "Error";
						sObj.ITEMTXT = "Enter Item";
					}

				}

			});
			if (!isValidated) {
				sap.m.MessageToast.show("Some of the items are invalid");
				return;
			}
			var cDate = that.getSystemDate(new Date());
			// validation
			var metricPayload = [];
			var noItemCodes = [],
				filterString;
			$.each(sItems, function (i, e) {
				var sObj = e.getCells()[2].getBindingContext("jsonModel").getObject();
				if (!sObj.newItemCode) {
					filterString = "ItemName eq '" + sObj.newItemName + "'";
					noItemCodes.push(filterString);
				}
			});
			that.changeItemMETRCDialog.setBusy(true);
			setTimeout(function () {
				if (noItemCodes.length > 0) {
					var fieldsItem = "?$select=" + ["ItemCode", "ItemName", "U_ISCANNABIS"].join();
					var sfilters = "&$filter=" + noItemCodes.join(" and ");
					this.readServiecLayer("/b1s/v2/Items" + fieldsItem + sfilters, function (data1) {
						// that.changeItemMETRCDialog.setBusy(false);
						if (data1.value.length > 0) {
							$.each(changeItemsData, function (i, sObj) {
								if (sObj.newItemCode === "") {
									var rObj = $.grep(data1.value, function (nItem) {
										if (nItem.ItemName && nItem.ItemName === sObj.newItemName) {
											return nItem;
										}
									});
									if (rObj.length > 0) {
										sObj.newItemCode = rObj[0].ItemCode;
									}
								}

								var pObj = {
									Label: sObj.METRCUID,
									Item: sObj.newItemName
								};
								metricPayload.push(pObj);
							});

							jsonModel.refresh(true);
							if (metrcData && metrcData.U_NACST === "X") {
								//	var metrcUrl = "/packages/v1/create?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
								var metrcUrl = "/packages/v2/item?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
								that.callMetricsService(metrcUrl, "PUT", metricPayload, function () {
									that.changeItemMETRCDialog.setBusy(false);
									// that.changeItemMETRCDialog.close();
									sap.m.MessageToast.show("METRC Sync Completed Successfully");
									that.byId("inTakeTable").clearSelection();
									// that.loadMasterData();

									that.changeItemInterncallPostings(changeItemsData, jsonModel, changeItemMETRCDialog);
								}, function (error) {
									that.changeItemMETRCDialog.setBusy(false);
									//	sap.m.MessageToast.show(JSON.stringify(error));
								});
							} else {

								that.changeItemInterncallPostings(changeItemsData, jsonModel, changeItemMETRCDialog);
							}

						} else {
							sap.m.MessageToast.show("Some of the items are invalid");
							return;
						}

					});
				} else {

					var isValidated = true;
					$.each(changeItemsData, function (i, sObj) {
						if (sObj.newItemName === "") {
							sObj.STATUSITEM = "Error";
							sObj.ITEMTXT = "Enter Item";
							isValidated = false;
						} else if (sObj.STATUSITEM === "Error") {
							isValidated = false;
						} else {
							sObj.STATUSITEM = "None";
						}
						var pObj = {
							Label: sObj.METRCUID,
							Item: sObj.newItemName
						};
						metricPayload.push(pObj);
					});

					jsonModel.refresh(true);
					if (isValidated) {
						if (metrcData && metrcData.U_NACST === "X") {
							// var metrcUrl = "/packages/v1/create?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
							var metrcUrl = "/packages/v2/item?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
							that.callMetricsService(metrcUrl, "PUT", metricPayload, function () {
								that.changeItemMETRCDialog.setBusy(false);
								// that.changeItemMETRCDialog.close();
								sap.m.MessageToast.show("METRC Sync Completed Successfully");
								that.byId("inTakeTable").clearSelection();
								// that.loadMasterData();
								that.changeItemInterncallPostings(changeItemsData, jsonModel, changeItemMETRCDialog);
							}, function (error) {
								that.changeItemMETRCDialog.setBusy(false);
								//	sap.m.MessageToast.show(JSON.stringify(error));
							});
						} else {
							that.changeItemInterncallPostings(changeItemsData, jsonModel, changeItemMETRCDialog);
						}
					}
				}

			}, 1000);

		},

		changeItemInterncallPostings: function (changeItemsData, jsonModel, changeItemDialog) {
			var ChangeLocationList = jsonModel.getProperty("/ChangeLocationList");
			var ItemsCallDATA = jsonModel.getProperty("/ItemsDATA");
			var cDate = this.getSystemDate(new Date());
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var that = this;
			var count = changeItemsData.length;
			$.each(changeItemsData, function (i, sObj) {
				var costingCode, absEntry, ProdStdCost, exitProdStdCost;
				$.each(ChangeLocationList, function (i, k) {
					if (sObj.BinLocationCode == k.BinCode) {
						// costingCode = k.U_GFWDIM1;
						absEntry = k.AbsEntry;
					}
				});

				$.each(ItemsCallDATA, function (i, obj) {
					if (obj.ItemCode && sObj.newItemCode == obj.ItemCode) {
						ProdStdCost = obj.ProdStdCost;
					}
				});

				$.each(ItemsCallDATA, function (i, obj) {
					if (obj.ItemCode && sObj.ItemCode == obj.ItemCode) {
						exitProdStdCost = obj.ProdStdCost;
					}
				});
				changeItemDialog.setBusy(true);

				var payLoadProduction = {
					"ItemNo": sObj.newItemCode, //newItemcode
					"DistributionRule": "PROC",
					"PlannedQuantity": sObj.Quantity, //updateObject.Quantity,
					"ProductionOrderType": "bopotSpecial",
					"PostingDate": cDate,
					"DueDate": cDate,
					"Warehouse": sObj.WhsCode,
					"Remarks": "Manage Inventory - Change Item",
					"ProductionOrderLines": [{
							"ItemNo": sObj.ItemCode, // row item
							"DistributionRule": "PROC",
							"PlannedQuantity": sObj.Quantity,
							"ProductionOrderIssueType": "im_Manual",
							"Warehouse": sObj.WhsCode
						}

					]
				};

				that.updateServiceLayerBatch("/b1s/v2/ProductionOrders", function (res) {
					var docNUM = Number(res.AbsoluteEntry);

					var fisrtPatchCall = {
						"ProductionOrderStatus": "boposReleased",
					};
					var secondPatchCall = {
						"ProductionOrderStatus": "boposClosed",
					};

					that.updateServiceLayerBatch("/b1s/v2/ProductionOrders(" + Number(docNUM) + ")", function (res) {

						var payLoadInventoryEntry = {
							"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
							// "PaymentGroupCode": 2,
							"Comments": "Manage Inventory - Change Item",
							"DocumentLines": []
						};
						payLoadInventoryEntry.DocumentLines.push({
							// "ItemCode": sObj.newItemCode,
							// "ItmGrpCode": 100,
							"BaseType": 202,
							"BaseEntry": docNUM,
							"WarehouseCode": sObj.WhsCode,
							"Quantity": sObj.Quantity,
							// "CostingCode": costingCode,
							// "UnitPrice": Number(ProdStdCost),
							"BatchNumbers": [{
								"BatchNumber": sObj.METRCUID, // <THIS IS TAG>
								"Quantity": sObj.Quantity, //<THIS IS THE QTY OF CLONES>
								"Location": sObj.BinLocationCode, //<THIS IS FROM CLONE ROOM>
								"ManufacturerSerialNumber": sObj.HarvestName,
								"U_BatAttr3": sObj.SourceUID,
								"U_IsPackage": "YES",
								"U_Phase": "Package",
							}],
							"DocumentLinesBinAllocations": [{
								"BinAbsEntry": Number(absEntry),
								"Quantity": sObj.Quantity,
								"SerialAndBatchNumbersBaseLine": 0
							}]
						});

						var payLoadInventoryExit = {
							"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
							// "PaymentGroupCode": 2,
							"Comments": "Manage Inventory - Change Item",
							"DocumentLines": []
						};
						payLoadInventoryExit.DocumentLines.push({
							// "ItemCode": sObj.ItemCode,
							// "ItmGrpCode": 100,
							"BaseType": 202,
							"BaseEntry": docNUM,
							"BaseLine": 0,
							"WarehouseCode": sObj.WhsCode,
							"Quantity": sObj.Quantity,
							// "UnitPrice": Number(exitProdStdCost),
							// "CostingCode": costingCode, exitProdStdCost
							"BatchNumbers": [{
								"BatchNumber": sObj.METRCUID, // <THIS IS TAG>
								"Quantity": sObj.Quantity,
								"Location": sObj.BinLocationCode
							}],
							"DocumentLinesBinAllocations": [{
								"BinAbsEntry": Number(absEntry),
								"Quantity": sObj.Quantity,
								"SerialAndBatchNumbersBaseLine": 0
							}]
						});

						var patchpayload = {
							"Status": "bdsStatus_NotAccessible"
						};
						that.updateServiceLayerBatch("/b1s/v2/InventoryGenExits", function (resExit, sDataExit) {

							that.updateServiceLayerBatch("/b1s/v2/BatchNumberDetails(" + sObj.BatchAbsEntry + ")", function (resEntry, sDataEntry) {

								that.updateServiceLayerBatch("/b1s/v2/InventoryGenEntries", function (resEntry, sDataEntry) {

									var licenseNo = jsonModel.getProperty("/selectedLicense");
									var filters = "?$filter=U_MetrcLicense eq " + "'" + licenseNo + "' and U_Phase eq 'Package' and Status eq '1'";
									this.readServiecLayer("/b1s/v2/sml.svc/CV_GH_BATCHQUERY_VW" + filters, function (data) {

										var returnObj = $.grep(data.value, function (sItem) {
											if (sItem.ItemCode && sObj.newItemCode === sItem.ItemCode) {
												return sItem;
											}
										});

										if (returnObj.length > 0) {

											var finalpatchpayload = {
												"Status": "bdsStatus_Released"
											};

											that.updateServiceLayerBatch("/b1s/v2/BatchNumberDetails(" + Number(returnObj[0].BatchAbsEntry) + ")",
												function (
													resEntry, sDataEntry) {
													that.updateServiceLayerBatch("/b1s/v2/ProductionOrders(" + Number(docNUM) + ")", function (res) {
														count--;
														if (count === 0) {
															changeItemDialog.setBusy(false);
															changeItemDialog.close();
															sap.m.MessageToast.show("Package Created Successfully");
															that.byId("inTakeTable").clearSelection();
															that.loadMasterData();
														}

													}.bind(that), secondPatchCall, "PATCH");
												}, finalpatchpayload, "PATCH");

										} else {
											that.updateServiceLayerBatch("/b1s/v2/ProductionOrders(" + Number(docNUM) + ")", function (res) {
												count--;
												if (count === 0) {
													changeItemDialog.setBusy(false);
													changeItemDialog.close();
													sap.m.MessageToast.show("Package Created Successfully");
													that.byId("inTakeTable").clearSelection();
													that.loadMasterData();
												}
											}.bind(that), secondPatchCall, "PATCH");
										}

									});

								}, payLoadInventoryEntry, "POST");
							}, patchpayload, "PATCH");
						}, payLoadInventoryExit, "POST");

					}.bind(that), fisrtPatchCall, "PATCH");

				}.bind(that), payLoadProduction, "POST");

			});
		},

		/*** change items in metrc end ***/

		/***Method start for new package ***/

		oncreatePackagesDelete: function (evt) {
			var jsonModel = this.getView().getModel("jsonModel");
			var createPackageData = jsonModel.getProperty("/createPackageData");
			var sIndex = evt.getSource().getParent().getParent().indexOfItem(evt.getSource().getParent());
			createPackageData.splice(sIndex, 1);
			jsonModel.setProperty("/createPackageData", createPackageData);
		},

		onCreatePackagesTemApply: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var temLocation = sap.ui.core.Fragment.byId("createNewPackage", "temLocationId");
			var sLocText = "";
			if (temLocation.getSelectedItem()) {
				var sLocText = temLocation.getSelectedItem().getText();
			}
			var createPackageData = jsonModel.getProperty("/createPackageData");
			var sLoc = jsonModel.getProperty("/harvestLocData");

			var returnObj = $.grep(sLoc, function (ele) {
				if (sLocText === ele.BinCode) {
					return ele;
				}
			});

			if (returnObj.length > 0) {
				var Warehouse = returnObj[0].Warehouse;
				var AbsEntry = returnObj[0].AbsEntry;
				var BinCode = returnObj[0].BinCode;
				$.each(createPackageData, function (i, e) {
					e.NSTLN = Warehouse + "-" + AbsEntry + "-" + BinCode; //sLocText; 		//"MHA1-338-MHA1.B36"   // "{jsonModel>Warehouse}-{jsonModel>AbsEntry}-{jsonModel>BinCode}",
					// e.NSTLN = sLocText;
				});
				jsonModel.setProperty("/createPackageData", createPackageData);
			}
		},

		handleNewPackage: function () {
			var sObj;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var itemCodeList;
			var deviceModel = this.getView().getModel("device");
			var isPhone = deviceModel.getProperty("/system/phone");
			jsonModel.setProperty("/NPDNMCode", "");
			this.loadItemData();
			if (!this.createPackage) {
				this.createPackage = sap.ui.xmlfragment("createNewPackage", "com.9b.inTake.view.fragments.CreateNewPackages", this);
				this.getView().addDependent(this.createPackage);
			}
			var sArrayObj = [];
			var harvestTable = this.byId("inTakeTable");
			if (harvestTable.getSelectedIndices().length === 0) {
				sap.m.MessageToast.show("Please select a batch");
				return;
			} else {
				var sItems;
				var table = this.getView().byId("inTakeTable");
				sItems = table.getSelectedIndices();
				$.each(sItems, function (i, e) {
					sObj = table.getContextByIndex(e).getObject();
					sObj.STATUSQTY = "None";
					sObj.U_NLABEL = "";
					sObj.QTYTXT = "";
					sObj.NQNTY = "";
					sObj.tagCode = "";
					sObj.NTRID = "";
					sObj.NSTLN = "";
					sObj.NSTLNCODE = "";
					sObj.NPDNMText = "";
					sObj.selectedItemKey = "";
					//sObj.NPDNMCode = "";
					sObj.SNO = "#" + (i + 1);
					sObj.itemList = [];
					// if (sObj.ItemName && sObj.ItemName.search("Clone") !== -1) {
					// 	itemCodeList = jsonModel.getProperty("/cloneItemCodeList");
					// } else {
					// 	itemCodeList = jsonModel.getProperty("/itemCodeList");
					// }
					itemCodeList = jsonModel.getProperty("/allItemsList");

					// var rObj = $.grep(itemCodeList, function (item) {
					// 	if (item.ItemName !== "" && item.ItemName.search(sObj.StrainName) !== -1) {
					// 		return item;
					// 	}
					// });
					// if (rObj.length > 0) {
					// 	sObj.itemList = rObj;
					// }

					var rObj = $.grep(itemCodeList, function (item) {
						if (item.ItemName && item.ItemName !== "" && item.ItemName.search(sObj.ItemName) !== -1) {
							return item;
						}
					});
					if (rObj.length > 0) {
						var arr = [];
						var rObj2 = $.grep(itemCodeList, function (item) {
							if (item.ItemsGroupCode && rObj[0].ItemsGroupCode == item.ItemsGroupCode) {
								arr.push(item);
							}
						});
						sObj.itemList = arr;
					}

					// var rObj = $.grep(itemCodeList, function (item) {
					// 	if (sObj.ItemName == item.ItemName) {
					// 		return item;
					// 	}
					// });
					// if (rObj.length > 0) {
					// 	sObj.NPDNMCode = rObj[0].ItemCode;
					// 	sObj.NPDNMText = rObj[0].ItemName;
					// 	sObj.ProductCost = rObj[0].ProdStdCost;
					// 	sObj.UOMCode = rObj[0].InventoryUOM;
					// }

					sArrayObj.push(sObj);
				});
			}
			jsonModel.setProperty("/createPackageData/NPDNMCode", {});
			jsonModel.setProperty("/createPackageData", sArrayObj);
			jsonModel.setProperty("/temChangeLoc", "");
			this.createPackage.open();
			// this.loadTagsDataInPkg();
			this.loadLocationsDataInPkg();
		},
		productListItemGPhase: function (sId, oContext) {
			var sObj = oContext.getObject();
			sObj.itemList
			var jsonModel = this.getView().getModel("jsonModel");
			jsonModel.setProperty("/gPhaseBusy", true);
			var barCodePlantTagData = jsonModel.getProperty("/barCodePlantTagData");
			var itemModel = new sap.ui.model.json.JSONModel();
			itemModel.setSizeLimit(100000);
			itemModel.setProperty("/itemList", sObj.itemList);
			var itemSelect = new sap.m.ComboBox({
				forceSelection: false,
				width: "100%",
				selectedKey: "{jsonModel>selectedItemKey}",
				forceSelection: false,
				valueState: "{jsonModel>STATUSITEM}",
				valueStateText: "{jsonModel>ITEMTXT}",
				change: [this.onItemSelectPackages, this],
				items: {
					path: '/itemList',
					template: new sap.ui.core.Item({
						key: "{ItemCode}-{InventoryUOM}-{ProdStdCost}",
						text: "{ItemName}"
					})
				}
			});
			itemSelect.setModel(itemModel);

			return new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{jsonModel>SNO}"
					}),
					new sap.m.Text({
						text: "{jsonModel>METRCUID}"
					}),
					new sap.m.Text({
						text: "{jsonModel>Quantity}"
					}),
					new sap.m.Input({
						value: "{jsonModel>NQNTY}",
						liveChange: [this.validateEnteredQty, this],
						valueState: "{jsonModel>STATUSQTY}",
						valueStateText: "{jsonModel>QTYTXT}",
						width: "100%"
					}),
					
					new sap.m.Input({
						value: "{jsonModel>NTRID}",
						valueState: "{jsonModel>STATUSTAG}",
						valueStateText: "{jsonModel>TAGTXT}",
						placeholder: "Scan package tag"
					}),
					
					// new sap.m.Select({
					// 	forceSelection: false,
					// 	width: "100%",
					// 	selectedKey: "{jsonModel>NTRID}",
					// 	forceSelection: false,
					// 	valueState: "{jsonModel>STATUSTAG}",
					// 	valueStateText: "{jsonModel>TAGTXT}",
					// 	change: [this.tagSelectionChange, this],
					// 	items: {
					// 		path: 'jsonModel>/harvestTagsData',
					// 		template: new sap.ui.core.Item({
					// 			key: "{jsonModel>Label}",
					// 			text: "{jsonModel>Label}"
					// 		})
					// 	}
					// }),
					
					new sap.m.Select({
						forceSelection: false,
						width: "100%",
						selectedKey: "{jsonModel>NSTLN}",
						forceSelection: false,
						valueState: "{jsonModel>STATUSLOC}",
						valueStateText: "{jsonModel>LOCTXT}",
						//change: [this.onLocSelectPackages, this],
						items: {
							path: 'jsonModel>/harvestLocData',
							template: new sap.ui.core.Item({
								key: "{jsonModel>Warehouse}-{jsonModel>AbsEntry}-{jsonModel>BinCode}",
								text: "{jsonModel>BinCode}"
							})
						}
					}),

					itemSelect,
					// new sap.m.Text({
					// 	text: "{jsonModel>ItemName}"
					// }),
					new sap.m.Button({
						icon: "sap-icon://delete",
						press: [this.oncreatePackagesDelete, this],
						type: "Reject"
					})
				]
			});
		},
		onItemSelectPackages: function (evt) {
			var sObj = evt.getSource().getBindingContext("jsonModel").getObject();
			// var sLocation = evt.getParameter("selectedItem").getKey();
			// var selObj = evt.getParameter("selectedItem").getBindingContext().getObject();
			var key = evt.getSource().getSelectedKey();
			var text = evt.getSource().getSelectedItem().getText();
			sObj.NPDNMCode = key.split("-")[0]; //key: "{ItemCode}-{InventoryUOM}-{ProdStdCost}",
			sObj.NPDNMText = text; //selObj.ItemName;
			sObj.ProductCost = key.split("-")[2]; //selObj.ProdStdCost;
			sObj.UOMCode = key.split("-")[1]; //selObj.InventoryUOM
		},
		createPackageCancel: function () {
			this.createPackage.close();
		},
		confirmcreatePackages: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var createPackageData = jsonModel.getProperty("/createPackageData");
			var ChangeLocationList = jsonModel.getProperty("/harvestLocData");
			var cDate = this.convertUTCDate(new Date());
			var metrcData = jsonModel.getProperty("/metrcData");
			var that = this;
			var createPackage = this.createPackage;
			var count = createPackageData.length;
			// validation
			var selectedPackages = [];
			var isValidated = true;
			$.each(createPackageData, function (i, sObj) {
				selectedPackages.push(sObj.NTRID);
				if (sObj.NQNTY === "") {
					sObj.STATUSQTY = "Error";
					sObj.QTYTXT = "Enter quantity";
					isValidated = false;
				} else {
					sObj.STATUSQTY = "None";
				}
				if (sObj.STATUSQTY === "Error") {
					isValidated = false;
				}
				if (sObj.NTRID === "") {
					sObj.STATUSTAG = "Error";
					sObj.TAGTXT = "Select package tag";
					isValidated = false;
				} else {
					sObj.STATUSTAG = "None";
				}
				if (sObj.NSTLN === "") {
					sObj.STATUSLOC = "Error";
					sObj.LOCTXT = "Select location";
					isValidated = false;
				} else {
					sObj.STATUSLOC = "None";
				}
			});
			var uniquePackages = selectedPackages.filter(function (item, pos) {
				return selectedPackages.indexOf(item) == pos;
			});
			// jsonModel.refresh(true);
			if (isValidated) {
				if (selectedPackages.length !== uniquePackages.length) {
					sap.m.MessageToast.show("Please select unique package tags");
					return false;
				}
				var payLoadInventoryEntry = {};
				var payLoadInventoryExit = {};
				var metricPayload = [];
				$.each(createPackageData, function (i, sObj) {
					var locationID = sObj.NSTLN;
					var rObj = $.grep(ChangeLocationList, function (sLoc) {
						if (sLoc.BinCode && sLoc.BinCode === locationID.replace(locationID.split("-")[0], "").replace("-", "").replace(locationID.split("-")[1], "")
							.replace("-", "")) {
							return sLoc;
						}
					});
					var locationName = rObj[0].U_MetrcLocation;
					var totalWt = 0;
					var qty = 0;
					var quantity = Number(sObj.NQNTY).toFixed(2);
					if (metrcData && metrcData.U_NACST === "X") {
						var pObj = {
							Tag: sObj.NTRID,
							Location: locationName, //sObj.U_MetrcLocation,
							Item: sObj.NPDNMText, //sObj.ItemName,
							Quantity: Number(quantity),
							UnitOfMeasure: sObj.UOMCode,
							// PatientLicenseNumber: null,
							Note: sObj.U_NNOTE,
							// IsProductionBatch: false,
							// IsDonation: false,
							// ProductRequiresRemediation: false,
							// UseSameItem: false,
							ActualDate: that.getSystemDate(),
							Ingredients: [{
								Package: sObj.METRCUID,
								Quantity: Number(quantity),
								UnitOfMeasure: sObj.UOMCode
							}]
						};
						metricPayload.push(pObj);
					}
				});

				if (metrcData && metrcData.U_NACST === "X") {
					var metrcUrl = "/packages/v2/?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
					that.createPackage.setBusy(true);
					that.callMetricsService(metrcUrl, "POST", metricPayload, function () {
						// that.createPackage.setBusy(false);
						sap.m.MessageToast.show("METRC sync completed successfully");
						that.newPackagestoTable(createPackageData, that);
					}, function (error) {
						sap.m.MessageToast.show(JSON.stringify(error));
						that.createPackage.setBusy(false);
					});
				} else {
					that.newPackagestoTable(createPackageData, that);
				}
			}
		},

		newPackagestoTable: function (createPackageData, that) {
			var count = createPackageData.length;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var ChangeLocationList = jsonModel.getProperty("/harvestLocData");
			var cDate = this.convertUTCDate(new Date());
			that.createPackage.setBusy(true);
			$.each(createPackageData, function (i, sObj) {
				var totalWt = 0;
				var qty = 0;
				var payLoadInventoryEntry = {};
				var payLoadInventoryExit = {};
				var batchUrl = [];
				var locationID = sObj.NSTLN,
					AbslocationEntry = "";
				qty = Number(sObj.NQNTY);
				totalWt = Number(sObj.Quantity) - qty;
				var BatchNumber = sObj.NTRID;
				var BatchNumberForExit = sObj.U_NTKID;
				var quantity = Number(sObj.NQNTY).toFixed(2);

				$.each(ChangeLocationList, function (i, obj) {
					if (obj.BinCode && sObj.BinLocationCode.toLowerCase() == obj.BinCode.toLowerCase()) {
						AbslocationEntry = obj.AbsEntry;
					}
				});

				var payLoadProduction = {
					"ItemNo": sObj.NPDNMCode,
					"DistributionRule": "PROC",
					"PlannedQuantity": quantity, //sObj.Quantity, //updateObject.Quantity,
					"ProductionOrderType": "bopotSpecial",
					"PostingDate": cDate,
					"DueDate": cDate,
					"Warehouse": sObj.WhsCode,
					"Remarks": "Manage Inventory - New Package",
					"ProductionOrderLines": [{
							"ItemNo": sObj.ItemCode, // selected item
							"DistributionRule": "PROC",
							"PlannedQuantity": quantity, // sObj.Quantity,
							"ProductionOrderIssueType": "im_Manual",
							"Warehouse": sObj.WhsCode,
						}

					]
				};

				that.updateServiecLayer("/b1s/v2/ProductionOrders", function (res) {
					var docNUM = Number(res.AbsoluteEntry);

					var fisrtPatchCall = {
						"ProductionOrderStatus": "boposReleased",
					};

					batchUrl.push({
						url: "/b1s/v2/ProductionOrders(" + docNUM + ")",
						data: fisrtPatchCall,
						method: "PATCH"
					});

					payLoadInventoryEntry = {
						"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
						"Comments": "Manage Inventory - New Packages",
						"DocumentLines": []
					};
					payLoadInventoryEntry.DocumentLines.push({
						// "ItemCode": sObj.NPDNMCode, //sObj.ItemCode,
						// "ItmGrpCode": 100,
						"BaseType": 202,
						"BaseEntry": docNUM,
						"WarehouseCode": sObj.WhsCode,
						"Quantity": quantity,
						// "UnitPrice": sObj.ProductCost,
						"BatchNumbers": [{
							"BatchNumber": BatchNumber, // <THIS IS TAG>
							"Quantity": quantity, //<THIS IS THE QTY OF CLONES>
							"Location": locationID.replace(locationID.split("-")[0], "").replace("-", "").replace(locationID.split("-")[1], "").replace(
								"-", ""), //<THIS IS FROM CLONE ROOM>
							"ManufacturerSerialNumber": sObj.HarvestName,
							"U_BatAttr3": sObj.METRCUID,
							"U_IsPackage": "YES",
							"U_Phase": "Package",
							"U_Bottoms": sObj.U_Bottoms,
							"U_Bugs": sObj.U_Bugs,
							"U_Burned": sObj.U_Burned,
							"U_CD": sObj.U_CD,
							"U_Cart": sObj.U_Cart,
							"U_Glass": sObj.U_Glass,
							// "U_MetrcLicense": sObj.U_MetrcLicense,
							// "U_MetrcLocation": sObj.U_MetrcLocation,
							"U_PM": sObj.U_PM,
							"U_Price": sObj.U_Price,
							"U_SalesRep": sObj.U_SalesRep,
							"U_SeedBana": sObj.U_SeedBana,
							"U_Yellowhead": sObj.U_Yellowhead,
							"U_SalesNote": sObj.U_SalesNote
						}],
						"DocumentLinesBinAllocations": [{
							"BinAbsEntry": Number(locationID.split("-")[1]),
							"Quantity": quantity,
							"SerialAndBatchNumbersBaseLine": 0
						}]
					});

					batchUrl.push({
						url: "/b1s/v2/InventoryGenEntries",
						data: payLoadInventoryEntry,
						method: "POST"
					});

					payLoadInventoryExit = {
						"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
						"Comments": "Manage Inventory - New Packages",
						"DocumentLines": []
					};
					payLoadInventoryExit.DocumentLines.push({
						//"ItemCode": sObj.NPDNMCode,
						// "ItemCode": sObj.ItemCode, //changed by susmita
						// "ItmGrpCode": 100,
						"BaseType": 202,
						"BaseEntry": docNUM,
						"BaseLine": 0,
						"WarehouseCode": sObj.WhsCode,
						"Quantity": quantity,
						"BatchNumbers": [{
							"BatchNumber": sObj.METRCUID, // <THIS IS TAG>
							"Quantity": quantity, //<THIS IS THE QTY OF CLONES>
							"Location": sObj.BinLocationCode //<THIS IS FROM CLONE ROOM>
						}],
						"DocumentLinesBinAllocations": [{
							"BinAbsEntry": Number(AbslocationEntry),
							"Quantity": quantity,
							"SerialAndBatchNumbersBaseLine": 0
						}]
					});

					batchUrl.push({
						url: "/b1s/v2/InventoryGenExits",
						data: payLoadInventoryExit,
						method: "POST"
					});

					var secondPatchCall = {
						"ProductionOrderStatus": "boposClosed",
					};

					batchUrl.push({
						url: "/b1s/v2/ProductionOrders(" + Number(docNUM) + ")",
						data: secondPatchCall,
						method: "PATCH"
					});

					if (batchUrl.length > 0) {
						that.createBatchCall(batchUrl, function () {
							count--;
							if (count == 0) {
								that.createPackage.setBusy(false);
								that.createPackage.close();
								sap.m.MessageToast.show("Package created successfully");
								that.byId("inTakeTable").clearSelection();
								that.loadMasterData();
							}
						});
					}

				}.bind(that), payLoadProduction, "POST");

			});

			//update remaining quantity to manage package table after creating package
			// var avalQty = Number(sObj.Quantity) - Number(sObj.NQNTY);
			// var uploadPayLoad = {
			// 	// U_NLQTY: avalQty,
			// 	Quantity:avalQty,
			// };
			// that.updateServiecLayer("/b1s/v2/NMPCL(" + sObj.DocNum + ")", function () {}, uploadPayLoad, "PATCH");
			//update tag table after creating package
			/*var tagsPayload = {
				U_NTGST: "Used"
			};
			that.updateServiecLayer("/b1s/v2/NMTST(" + sObj.tagCode + ")", function () {}.bind(that), tagsPayload,
				"PATCH");*/

			// that.createPackage.setBusy(false);
		},

		columnMove: function (evt) {

		},

		/*** combine packages starts ***/

		handlecombinePackages: function () {
			var sObj;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var itemCodeList;
			jsonModel.setProperty("/NPDNMCode", "");
			var itemGrpCodesIntake = jsonModel.getProperty("/itemGrpCodeIntake");
			this.loadItemData();
			if (!this.CombinePackages) {
				this.CombinePackages = sap.ui.xmlfragment("CombinePackages", "com.9b.inTake.view.fragments.CombinePackages", this);
				this.getView().addDependent(this.CombinePackages);
			}
			var sArrayObj = [];
			var harvestTable = this.byId("inTakeTable");
			if (harvestTable.getSelectedIndices().length === 0) {
				sap.m.MessageToast.show("Please select a batch");
				return;
			} else {
				var sItems;
				var table = this.getView().byId("inTakeTable");
				sItems = table.getSelectedIndices();
				var countQty = 0;
				var arr = [];
				itemCodeList = jsonModel.getProperty("/allItemsList");
				$.each(sItems, function (i, e) {
					sObj = table.getContextByIndex(e).getObject();
					sObj.STATUSQTY = "None";
					sObj.U_NLABEL = "";
					sObj.QTYTXT = "";
					sObj.NQNTY = "";
					sObj.tagCode = "";
					sObj.NTRID = "";
					sObj.NSTLN = "";
					sObj.NSTLNCODE = "";
					sObj.NPDNMText = "";
					sObj.selectedItemKey = "";
					//sObj.NPDNMCode = "";
					sObj.SNO = "#" + (i + 1);
					sObj.itemList = [];

					countQty = countQty + sObj.Quantity;
					// if (sObj.ItemName && sObj.ItemName.search("Clone") !== -1) {
					// 	itemCodeList = jsonModel.getProperty("/cloneItemCodeList");
					// } else {
					// 	itemCodeList = jsonModel.getProperty("/itemCodeList");
					// }

					// var rObj = $.grep(itemCodeList, function (item) {
					// 	if (item.ItemName !== "" && item.ItemName.search(sObj.StrainName) !== -1) {
					// 		return item;
					// 	}
					// });
					// if (rObj.length > 0) {
					// 	sObj.itemList = rObj;
					// }

					// var rObj = $.grep(itemCodeList, function (item) {
					// 	if (item.ItemName !== "" && item.ItemName.search(sObj.ItemName) !== -1) {
					// 		return item;
					// 	}
					// });
					// if (rObj.length > 0) {

					// 	var rObj2 = $.grep(itemCodeList, function (item) {
					// 		if (rObj[0].ItemsGroupCode == item.ItemsGroupCode) {
					// 			arr.push(item);
					// 		}
					// 	});
					// 	sObj.itemList = arr;
					// 	jsonModel.setProperty("/combinePackagesItems", arr);
					// }

					// var rObj = $.grep(itemCodeList, function (item) {
					// 	if (sObj.ItemName == item.ItemName) {
					// 		return item;
					// 	}
					// });
					// if (rObj.length > 0) {
					// 	sObj.NPDNMCode = rObj[0].ItemCode;
					// 	sObj.NPDNMText = rObj[0].ItemName;
					// 	sObj.ProductCost = rObj[0].ProdStdCost;
					// 	sObj.UOMCode = rObj[0].InventoryUOM;
					// }

					sArrayObj.push(sObj);
				});

				$.each(itemGrpCodesIntake, function (i, m) {
					var rObj2 = $.grep(itemCodeList, function (item) {
						if (item.ItemsGroupCode && m.key == item.ItemsGroupCode) {
							arr.push(item);
						}
					});
				});
				jsonModel.setProperty("/combinePackagesItems", arr);
				jsonModel.setProperty("/totalQtyCombinepack", countQty);
			}
			jsonModel.setProperty("/combinePackagesRow", sArrayObj);
			sap.ui.core.Fragment.byId("CombinePackages", "combinePacknewItem").setValue("");
			sap.ui.core.Fragment.byId("CombinePackages", "combineNewTag").setValue("");

			jsonModel.setProperty("/temChangeLoc", "");
			this.CombinePackages.open();
			// this.loadTagsDataInPkg();
			this.loadLocationsDataInPkg();
		},

		onCombinePackages: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var combinePackagesRowData = jsonModel.getProperty("/combinePackagesRow");
			var ChangeLocationList = jsonModel.getProperty("/harvestLocData");
			var cDate = this.convertUTCDate(new Date());
			var metrcData = jsonModel.getProperty("/metrcData");
			var that = this;
			var createPackage = this.CombinePackages;
			var count = combinePackagesRowData.length;
			var totalQtyCombinepack = jsonModel.getProperty("/totalQtyCombinepack");
			// validation
			var selectedPackages = [];
			var isValidated = true;
		//	var SelectedItem = sap.ui.core.Fragment.byId("CombinePackages", "combinePacknewItem").getSelectedKey();
			var newMetrcTag = sap.ui.core.Fragment.byId("CombinePackages", "combineNewTag").getValue();
			var combineObj = jsonModel.getProperty("/combineObj");

			if (combineObj.ItemCode == "") {
				sap.m.MessageToast.show("Please select Item");
				isValidated = false;
			}
			if (newMetrcTag == "") {
				sap.m.MessageToast.show("Please select new package");
				isValidated = false;
			}

			if (isValidated) {
				var payLoadInventoryEntry = {};
				var payLoadInventoryExit = {};
				var metricPayload = [];

				var metricobj = {
					Tag: newMetrcTag,
					Location: ChangeLocationList[0].U_MetrcLocation, //sObj.U_MetrcLocation,
					Item: combineObj.ItemName, //sObj.ItemName,
					Quantity: Number(totalQtyCombinepack),
					UnitOfMeasure: "Pounds",
					// PatientLicenseNumber: null,
					// Note: "Combine Packages",
					// IsProductionBatch: false,
					// IsDonation: false,
					// ProductRequiresRemediation: false,
					// UseSameItem: false,
					ActualDate: that.getSystemDate(),
					Ingredients: [
						// 	{
						// 	Package: sObj.METRCUID,
						// 	Quantity: Number(quantity),
						// 	UnitOfMeasure: sObj.UOMCode
						// }
					]
				};

				$.each(combinePackagesRowData, function (i, sObj) {
					var object = {
						Package: sObj.METRCUID,
						Quantity: Number(sObj.Quantity),
						UnitOfMeasure: "Pounds"
					};

					metricobj.Ingredients.push(object);
				});

				metricPayload.push(metricobj);

				if (metrcData && metrcData.U_NACST === "X") {
					var metrcUrl = "/packages/v2/?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
					that.CombinePackages.setBusy(true);
					that.callMetricsService(metrcUrl, "POST", metricPayload, function () {
						// that.createPackage.setBusy(false);
						sap.m.MessageToast.show("METRC sync completed successfully");
						that.CombinePackagestoTable();
					}, function (error) {
						sap.m.MessageToast.show(JSON.stringify(error));
						that.CombinePackages.setBusy(false);
					});
				} else {

					that.CombinePackagestoTable();
				}
			}
		},

		CombinePackagestoTable: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var combinePackagesRowData = jsonModel.getProperty("/combinePackagesRow");
			var ChangeLocationList = jsonModel.getProperty("/harvestLocData");
			var cDate = this.convertUTCDate(new Date());
			var metrcData = jsonModel.getProperty("/metrcData");
			var allItemsLists = jsonModel.getProperty("/allItemsList");
			var that = this;
			var createPackage = this.CombinePackages;
			var count = combinePackagesRowData.length;
			var totalQtyCombinepack = jsonModel.getProperty("/totalQtyCombinepack");
			// validation
			var selectedPackages = [];
			var isValidated = true;
			//var SelectedItem = sap.ui.core.Fragment.byId("CombinePackages", "combinePacknewItem").getSelectedKey();
			var combineObj = jsonModel.getProperty("/combineObj");
			var newMetrcTag = sap.ui.core.Fragment.byId("CombinePackages", "combineNewTag").getValue();
			var that = this;

			var payLoadProduction = {
				"ItemNo": combineObj.ItemCode,
				"DistributionRule": "PROC",
				"PlannedQuantity": totalQtyCombinepack, //updateObject.Quantity,
				"ProductionOrderType": "bopotSpecial",
				"PostingDate": cDate,
				"DueDate": cDate,
				"Warehouse": combinePackagesRowData[0].WhsCode,
				"Remarks": "Manage Inventory – Combine Packages",
				"ProductionOrderLines": []
			}

			$.each(combinePackagesRowData, function (i, obj) {

				var rObj = $.grep(allItemsLists, function (item) {
					if (item.ItemName && obj.ItemName && obj.ItemName == item.ItemName) {
						return item;
					}
				});

				var insideObj = {
					"ItemNo": rObj[0].ItemCode,
					"DistributionRule": "PROC",
					"PlannedQuantity": obj.Quantity,
					"ProductionOrderIssueType": "im_Manual",
					"Warehouse": obj.WhsCode,
				};

				payLoadProduction.ProductionOrderLines.push(insideObj);

			});

			var batchUrl = [];
			that.updateServiecLayer("/b1s/v2/ProductionOrders", function (res) {
				var docNUM = Number(res.AbsoluteEntry);
				var BaseLine = res;

				var rObj = $.grep(ChangeLocationList, function (sLoc) {
					if (sLoc.BinCode === combinePackagesRowData[0].BinLocationCode) {
						return sLoc;
					}
				});
				var absEntry = rObj[0].AbsEntry;

				var fisrtPatchCall = {
					"ProductionOrderStatus": "boposReleased",
				};

				batchUrl.push({
					url: "/b1s/v2/ProductionOrders(" + docNUM + ")",
					data: fisrtPatchCall,
					method: "PATCH"
				});

				var payLoadInventoryExits = {
					"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
					"Comments": "Manage Inventory - Combine packages",
					"DocumentLines": []
				};
				var sourceEntry = combinePackagesRowData.map(item => item.METRCUID).join(", ");

				$.each(combinePackagesRowData, function (i, sObj) {
					payLoadInventoryExits.DocumentLines.push({

						"WarehouseCode": sObj.WhsCode,
						"BaseType": 202,
						"BaseEntry": docNUM,
						"BaseLine": i,
						"Quantity": sObj.Quantity,
						"BatchNumbers": [{
							"BatchNumber": sObj.METRCUID, // <THIS IS TAG>
							"Quantity": sObj.Quantity, //<THIS IS THE QTY OF CLONES>
							"Location": sObj.BinLocationCode, //updateObject.WhsCode, //<THIS IS FROM CLONE ROOM>
							"U_BatAttr3": sObj.SourceUID, //updateObject.SourceUID, //sourceTag
							"ManufacturerSerialNumber": sObj.HarvestName //harvestTag
						}],
						"DocumentLinesBinAllocations": [{
							"BinAbsEntry": Number(absEntry),
							"Quantity": sObj.Quantity,
							"SerialAndBatchNumbersBaseLine": 0
						}]

					});

				});

				batchUrl.push({
					url: "/b1s/v2/InventoryGenExits",
					data: payLoadInventoryExits,
					method: "POST"
				});

				var payLoadInventoryEntry1 = {
					"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
					"Comments": "Manage Inventory - Combine packages",
					"DocumentLines": [{

						"WarehouseCode": combinePackagesRowData[0].WhsCode, // <THIS IS FROM CLONE ROOM>
						"BaseType": 202,
						"BaseEntry": docNUM,
						"Quantity": totalQtyCombinepack, //updateObject.Quantity, // <THIS IS THE QTY OF CLONES>
						// "UnitPrice": Number(ProdStdCost),
						"BatchNumbers": [{
							"BatchNumber": newMetrcTag, // <THIS IS TAG>
							"Quantity": totalQtyCombinepack, //updateObject.Quantity, //<THIS IS THE QTY OF CLONES>
							"Location": combinePackagesRowData[0].BinLocationCode,
							//<THIS IS FROM CLONE ROOM>
							"U_Phase": "Package",
							"U_IsPackage": "YES",
							"ManufacturerSerialNumber": combinePackagesRowData[0].HarvestName, //harvestTag
							"U_BatAttr3": sourceEntry //combinePackagesRowData[0].METRCUID, //sourceTag
						}],
						"DocumentLinesBinAllocations": [{
							"BinAbsEntry": Number(absEntry),
							"Quantity": totalQtyCombinepack, //updateObject.Quantity,
							"SerialAndBatchNumbersBaseLine": 0

						}]
					}]
				};
				batchUrl.push({
					url: "/b1s/v2/InventoryGenEntries",
					data: payLoadInventoryEntry1,
					method: "POST"
				});

				var secondPatchCall = {
					"ProductionOrderStatus": "boposClosed",
				};

				batchUrl.push({
					url: "/b1s/v2/ProductionOrders(" + Number(docNUM) + ")",
					data: secondPatchCall,
					method: "PATCH"
				});

				if (batchUrl.length > 0) {

					this.createBatchCall(batchUrl, function () {
						jsonModel.setProperty("/busyView", false);

						that.CombinePackages.setBusy(false);
						that.getView().byId("inTakeTable").clearSelection();
						that.loadMasterData();
						that.CombinePackages.close();
					}, this.CombinePackages);

				}

			}.bind(that), payLoadProduction, "POST");
		},

		oncloseCombinePackages: function () {
			this.CombinePackages.close();
		},
		/*** combine packages ends ***/

		rowSelectionChange: function (evt) {
			var sObj = evt.getParameter("rowContext").getObject();
			if (sObj.U_NSTUS === "Transfer Created") {
				var sIndex = evt.getParameter("rowIndex");
				evt.getSource().removeSelectionInterval(sIndex, sIndex);
				sap.m.MessageToast.show("Transfer is already created for the selected package");
			}
		},

		onFilterTable: function (evt) {
			var customData = evt.getParameter("column").getLabel().getCustomData();
			if (customData.length > 0 && customData[0].getKey() === "DAYS") {
				var sValue = evt.getParameter("value");
				var filters = [new sap.ui.model.Filter("U_NLQTY", "EQ", sValue)];
				this.byId("inTakeTable").getBinding("rows").filter(filters);
			}
		},

		/** Method for clear all filters**/
		removefilters: function () {
			var filterTable = this.getView().byId("inTakeTable");
			var aColumns = filterTable.getColumns();
			for (var i = 0; i <= aColumns.length; i++) {
				filterTable.filter(aColumns[i], null);
				filterTable.sort(aColumns[i], null);
			}
			this.byId("searchFieldTable").removeAllTokens();
		},
		clearAllFilters: function () {
			this.removefilters();
			this.getView().byId("inTakeTable").clearSelection();
		},
		/*method start for create lab sample*/
		oncreateLabDelete: function (evt) {
			var jsonModel = this.getView().getModel("jsonModel");
			var createLabPackageData = jsonModel.getProperty("/createLabPackageData");
			var sIndex = evt.getSource().getParent().getParent().indexOfItem(evt.getSource().getParent());
			createLabPackageData.splice(sIndex, 1);
			jsonModel.setProperty("/createLabPackageData", createLabPackageData);
		},

		onCreateLabTemApply: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var temLocation = sap.ui.core.Fragment.byId("createLabSampleDialog", "temLocationId");
			var temRequiredTestId = sap.ui.core.Fragment.byId("createLabSampleDialog", "temRequiredTestId");
			var sLocText = "";
			if (temLocation.getSelectedItem()) {
				var sLocText = temLocation.getSelectedItem().getText();
			}
			var createLabPackageData = jsonModel.getProperty("/createLabPackageData");
			var sLoc = jsonModel.getProperty("/temChangeLoc");
			var temNSRTD = jsonModel.getProperty("/temNSRTD");
			$.each(createLabPackageData, function (i, e) {
				e.NSTLN = sLocText;
				// e.U_NLCNM_TO = sLocText;
				e.NSRTD = temNSRTD;
			});
			jsonModel.setProperty("/createLabPackageData", createLabPackageData);
		},

		handleCreateLabSample: function () {
			var sObj;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var itemCodeList = jsonModel.getProperty("/itemCodeList");
			var deviceModel = this.getView().getModel("device");
			var isPhone = deviceModel.getProperty("/system/phone");
			if (!this.createLabSampleDialog) {
				this.createLabSampleDialog = sap.ui.xmlfragment("createLabSampleDialog", "com.9b.inTake.view.fragments.CreateLabSample",
					this);
				this.getView().addDependent(this.createLabSampleDialog);
			}
			var sArrayObj = [];

			var harvestTable = this.byId("inTakeTable");
			if (harvestTable.getSelectedIndices().length === 0) {
				sap.m.MessageToast.show("Please select a batch");
				return;
			} else {
				var sItems;
				var table = this.getView().byId("inTakeTable");
				sItems = table.getSelectedIndices();
				$.each(sItems, function (i, e) {
					sObj = table.getContextByIndex(e).getObject();
					sObj.STATUSQTY = "None";
					sObj.U_NLABEL = "";
					sObj.QTYTXT = "";
					sObj.NQNTY = "";
					sObj.tagCode = "";
					sObj.NTRID = "";
					sObj.NSTLN = "";
					sObj.NSTLNCODE = "";
					sObj.NSRTD = "";
					sObj.SNO = "#" + (i + 1);
					$.grep(itemCodeList, function (item) {
						if (item.ItemName && item.ItemName !== "" && item.ItemName.search(sObj.U_NSTNM) !== -1) {
							sObj.NPDNMText = item.ItemName;
							sObj.NPDNMCode = item.ItemCode;
						}
					});
					sArrayObj.push(sObj);
				});
			}

			jsonModel.setProperty("/createLabPackageData", sArrayObj);
			jsonModel.setProperty("/temChangeLoc", "");
			jsonModel.setProperty("/temNSRTD", "");
			this.createLabSampleDialog.open();
			this.loadTagsDataInPkg();
			this.loadLocationsDataInPkg();
			this.loadRequiredTests();
		},
		loadRequiredTests: function (evt) {
			var jsonModel = this.getView().getModel("jsonModel");
			this.readServiecLayer("/b1s/v2/U_NRQTS", function (data) {
				jsonModel.setProperty("/requiredTestsData", data.value);
			});
		},
		onCreateLabSampleClose: function () {
			this.createLabSampleDialog.close();
		},
		onConfirmCreateLabSample: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var createLabPackageData = jsonModel.getProperty("/createLabPackageData");
			var requiredTestsData = jsonModel.getProperty("/requiredTestsData");
			var metrcData = jsonModel.getProperty("/metrcData");
			var cDate = this.convertUTCDate(new Date());
			var that = this;
			var createPackage = this.createLabSampleDialog;
			var count = createLabPackageData.length;
			// validation
			var selectedPackages = [],
				metricPayload = [],
				payLoadInventory = {},
				payLoadInventoryExit = {};
			var isValidated = true;
			$.each(createLabPackageData, function (i, sObj) {
				selectedPackages.push(sObj.NTRID);
				if (sObj.NQNTY === "") {
					sObj.STATUSQTY = "Error";
					sObj.QTYTXT = "Enter Quantity";
					isValidated = false;
				} else {
					sObj.STATUSQTY = "None";
				}
				if (sObj.STATUSQTY === "Error") {
					isValidated = false;
				}
				if (sObj.NTRID === "") {
					sObj.STATUSTAG = "Error";
					sObj.TAGTXT = "Select Package Tag";
					isValidated = false;
				} else {
					sObj.STATUSTAG = "None";
				}
				if (sObj.NSTLN === "") {
					sObj.STATUSLOC = "Error";
					sObj.LOCTXT = "Select Location";
					isValidated = false;
				} else {
					sObj.STATUSLOC = "None";
				}

			});
			var uniquePackages = selectedPackages.filter(function (item, pos) {
				return selectedPackages.indexOf(item) == pos;
			});
			// jsonModel.refresh(true);
			if (isValidated) {
				if (selectedPackages.length !== uniquePackages.length) {
					sap.m.MessageToast.show("Please select unique package tags");
					return false;
				}

				if (metrcData && metrcData.U_NACST === "X") {

					$.each(createLabPackageData, function (i, e) {

						var requiredtest = [];
						e.NSRTD.shift();
						$.each(requiredTestsData, function (i, k) {

							for (var i = 0; i < e.NSRTD.length; i++) {
								if (e.NSRTD[i] == k.Code) {
									requiredtest.push(k.Name);
								}

							}
						});

						var quantity = Number(e.NQNTY).toFixed(2);
						var pObj = {
							Tag: e.NTRID,
							Location: e.NSTLN,
							Item: e.NPDNMText,
							Quantity: Number(quantity),
							UnitOfMeasure: "Grams",
							// PatientLicenseNumber: null,
							Note: e.U_NNOTE,
							// IsProductionBatch: false,
							// ProductionBatchNumber: null,
							// IsDonation: false,
							// ProductRequiresRemediation: false,
							// UseSameItem: false,
							ActualDate: that.getSystemDate(),
							Ingredients: [{
								Package: e.METRCUID,
								Quantity: Number(quantity),
								UnitOfMeasure: "Grams"
							}],
							RequiredLabTestBatches: requiredtest
						};
						metricPayload.push(pObj);
					});
					var metrcUrl = "/packages/v2/testing?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
					that.createLabSampleDialog.setBusy(true);
					that.callMetricsService(metrcUrl, "POST", metricPayload, function () {
						// that.createLabSampleDialog.setBusy(false);
						sap.m.MessageToast.show("METRC sync completed successfully");

						that.createLabSampletoTable(createLabPackageData, that, count);

					}, function (error) {
						sap.m.MessageToast.show(JSON.stringify(error));
						that.createLabSampleDialog.setBusy(false);
					});
				} else {

					that.createLabSampletoTable(createLabPackageData, that, count);

				}

			}
		},

		createLabSampletoTable: function (createLabPackageData, that, count) {

			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var requiredTestsData = jsonModel.getProperty("/requiredTestsData");
			var payLoadInventory = {},
				payLoadInventoryExit = {};
			that.createLabSampleDialog.setBusy(true);
			$.each(createLabPackageData, function (i, sObj) {
				//create new package
				// var payLoadCreate = {
				// 	U_NCRDT: cDate,
				// 	U_NTKID: sObj.NTRID, //tracking Id
				// 	U_NHBID: sObj.Id, // harvest Batch Id
				// 	U_NLQTY: sObj.NQNTY, // sqty
				// 	U_NSGLC: sObj.NSTLN, // location
				// 	U_NSTNM: sObj.U_NSTNM, // strain
				// 	U_NLFID: sObj.U_NLFID, //license
				// 	U_NSRPK: sObj.U_NTKID, //source Tag 
				// 	U_NLOCD: sObj.WhsCode,
				// 	U_NLBST: "Submitted For Testing", //lab status
				// 	//	U_NPDCD: sObj.U_NPDCD,
				// 	U_NPDNM: sObj.NPDNMText,
				// 	U_NPDCD: sObj.NPDNMCode
				// };
				that.createLabSampleDialog.setBusy(true);
				var BatchNumber = sObj.NTRID;
				var quantity = Number(sObj.NQNTY).toFixed(2);
				payLoadInventory = {
					"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
					"Comments": "Manage Packages – Create Lab Sample",
					"DocumentLines": []
				};
				payLoadInventory.DocumentLines.push({
					"ItemCode": sObj.NPDNMCode,
					"ItmGrpCode": 100,
					"WarehouseCode": sObj.WhsCode,
					"Quantity": quantity,
					"BatchNumbers": [{
						"BatchNumber": BatchNumber, // <THIS IS TAG>
						"Quantity": quantity, //<THIS IS THE QTY OF CLONES>
						"Location": sObj.WhsCode, //<THIS IS FROM CLONE ROOM>
						"U_BatAttr3": sObj.METRCUID, //sourceTag
						"ManufacturerSerialNumber": sObj.MnfSerial //harvest name
					}]
				});
				var BatchNumberForExit = sObj.U_NTKID;
				payLoadInventoryExit = {
					"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
					"Comments": "Manage Packages – Transfer Template",
					"DocumentLines": []
				};
				payLoadInventoryExit.DocumentLines.push({
					"ItemCode": sObj.NPDNMCode,
					"ItmGrpCode": 100,
					"WarehouseCode": sObj.WhsCode,
					"Quantity": quantity,
					"BatchNumbers": [{
						"BatchNumber": sObj.METRCUID, // <THIS IS TAG>
						"Quantity": quantity, //<THIS IS THE QTY OF CLONES>
						"Location": sObj.WhsCode //<THIS IS FROM CLONE ROOM>
					}]
				});

				// that.updateServiecLayer("/b1s/v2/NMPCL", function () {

				that.updateServiecLayer("/b1s/v2/InventoryGenEntries", function (res, sData) {
					count--;
					that.updateServiecLayer("/b1s/v2/InventoryGenExits", function (resExit, sDataExit) {}, payLoadInventoryExit, "POST");
					if (count == 0) {
						that.loadMasterData();
						that.createLabSampleDialog.setBusy(false);
						that.createLabSampleDialog.close();
						sap.m.MessageToast.show("Lab sample created successfully");
						that.byId("inTakeTable").clearSelection();
						// that.createLabSampleDialog.setBusy(false);			
					}
				}.bind(that), payLoadInventory, "POST");
			});
			//update remaining quantity to manage package table after creating package
			// var avalQty = Number(sObj.Quantity) - Number(sObj.NQNTY);
			// var uploadPayLoad = {
			// 	Quantity: avalQty
			// };
			// that.updateServiecLayer("/b1s/v2/NMPCL(" + sObj.DocNum + ")", function () {}.bind(that), uploadPayLoad, "PATCH");
			//update tag table after creating package
			/*	var tagsPayload = {
					U_NTGST: "Used"
				};
				that.updateServiecLayer("/b1s/v2/NMTST(" + sObj.tagCode + ")", function () {}.bind(that), tagsPayload,
					"PATCH");*/
			// }.bind(that), payLoadCreate, "POST");
		},

		/*method start for create lab sample*/
		refreshData: function () {
			// this.clearAllFilters();
			this.byId("searchFieldTable").removeAllTokens();
			this.loadMasterData();
		},
		/** Method used to call function for export to excel for plant table.*/
		handleExportToExcel: function () {
			var deviceModel = this.getView().getModel("device");
			var isPhone = deviceModel.getProperty("/system/phone");
			var exportData = [];
			var that = this;

			var table = this.getView().byId("inTakeTable");
			if (table.getSelectedIndices().length > 0) {
				$.each(table.getSelectedIndices(), function (i, e) {
					var obj = table.getContextByIndex(e).getObject();
					//var reportedDate = that.convertDate(obj.U_NDRDT);
					var expData = {
						Tag: obj.NTRID,
						HarvestBatch: obj.U_NHBID,
						StrainName: obj.U_NSTNM,
						StorageLocation: obj.U_NSGLC,
						Quantity: obj.U_NLQTY,
						CreatedDate: obj.U_NCRDT
					};
					exportData.push(expData);
				});
			} else {
				sap.m.MessageToast.show("Please select one item");
				return;
			}
			//Plants Report
			var dateFormat = DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd-HH:mm:ss"
			});
			var dateStr = dateFormat.format(new Date());
			var ShowLabel = "Waste Records";
			var ReportTitle = ShowLabel + dateStr;
			this.exportToExcel(exportData, ReportTitle, ShowLabel);
		},
		handleFinish: function (evt) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sItems;
			var inTakeTable = this.getView().byId("inTakeTable");
			sItems = inTakeTable.getSelectedIndices();
			//var cDate = this.convertUTCDate(new Date());
			var metrcData = jsonModel.getProperty("/metrcData");
			var that = this;
			var metricPayload = [];
			var updateArray = [];
			var metrcPayLoadObj;
			this.getView().setBusy(true);
			$.each(sItems, function (i, e) {
				var updateObject;
				updateObject = inTakeTable.getContextByIndex(e).getObject();
				if (updateObject.Quantity === 0) {
					updateArray.push(updateObject);
					metrcPayLoadObj = {
						Label: updateObject.METRCUID,
						ActualDate: updateObject.CreateDate
					};
					metricPayload.push(metrcPayLoadObj);
				}
			});
			var uploadPayLoad = {
				"Status": "bdsStatus_NotAccessible"
			};

			if (sItems.length > 0) {
				if (updateArray.length > 0) {
					var count = updateArray.length;
					that.getView().setBusy(true);
					if (metrcData && metrcData.U_NACST === "X") {

						var metrcUrl = "/packages/v2/finish?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
						that.callMetricsService(metrcUrl, "PUT", metricPayload, function () {
							sap.m.MessageToast.show("METRC sync completed successfully");

							$.each(updateArray, function (i, e) {
								that.updateServiecLayer("/b1s/v2/BatchNumberDetails(" + e.BatchAbsEntry + ")", function () {
									count--;
									if (count == 0) {
										that.getView().setBusy(false);
										that.getView().byId("inTakeTable").clearSelection();
										// setTimeout(function () {
										that.loadMasterData();
										// }, 1000);
									}
								}, uploadPayLoad, "PATCH");
								that.getView().setBusy(false);
							});

						}, function (error) {
							that.getView().setBusy(false);
							sap.m.MessageToast.show(JSON.stringify(error));
						});

					} else {

						$.each(updateArray, function (i, e) {
							that.updateServiecLayer("/b1s/v2/BatchNumberDetails(" + e.BatchAbsEntry + ")", function () {
								count--;
								if (count == 0) {
									that.getView().setBusy(false);
									that.getView().byId("inTakeTable").clearSelection();
									// setTimeout(function () {
									that.loadMasterData();
									// }, 1000);
								}
							}, uploadPayLoad, "PATCH");
							that.getView().setBusy(false);
						});

					}

				} else {
					that.getView().setBusy(false);
					sap.m.MessageToast.show("Please select batches with quantity '0'");
				}
			} else {
				that.getView().setBusy(false);
				sap.m.MessageToast.show("Please select atleast one item");
			}
		},

		onAdjustTemApply: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var temreasonapply = sap.ui.core.Fragment.byId("adjustQty", "reasonapply");
			// var temRequiredTestId = sap.ui.core.Fragment.byId("adjustQty", "temRequiredTestId");
			var sReasonText = "";
			if (temreasonapply.getSelectedItem()) {
				var sReasonText = temreasonapply.getSelectedItem().getText();
			}
			var batches = jsonModel.getProperty("/batches");
			var temREASON = jsonModel.getProperty("/temREASON");
			var temNOTES = jsonModel.getProperty("/temNOTES");
			$.each(batches, function (i, e) {
				e.NOTES = temNOTES;
				// e.U_NLCNM_TO = sLocText;
				e.REASON = temREASON;
			});
			jsonModel.setProperty("/batches", batches);
		},

		onAdjustDelete: function (evt) {
			var jsonModel = this.getView().getModel("jsonModel");
			var batches = jsonModel.getProperty("/batches");
			var sIndex = evt.getSource().getParent().getParent().indexOfItem(evt.getSource().getParent());
			batches.splice(sIndex, 1);
			jsonModel.setProperty("/batches", batches);
		},
		loadMetrcWasteReasons: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var licenseNo = jsonModel.getProperty("/selectedLicense");
			jsonModel.setProperty("/mComboBoxBusy", true);
			var metrcUrl = "/packages/v2/adjust/reasons?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
			this.callMetricsGETService(metrcUrl, function (itemData) {
				jsonModel.setProperty("/mComboBoxBusy", false);
				jsonModel.setProperty("/metrcReasons", itemData.Data);

			}, function (error) {
				that.getView().setBusy(false);
				sap.m.MessageToast.show(JSON.stringify(error));
			});
		},

		handleAdjust: function () {
			var deviceModel = this.getView().getModel("device");
			var isPhone = deviceModel.getProperty("/system/phone");
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sItems;
			this.loadLocationsDataInPkg();
			var table = this.getView().byId("inTakeTable");
			sItems = table.getSelectedIndices();
			this.loadItemData();
			var allItemsList = jsonModel.getProperty("/allItemsList");
			if (sItems.length > 0) {
				if (!this.adjustQtyDialog) {
					this.adjustQtyDialog = sap.ui.xmlfragment("adjustQty", "com.9b.inTake.view.fragments.AdjustQuantity",
						this);
					this.getView().addDependent(this.adjustQtyDialog);
				}
				this.loadMetrcWasteReasons();
				this.adjustQtyDialog.open();
				var batches = [];
				$.each(sItems, function (i, e) {
					var updateObject;
					updateObject = table.getContextByIndex(e).getObject();
					updateObject.NOTES = "";
					updateObject.AQTY = "";
					updateObject.NEWQTY = "";
					updateObject.REASON = "";
					updateObject.SNO = "#" + (i + 1);

					var dryCanGrpItem = $.grep(allItemsList, function (e) {
						if (e.ItemName && updateObject.ItemName == e.ItemName) {
							return e;
						}
					});

					if (dryCanGrpItem.length > 0) {
						updateObject.UOMCode = dryCanGrpItem[0].InventoryUOM;
					}

					batches.push(updateObject);
				});
			} else {
				sap.m.MessageToast.show("Please select a batch");
			}
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			jsonModel.setProperty("/temREASON", "");
			jsonModel.setProperty("/temNOTES", "");
			jsonModel.setProperty("/batches", batches);
		},
		onConfirmAdjust: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var cDate = this.convertUTCDate(new Date());
			var metrcData = jsonModel.getProperty("/metrcData");
			var batches = jsonModel.getProperty("/batches");
			var that = this;
			var metricPayload = [];
			var metrcPayLoadObj;
			var isValidated = true;
			$.each(batches, function (i, sObj) {
				if (sObj.AQTY === "") {
					sap.m.MessageToast.show("Please enter adjust quantity");
					isValidated = false;
					return;
				}
				if (sObj.REASON === "") {
					sap.m.MessageToast.show("Please select reason");
					isValidated = false;
					return;
				}
				if (sObj.NOTES === "") {
					sap.m.MessageToast.show("Please enter notes");
					isValidated = false;
					return;
				}
			});
			if (isValidated) {
				if (metrcData && metrcData.U_NACST === "X") {
					var itemCodeList;
					$.each(batches, function (i, updateObject) {
						// if (updateObject.ItemName && updateObject.ItemName.search("Clone") !== -1) {
						// 	itemCodeList = jsonModel.getProperty("/cloneItemCodeList");
						// } else {
						// 	itemCodeList = jsonModel.getProperty("/itemCodeList");
						// }
						// $.grep(itemCodeList, function (item) {
						// 	if (item.ItemName !== "" && item.ItemName.search(updateObject.ItemName) !== -1) {
						// 		updateObject.UOMCode = item.InventoryUOM;
						// 	}
						// });
						metrcPayLoadObj = {
							Label: updateObject.METRCUID,
							Quantity: Number(updateObject.AQTY),
							UnitOfMeasure: updateObject.UOMCode,
							AdjustmentReason: updateObject.REASON,
							AdjustmentDate: that.getSystemDate(),
							ReasonNote: updateObject.NOTES
						};
						metricPayload.push(metrcPayLoadObj);
					});
				}
				if (metrcData && metrcData.U_NACST === "X") {
					// var count = metricPayload.length;
					var metrcUrl = "/packages/v2/adjust?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
					that.adjustQtyDialog.setBusy(true);
					that.callMetricsService(metrcUrl, "POST", metricPayload, function () {
						// that.adjustQtyDialog.setBusy(false);
						sap.m.MessageToast.show("METRC sync completed successfully");
						that.AdjusttoTable(batches, that);
					}, function (error) {
						that.adjustQtyDialog.setBusy(false);
						sap.m.MessageToast.show(JSON.stringify(error));
						// that.adjustQtyDialog.close();
					});
				} else {
					that.AdjusttoTable(batches, that);
				}
			}
		},

		AdjusttoTable: function (batches, that) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			that.adjustQtyDialog.setBusy(true);
			var count = batches.length;
			$.each(batches, function (i, sObj) {
				that.adjustQtyDialog.setBusy(true);
				var AbslocationEntry, BinCode, ProdStdCost;
				var cloneItemCodeList = jsonModel.getProperty("/cloneItemCodeList");
				var allItemsList = jsonModel.getProperty("/allItemsList");
				$.each(allItemsList, function (i, obj) {
					if (obj.ItemCode && sObj.ItemCode == obj.ItemCode) {
						ProdStdCost = obj.ProdStdCost;
					}
				});

				var ChangeLocationList = jsonModel.getProperty("/harvestLocData");
				$.each(ChangeLocationList, function (i, obj) {
					if (sObj.BinLocationCode.toLowerCase() == obj.BinCode.toLowerCase()) {
						AbslocationEntry = obj.AbsEntry;
						BinCode = obj.BinCode;
					}
				});

				// count--;
				// var uploadPayLoad = {
				// 	Quantity: sObj.NEWQTY
				// };
				// that.updateServiecLayer("/b1s/v2/sml.svc/CV_GH_BATCHQUERY_VW(" + sObj.id__ + ")", function () {}, uploadPayLoad, "PATCH");
				var payLoadInventoryExit = {
					"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
					"Comments": "Manage Packages - Adjust",
					"DocumentLines": []
				};
				var adjustedQty = Number(sObj.AQTY);
				payLoadInventoryExit.DocumentLines.push({
					"ItemCode": sObj.ItemCode,
					"CostingCode": "PROC",
					"ItmGrpCode": 100,
					"WarehouseCode": sObj.WhsCode,
					"Quantity": Math.abs(adjustedQty),
					"BatchNumbers": [{
						"BatchNumber": sObj.METRCUID, // <THIS IS TAG>
						"Quantity": Math.abs(adjustedQty), //<THIS IS THE QTY OF CLONES>
						"Location": BinCode //<THIS IS FROM CLONE ROOM>
					}],
					"DocumentLinesBinAllocations": [{
						"BinAbsEntry": Number(AbslocationEntry),
						"Quantity": Math.abs(adjustedQty),
						"SerialAndBatchNumbersBaseLine": 0
					}]
				});

				var payLoadInventoryEntry = {
					"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
					"Comments": "Manage Packages - Adjust",
					"DocumentLines": []
				};
				payLoadInventoryEntry.DocumentLines.push({
					"ItemCode": sObj.ItemCode,
					"CostingCode": "PROC",
					"ItmGrpCode": 100,
					"WarehouseCode": sObj.WhsCode,
					"Quantity": adjustedQty,
					"UnitPrice": Number(ProdStdCost),
					"BatchNumbers": [{
						"BatchNumber": sObj.METRCUID, // <THIS IS TAG>
						"Quantity": adjustedQty, //<THIS IS THE QTY OF CLONES>
						"Location": BinCode //<THIS IS FROM CLONE ROOM>
					}],
					"DocumentLinesBinAllocations": [{
						"BinAbsEntry": Number(AbslocationEntry),
						"Quantity": adjustedQty,
						"SerialAndBatchNumbersBaseLine": 0
					}]
				});
				if (Number(sObj.AQTY) + Number(sObj.Quantity) >= 0) {
					if (adjustedQty < 0) {
						that.updateServiecLayer("/b1s/v2/InventoryGenExits", function (resExit, sDataExit) {
							count--;
							if (count == 0) {
								that.loadMasterData();
								that.adjustQtyDialog.close();
								that.adjustQtyDialog.setBusy(false);
								sap.m.MessageToast.show("Package(s) adjusted successfully");
								that.getView().byId("inTakeTable").clearSelection();
							}
						}, payLoadInventoryExit, "POST");
						// that.loadMasterData();
					} else {
						that.updateServiecLayer("/b1s/v2/InventoryGenEntries", function (resEntry, sDataEntry) {
							count--;
							if (count == 0) {
								that.loadMasterData();
								that.adjustQtyDialog.close();
								that.adjustQtyDialog.setBusy(false);
								sap.m.MessageToast.show("Package(s) adjusted successfully");
								that.getView().byId("inTakeTable").clearSelection();
							}
						}, payLoadInventoryEntry, "POST");
						// that.loadMasterData();
					}
				} else {
					that.adjustQtyDialog.setBusy(false);
					sap.m.MessageToast.show("Adjust quantity is less than available quantity");
				}
			});
		},

		onAdjustClose: function () {
			this.adjustQtyDialog.close();
		},

		handleRowSelection: function (evt) {
			var PlannerTable = this.getView().byId("inTakeTable");
			var arr = [];
			if (evt.getParameter("rowContext")) {
				var jsonModel = this.getOwnerComponent().getModel("jsonModel");
				var sItems = PlannerTable.getSelectedIndices();
				if (sItems.length == 1) {
					jsonModel.setProperty("/batchDetailButton", true);
				} else {
					jsonModel.setProperty("/batchDetailButton", false);
				}
				$.each(sItems, function (i, e) {
					var updateObject = PlannerTable.getContextByIndex(e).getObject().ItemName;
					arr.push(updateObject);
				});
				if (arr.length > 0) {
					var names = [...new Set(arr)];
					var result = names.every(name => name.includes("Wet Cannabis"));
					if (PlannerTable.getSelectedIndices().length > 0) {

						if (result) {
							jsonModel.setProperty("/enableChangeGrowth", true);
						} else {
							jsonModel.setProperty("/enableChangeGrowth", false);
						}
					}
					// var rWaste = evt.getParameter("rowContext").getObject("ItemName");
					// if (rWaste.includes("Wet Cannabis") == true) {

					// jsonModel.setProperty("/enableChangeGrowth", true);
					// 	// if (rWaste === 0) {
					// 	// 	jsonModel.setProperty("/enableApprove", false);
					// 	// } else {
					// 	// 	jsonModel.setProperty("/enableApprove", true);
					// 	// }
					// 	// jsonModel.setProperty("/enableEdit", false);
					// 	// jsonModel.setProperty("/enableRecordWaste", true);
					// } else {
					// 	jsonModel.setProperty("/enableChangeGrowth", false);
					// }
				} else {
					jsonModel.setProperty("/enableChangeGrowth", false);
				}
			}
		},

		convertDate: function (date) {
			var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November",
				"December"
			];
			var year = date.getFullYear();
			var month = monthNames[date.getMonth()];
			var day = date.getDate().toString();
			day = day.length > 1 ? day : "0" + day;
			return month + "" + day + "," + year;
		},

		openLabReport: function (evt) {
			if (!this.labReportDialog) {
				this.labReportDialog = sap.ui.xmlfragment("lReport", "com.9b.managepackages.view.fragments.LabTestReport",
					this);
				this.getView().addDependent(this.labReportDialog);
			}
			this.labReportDialog.open();
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			this.labReportDialog.setModel(jsonModel);
			jsonModel.setProperty("/reportTableData", []);
			var sObj = evt.getSource().getBindingContext("jsonModel").getObject();
			var harvestId = sObj.Id;
			var srcPkg = sObj.U_NTKID;
			var metrcUrl = "/labtests/v1/results?packageId=" + harvestId + "&licenseNumber=" + jsonModel.getProperty("/selectedLicense");
			this.callMetrcGetService(metrcUrl, function (res) {
				if (res && res.length > 0) {
					res[0].srcPkg = srcPkg;
					jsonModel.setProperty("/reportHeader", res[0]);
					jsonModel.setProperty("/reportTableData", res);
				}

			}, function (error) {
				sap.m.MessageToast.show(JSON.stringify(error));
			});
		},
		onLabReportClose: function () {
			this.labReportDialog.close();
		},
		handlemarkasMother: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sItems;
			var table = this.getView().byId("inTakeTable");
			var sArrayObj = [];
			sItems = table.getSelectedIndices();
			var licenseNo = jsonModel.getProperty("/selectedLicense");
			var that = this;
			if (sItems.length > 0) {
				var sObj, payLoadInventory, batchUrl = [],
					payLoadUpdate;
				$.each(sItems, function (i, e) {
					payLoadInventory = {};
					sObj = table.getContextByIndex(e).getObject();
					var payLoadInventoryEntry = {
						U_Phase: "Mother"
					};
					batchUrl.push({
						url: "/b1s/v2/BatchNumberDetails(" + sObj.BatchAbsEntry + ")",
						data: payLoadInventoryEntry,
						method: "PATCH"
					});
				});
				jsonModel.setProperty("/errorTxt", []);
				this.createBatchCall(batchUrl, function () {
					sap.m.MessageToast.show("Batches moved to mother succsessfully");
					that.byId("inTakeTable").setSelectedIndex(-1);
					that.loadMasterData();
				});
			} else {
				sap.m.MessageToast.show("Please select atleast one batch");
			}
		}

	});
});