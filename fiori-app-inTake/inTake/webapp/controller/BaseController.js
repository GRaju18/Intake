/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat"
], function (Controller, UIComponent, History, MessageBox, Filter, FilterOperator, DateFormat) {
	"use strict";

	return Controller.extend("com.9b.inTake.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 **/
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		animatePlantCount: function () {
			$(".plantCountText").each(function () {
				$(this).prop("Counter", 0).animate({
					Counter: $(this).text()
				}, {
					duration: 4000,
					easing: "swing",
					step: function (now) {
						$(this).text(Math.ceil(now));
					}
				});
			});
		},

		getUsersService: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			this.readServiecLayer("/b1s/v2/UsersService_GetCurrentUser", function (data) {
				if (data.UserActionRecord.length) {
					var sTime = data.UserActionRecord[0].ActionTime;
					var sDate = data.UserActionRecord[0].ActionDate;
					var dateObj = new Date(sDate);
					dateObj.setHours(sTime.split(":")[0], sTime.split(":")[1], sTime.split(":")[2]);
					jsonModel.setProperty("/systemDate", dateObj);
					jsonModel.setProperty("/systemTime", sTime);
				} else {
					jsonModel.setProperty("/systemDate", new Date());
				}

			});
		},
		getSystemDate: function (sDate) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd",
				UTC: false
			});
			var systemDate;
			if (sDate) {
				var systemTime = jsonModel.getProperty("/systemTime");
				if (systemTime) {
					var sDate = new Date(sDate);
					sDate.setHours(systemTime.split(":")[0], systemTime.split(":")[1], systemTime.split(":")[2]);
				}
				systemDate = sDate;
			} else {
				systemDate = jsonModel.getProperty("/systemDate");
			}
			systemDate = dateFormat.format(new Date(systemDate));
			return systemDate;
		},

		adjustQuantity: function (evt) {
			var sObj = evt.getSource().getBindingContext("jsonModel").getObject();
			var aQty = sObj.Quantity;
			var sQty = evt.getParameter("value");
			if (Number(sQty) + Number(aQty) < 0) {
				sap.m.MessageToast.show("Adjust Quantity is Less than Available Quantity");
			} else {
				sObj.NEWQTY = Number(aQty) + (Number(sQty));
				//	var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			}
		},

		cellClick: function (evt) {
			//	evt.getParameter("cellControl").getParent()._setSelected(true);
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var cellControl = evt.getParameter("cellControl");
			var isBinded = cellControl.getBindingContext("jsonModel");
			if (isBinded) {
				var oTable = evt.getParameter("cellControl").getParent().getParent();
				var sIndex = cellControl.getParent().getIndex();
				var sIndices = oTable.getSelectedIndices();
				if (sIndices.includes(sIndex)) {
					sIndices.splice(sIndices.indexOf(sIndex), 1);
				} else {
					sIndices.push(sIndex);
				}
				if (sIndices.length > 0) {
					jQuery.unique(sIndices);
					$.each(sIndices, function (i, e) {
						oTable.addSelectionInterval(e, e);
					});
				} else {
					oTable.clearSelection();
				}

				if (sIndices.length == 1) {
					jsonModel.setProperty("/batchDetailButton", true);
				} else {
					jsonModel.setProperty("/batchDetailButton", false);
				}
			}

			//	oTable.setSelectionInterval(sIndex, sIndex);
		},
		loadCustomerData: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			this.getOwnerComponent().getModel("BP").read("/OCRD", {
				success: function (data) {
					jsonModel.setProperty("/customerList", data.results);
				}
			});
		},
		onCustSearch: function (evt) {
			var oTableSearchState = [],
				sQuery = evt.getParameter("query");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [
					new sap.ui.model.Filter("CardCode", FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("CardName", FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("Balance", FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("Currency", FilterOperator.Contains, sQuery)
				];
				var combinedFilter = new Filter({
					filters: oTableSearchState,
					and: false
				});

				evt.getSource().getParent().getParent().getBinding("items").filter([combinedFilter]);
			} else {
				evt.getSource().getParent().getParent().getBinding("items").filter([]);
			}
			//	this.getOwnerComponent().getModel("jsonModel").setProperty("/custCount", 2);
		},

		loadItems: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			this.getOwnerComponent().getModel("OITM").read("/OITM", {
				success: function (data) {
					jsonModel.setProperty("/itemsList", data.results);
				}
			});
		},
		getAppConfigData: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var filters = "?$filter=U_NAPP eq 'AllApps' or U_NAPP eq 'Manage Packages' or U_NAPP eq 'Intake'";
			this.readServiecLayer("/b1s/v2/U_NCNFG" + filters, function (data) {
				if (data.value.length > 0) {
					var configObj = {};
					$.each(data.value, function (i, e) {
						if (e.U_NFLDS === "Create Lab Sample") {
							configObj.V_CLS = e.U_NVSBL === "Y" ? true : false;
						} else if (e.U_NFLDS === "Create Transfer") {
							configObj.V_CTR = e.U_NVSBL === "Y" ? true : false;
						} else if (e.U_NFLDS === "Adjust") {
							configObj.V_ADJ = e.U_NVSBL === "Y" ? true : false;
						} else if (e.U_NFLDS === "Finish") {
							configObj.V_FIN = e.U_NVSBL === "Y" ? true : false;
						} else if (e.U_NFLDS === "Status") {
							configObj.V_STS = e.U_NVSBL === "Y" ? true : false;
						} else if (e.U_NFLDS === "METRC Status") {
							var MetrcOnOff = e.U_NVSBL === "Y" ? true : false;
							jsonModel.setProperty("/MetrcOnOff", MetrcOnOff);
						} else if (e.U_NFLDS === "Item Group Code") {
							var itemGrpCodes = e.U_NVALUE;
							jsonModel.setProperty("/itemGrpCodes", itemGrpCodes);
						} else if (e.U_NFLDS === "Item groups") {
							var itemGrpCodeIntake = e.U_NVALUE;
							itemGrpCodeIntake = JSON.parse(itemGrpCodeIntake);
							jsonModel.setProperty("/itemGrpCodeIntake", itemGrpCodeIntake);
						} else if (e.U_NFLDS === "Pricing Tier") {
							var pricingTier = e.U_NVALUE;
							pricingTier = JSON.parse(pricingTier);
							jsonModel.setProperty("/pricingTier", pricingTier);
						}

					});
					jsonModel.setProperty("/configData", configObj);
				} else {
					jsonModel.setProperty("/configData", {});
				}
			});
		},
		onItemSearch: function (evt) {
			var oTableSearchState = [],
				sQuery = evt.getParameter("query");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [
					new sap.ui.model.Filter("ItemCode", FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("ItemName", FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("OnHand", FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("ItmsGrpCod", FilterOperator.EQ, sQuery)
				];
				var combinedFilter = new Filter({
					filters: oTableSearchState,
					and: false
				});

				evt.getSource().getParent().getParent().getBinding("items").filter([combinedFilter]);
			} else {
				evt.getSource().getParent().getParent().getBinding("items").filter([]);
			}
			//	this.getOwnerComponent().getModel("jsonModel").setProperty("/custCount", 2);
		},

		clearTableFilters: function (fId, table, search) {
			//	sap.ui.core.Fragment.byId(fId, table).removeSelections();
			sap.ui.core.Fragment.byId(fId, search).setValue();
			sap.ui.core.Fragment.byId(fId, table).getBinding("items").filter([]);
		},
		loadLicenseData: function () {
			var that = this;
			var filters = [];
			filters.push(new sap.ui.model.Filter("WarehouseCode", "StartsWith", "LIC"));
			this.getOwnerComponent().getModel("Facilities").read("/OWHS", {
				filters: filters,
				success: function (data) {
					that.getOwnerComponent().getModel("jsonModel").setProperty("/licenseList", data.results);
					//that.getView().byId('license').setModel(that.getOwnerComponent().getModel("jsonModel"));
				}
			});
		},
		convertUTCDate: function (date) {
			date.setHours(new Date().getHours());
			date.setMinutes(new Date().getMinutes());
			date.setSeconds(new Date().getSeconds());
			var utc = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
			return utc;
		},
		convertUTCDatePost: function (date) {
			date.setHours(new Date().getHours());
			date.setMinutes(new Date().getMinutes());
			date.setSeconds(new Date().getSeconds());
			var utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
			return utc;
		},

		convertUTCDateTime: function (date) {
			var dateFormat = DateFormat.getDateInstance({
				pattern: 'yyyy-MM-ddThh:mm:ss',
				UTC: true
			});
			var postingDate = dateFormat.format(new Date(date), true);
			var finalDate = "/Date(" + new Date(postingDate + "Z").getTime() + ")/";
			return finalDate;
		},

		convertUTCDateTimeNew: function (date) {
			var dateFormat = DateFormat.getDateInstance({
				pattern: "yyyy-MM-ddTHH:mm:ss",
				UTC: true
			});

			var addTime = 6 * 60 * 60 * 1000;
			var date1 = new Date(date);
			var date2 = date1.getTime() - addTime;
			var date3 = dateFormat.format(new Date(date2), true);
			var finalDate = "/Date(" + new Date(date3 + "Z").getTime() + ")/";

			//var postingDate = dateFormat.format(new Date(date), true);
			//var finalDate = "/Date(" + new Date(postingDate + "Z").getTime() + ")/";
			//var finalDate =  "/Date(" + new Date(postingDate +"Z").getTime() + (6 * 60 * 60 * 1000)+ ")/";
			//var biki = riki.getTime() + (6 * 60 * 60 * 1000);
			//var raja = biki + "Z";
			//var finalDate = "/Date(" + riki + ")/";
			//var rr = new Date(postingDate + "Z").getTime()+addTime;
			//var finalDate = "/Date(" + riki + ")/";
			//new Date(biki);
			//Sun Sep 19 2021 07:07:19 GMT+0530 (India Standard Time)
			//var postingDateCST = new Date(date).addHours(6);
			//var postingDate = dateFormat.format(postingDateCST, true);
			//var postingDate = dateFormat.format(new Date(date), true);
			// var test = postingDate.split("T")[1];
			// var test1 = test.split(":")[0];
			// var datafinal = Number(test1) + 6;
			// var data = postingDate.split("T")[0];
			// var FinalpostingDate = data + "T" + datafinal + ":" + test.split(":")[1] + ":" + test.split(":")[2];
			//var finalDate = "/Date(" + new Date(postingDate + "Z").getTime() + ")/";
			return finalDate;
		},

		checkBarCodeAvailability: function (cObj, control) {
			var startChars = cObj.NBNTG.slice(0, (cObj.NBNTG.length - 15));
			var begTagLastChars = cObj.NBNTG.slice((cObj.NBNTG.length - 15), cObj.NBNTG.length);
			var endTagLastChars = cObj.NENTG.slice((cObj.NENTG.length - 15), cObj.NENTG.length);
			var orFilter = [];
			var andFilter = [];
			for (var i = Number(begTagLastChars); i <= Number(endTagLastChars); i++) {
				orFilter.push(new sap.ui.model.Filter("NTKID", "EQ", startChars + i.toString()));
			}
			andFilter.push(new sap.ui.model.Filter(orFilter, false));
			var that = this;
			control.setBusy(true);
			this.getOwnerComponent().getModel().read("/PLANNER", {
				filters: andFilter,
				success: function (data) {
					if (data.results.length > 0) {
						sap.m.MessageToast.show("Entered barcodes are already in use");
						cObj.NBNTG = "";
						cObj.NENTG = "";
						control.setBusy(false);
						return;
					}
					control.setBusy(false);
				},
				error: function (error) {
					control.setBusy(false);
				}
			});

		},
		addLeadingZeros: function (num, size) {
			num = num.toString();
			while (num.length < size) num = "0" + num;
			return num;
		},
		formatTagIDString: function (bTagValue) {
			if (bTagValue !== undefined && bTagValue) {
				var lastNos = [];
				var withChar = false;
				var strtNos = [];
				$.each(bTagValue.split("").reverse(), function (i, e) {
					if (!isNaN(e) && !withChar && i < 10) {
						lastNos.push(e);
					} else {
						withChar = true;
						strtNos.push(e);
					}
				});
				return [lastNos.reverse().join(""), strtNos.reverse().join("")];
			}
		},

		generatePlantID: function (data, noOfPlants) {
			var maxValue, returnValue;
			if (data.length > 0) {
				/*	maxValue = Math.max.apply(Math, data.map((data) => {
						returnValue = data.NPLID.replace(/^\D+/g, '');
						return returnValue;
					}));*/
			} else {
				maxValue = 0;
			}
			var plantIDs = [],
				n, s;
			for (n = maxValue + 1; n <= (noOfPlants + maxValue); n++) {
				s = n + "";
				while (s.length < 4) s = "0" + s;
				plantIDs.push("P" + s);
			}
			return plantIDs;
		},

		generateMasterPlantID: function (data, noOfPlants, strainID) {
			var maxValue, returnValue;
			if (data.length > 0) {
				var existingStrain = $.grep(data, function (e) {
					if (e.Code.search(strainID) === 0) {
						return e;
					}
				});
				if (existingStrain.length > 0) {
					maxValue = Math.max.apply(Math, existingStrain.map(function (existingStrain) {
						var plantId = existingStrain.Code.split("-")[existingStrain.Code.split("-").length - 1];
						returnValue = plantId.replace(/^\D+/g, '');
						return returnValue;
					}));
				} else {
					maxValue = 0;
				}
			} else {
				maxValue = 0;
			}
			var plantIDs = [],
				n, s;
			for (n = maxValue + 1; n <= (noOfPlants + maxValue); n++) {
				s = n + "";
				while (s.length < 4) s = "0" + s;
				plantIDs.push(strainID + "-P" + s);
				var obj = {
					NPLID: strainID + "-P" + s
				};
				data.push(obj);
			}
			return plantIDs;
		},
		generateExInputIDsID: function (data, noOfPlants) {
			var maxValue, returnValue;
			if (data.length > 0) {
				maxValue = Math.max.apply(Math, data.map(function (data) {
					var plantId = data.NITID.split("-")[data.NITID.split("-").length - 1];
					returnValue = plantId.replace(/^\D+/g, '');
					return returnValue;
				}));

			} else {
				maxValue = 0;
			}
			var plantIDs = [],
				n, s;
			for (n = maxValue + 1; n <= (noOfPlants + maxValue); n++) {
				s = n + "";
				while (s.length < 4) s = "0" + s;
				plantIDs.push(s);
				var obj = {
					NITID: s
				}
				data.push(obj);
			}
			return plantIDs;
		},

		generateCloneBatchID: function (text, strainID, data) {
			var maxValue, returnValue;
			if (data.length > 0) {
				var existingBatches = $.grep(data, function (e) {
					if (e.U_NBTID.search(strainID) > -1) {
						return e;
					}
				});
				if (existingBatches.length > 0) {
					maxValue = Math.max.apply(Math, existingBatches.map(function (existingBatches) {
						var bId = existingBatches.U_NBTID.split("-")[existingBatches.U_NBTID.split("-").length - 1];
						returnValue = bId.replace(/^\D+/g, '');
						return returnValue;
					}));
				} else {
					maxValue = 0;
				}
			} else {
				maxValue = 0;
			}
			var n, s, id;
			for (n = maxValue; n <= (maxValue + 1); n++) {
				s = n + "";
				while (s.length < 3) s = "0" + s;
				id = text + "-" + strainID + "-B" + s;
			}
			return id;
		},
		generateLotIDs: function (productId, data) {

			var id = productId + "-QA" + (data.length + 1);

			return id;
		},
		generateLabSampleIDs: function (batchId, data, qty) {
			var maxValue = 0;
			var n, s, id;
			var lotIDs = [],
				n, s;
			for (n = maxValue + 1; n <= (qty + maxValue); n++) {
				s = n + "";
				while (s.length < 2) s = "0" + s;
				lotIDs.push(batchId + "-SA" + s);
				var obj = {
					NPLID: batchId + "-SA" + s
				};
				data.push(obj);
			}
			return lotIDs;
		},

		generateHarvestBatchID: function (text, strainID, data) { //changes to existingBatches from data by susmita
			var maxValue, returnValue;
			if (data.length > 0) {
				var existingBatches = $.grep(data, function (e) {
					if (e.NHBID.search(strainID) > -1) {
						return e;
					}
				});
				if (existingBatches.length > 0) {
					maxValue = Math.max.apply(Math, existingBatches.map((existingBatches) => {
						var bId = existingBatches.NHBID.split("-")[existingBatches.NHBID.split("-").length - 1];
						returnValue = bId.replace(/^\D+/g, '');
						return returnValue;
					}));
				} else {
					maxValue = 0;
				}
			} else {
				maxValue = 0;
			}
			var n, s, id;
			for (n = maxValue; n <= (maxValue + 1); n++) {
				s = n + "";
				while (s.length < 3) s = "0" + s;
				id = text + "-" + strainID + "-B" + s;
			}
			return id;
		},
		errorHandler: function (error) {
			var resText = JSON.parse(error.responseText).error.message;
			MessageBox.error(resText);
			that.getView().setBusy(false);
		},
		successHandler: function (text, resText) {
			MessageBox.success(text + resText + " created successfully", {
				closeOnNavigation: false,
				onClose: function () {}
			});
		},

		createFilter: function (key, operator, value, useToLower) {
			return new Filter(useToLower ? "tolower(" + key + ")" : key, operator, useToLower ? "'" + value.toLowerCase() + "'" : value);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Handler for the Avatar button press event
		 * @public
		 */
		onAvatarPress: function () {
			var sMessage = this.getResourceBundle().getText("avatarButtonMessageToastText");
			sap.m.MessageToast.show(sMessage);
		},

		/**
		 * React to FlexibleColumnLayout resize events
		 * Hides navigation buttons and switches the layout as needed
		 * @param {sap.ui.base.Event} oEvent the change event
		 */
		onStateChange: function (oEvent) {
			var sLayout = oEvent.getParameter("layout"),
				iColumns = oEvent.getParameter("maxColumnsCount");

			if (iColumns === 1) {
				this.getModel("appView").setProperty("/smallScreenMode", true);
			} else {
				this.getModel("appView").setProperty("/smallScreenMode", false);
				// swich back to two column mode when device orientation is changed
				if (sLayout === "OneColumn") {
					this._setLayout("Two");
				}
			}
		},

		/**
		 * Sets the flexible column layout to one, two, or three columns for the different scenarios across the app
		 * @param {string} sColumns the target amount of columns
		 * @private
		 */
		_setLayout: function (sColumns) {
			if (sColumns) {
				this.getModel("appView").setProperty("/layout", sColumns + "Column" + (sColumns === "One" ? "" : "sMidExpanded"));
			}
		},

		/**
		 * Apparently, the middle page stays hidden on phone devices when it is navigated to a second time
		 * @private
		 */
		_unhideMiddlePage: function () {
			// bug in sap.f router, open ticket and remove this method afterwards
			setTimeout(function () {
				this.getView().getParent().getParent().getCurrentMidColumnPage().removeStyleClass("sapMNavItemHidden");
			}.bind(this), 0);
		},

		onChangeMultiInput: function (oEvent) {
			oEvent.getSource()._bUseDialog = false;
			var value = oEvent.getSource().getValue();
			if (value.indexOf("^") !== -1) {
				value = value.replace(/\^/g, "");
				oEvent.getSource().addToken(new sap.m.Token({
					key: value,
					text: value
				}));
				//	var orFilter = [];
				//	var andFilter = [];
				oEvent.getSource().setValue("");
				this.fillFilterLoad(oEvent.getSource());
			}
		},

		/*Methods for multiInput for sarch field for scan functionality start*/

		onSubmitMultiInput: function (oEvent) {
			oEvent.getSource()._bUseDialog = false;
			var value = oEvent.getSource().getValue();
			if (!value) {
				this.fillFilterLoad(oEvent.getSource());
				return;
			}
			value = value.replace(/\^/g, "");
			oEvent.getSource().addToken(new sap.m.Token({
				key: value,
				text: value
			}));
			// var orFilter = [];
			// var andFilter = [];
			oEvent.getSource().setValue("");
			this.fillFilterLoad(oEvent.getSource());
		},

		tokenUpdateMultiInput: function (oEvent) {
			this.fillFilterLoad(oEvent.getSource(), oEvent.getParameter("removedTokens")[0].getText());
		},
		readServiecLayer: function (entity, callBack, busyDialog) {
			var that = this;
			var jsonModel = that.getOwnerComponent().getModel("jsonModel");
			if (location.host.includes("webide") == true) {
				var sessionID = jsonModel.getProperty("/sessionID");
				if (sessionID === undefined) {
					var loginPayLoad = jsonModel.getProperty("/userAuthPayload");
					loginPayLoad = JSON.stringify(loginPayLoad);
					if (busyDialog) {
						busyDialog.setBusy(true);
					}
					$.ajax({
						url: jsonModel.getProperty("/serLayerbaseUrl") + "/b1s/v2/Login",
						data: loginPayLoad,
						type: "POST",
						xhrFields: {
							withCredentials: true
						},
						dataType: "json", // expecting json response
						success: function (data) {
							jsonModel.setProperty("/sessionID", data.SessionId);
							//	var sessionID = that.getOwnerComponent().getModel("jsonModel").getProperty("/sessionID");
							$.ajax({
								type: "GET",
								xhrFields: {
									withCredentials: true
								},
								url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
								setCookies: "B1SESSION=" + data.SessionId,
								dataType: "json",
								success: function (res) {
									if (busyDialog) {
										busyDialog.setBusy(false);
									}
									callBack.call(that, res);
								},
								error: function (error) {
									if (busyDialog) {
										busyDialog.setBusy(false);
									}
									MessageBox.error(error.responseJSON.error.message);
								}
							});
						},
						error: function () {
							sap.m.MessageToast.show("Error with authentication");
						}
					});
				} else {
					if (busyDialog) {
						busyDialog.setBusy(true);
					}
					$.ajax({
						type: "GET",
						xhrFields: {
							withCredentials: true
						},
						url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
						setCookies: "B1SESSION=" + sessionID,
						dataType: "json",
						success: function (res) {
							if (busyDialog) {
								busyDialog.setBusy(false);
							}
							callBack.call(that, res);
						},
						error: function (error) {
							if (busyDialog) {
								busyDialog.setBusy(false);
							}
							MessageBox.error(error.responseJSON.error.message);
						}
					});
				}
			} else {
				if (busyDialog) {
					busyDialog.setBusy(true);
				}
				$.ajax({
					type: "GET",
					xhrFields: {
						withCredentials: true
					},
					url: entity,
					//	setCookies: "B1SESSION=" + sessionID,
					dataType: "json",
					success: function (res) {
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
						callBack.call(that, res);
					},
					error: function (error) {
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
						MessageBox.error(error.responseJSON.error.message);
					}
				});
			}
		},

		updateServiecLayer: function (entity, callBack, payLoad, method, busyDialog) {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			payLoad = JSON.stringify(payLoad);
			if (busyDialog) {
				busyDialog.setBusy(true);
			}
			var sUrl;
			if (location.host.includes("webide") == true) {
				sUrl = jsonModel.getProperty("/serLayerbaseUrl") + entity;
			} else {
				sUrl = entity;
			}
			$.ajax({
				type: method,
				xhrFields: {
					withCredentials: true
				},
				url: sUrl,
				//	setCookies: "B1SESSION=" + sessionID,
				dataType: "json",
				data: payLoad,
				success: function (res) {
					if (busyDialog) {
						busyDialog.setBusy(false);
					}
					callBack.call(that, res);
				},
				error: function (error) {
					if (busyDialog) {
						busyDialog.setBusy(false);
					}
					MessageBox.error(error.responseJSON.error.message);
				}
			});
		},
		updateServiceLayerBatch: function (entity, callBack, payLoad, method) {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sessionID = jsonModel.getProperty("/sessionID");
			if (sessionID === undefined) {
				var loginPayLoad = jsonModel.getProperty("/userAuthPayload");
				loginPayLoad = JSON.stringify(loginPayLoad);
				$.ajax({
					url: jsonModel.getProperty("/serLayerbaseUrl") + "/b1s/v2/Login",
					data: loginPayLoad,
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					dataType: "json", // expecting json response
					success: function (data) {
						jsonModel.setProperty("/sessionID", data.SessionId);
						payLoad = JSON.stringify(payLoad);
						$.ajax({
							type: method,
							xhrFields: {
								withCredentials: true
							},
							url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
							setCookies: "B1SESSION=" + data.SessionId,
							dataType: "json",
							data: payLoad,
							success: function (res) {
								callBack.call(that, res);
							},
							error: function (error) {
								callBack.call(that, error);
							}
						});
					},
					error: function () {
						sap.m.MessageToast.show("Error with authentication");
					}
				});
			} else {
				payLoad = JSON.stringify(payLoad);
				$.ajax({
					type: method,
					xhrFields: {
						withCredentials: true
					},
					url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
					setCookies: "B1SESSION=" + sessionID,
					dataType: "json",
					data: payLoad,
					success: function (res) {
						callBack.call(that, res);
					},
					error: function (error) {
						callBack.call(that, error);
					}
				});
			}
		},

		createBatchCall: function (batchUrl, callBack, busyDialog) {
			var jsonModel = this.getView().getModel("jsonModel");
			var splitBatch, count;
			count = Math.ceil(batchUrl.length / 100);
			jsonModel.setProperty("/count", count);
			if (batchUrl.length > 100) {
				do {
					splitBatch = batchUrl.splice(0, 100);
					this.callBatchService(splitBatch, callBack, busyDialog);
				} while (batchUrl.length > 100);
				if (batchUrl.length > 0) {
					this.callBatchService(batchUrl, callBack, busyDialog);
				}
			} else {
				this.callBatchService(batchUrl, callBack, busyDialog);
			}

			//	callBack.call(this, errorMessage);
		},
		callBatchService: function (batchUrl, callBack, busyDialog) {
			var reqHeader = "--clone_batch--\r\nContent-Type: application/http \r\nContent-Transfer-Encoding:binary\r\n\r\n";
			var payLoad = reqHeader;
			$.each(batchUrl, function (i, sObj) {
				payLoad = payLoad + sObj.method + " " + sObj.url + "\r\n\r\n";
				payLoad = payLoad + JSON.stringify(sObj.data) + "\r\n\r\n";
				if (batchUrl.length - 1 === i) {
					payLoad = payLoad + "\r\n--clone_batch--";
				} else {
					payLoad = payLoad + reqHeader;
				}
			});
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var baseUrl = jsonModel.getProperty("/serLayerbaseUrl");
			//	var sessionID = jsonModel.getProperty("/sessionID");
			if (busyDialog) {
				busyDialog.setBusy(true);
			}
			if (location.host.indexOf("webide") === -1) {
				baseUrl = "";
			}
			var settings = {
				"url": baseUrl + "/b1s/v2/$batch",
				"method": "POST",
				xhrFields: {
					withCredentials: true
				},
				//"timeout": 0,
				"headers": {
					"Content-Type": "multipart/mixed;boundary=clone_batch"
				},
				//	setCookies: "B1SESSION=" + sessionID,
				"data": payLoad,
				success: function (res) {
					var count = jsonModel.getProperty("/count");
					count--;
					jsonModel.setProperty("/count", count);
					try {
						var errorMessage = "";
						res.split("\r").forEach(function (sString) {
							if (sString.indexOf("error") !== -1) {
								var oString = JSON.parse(sString.replace(/\n/g, ""));
								errorMessage = oString.error.message;
							}
						});
					} catch (err) {
						//	console.log("error " + err);
					}
					//	callBack.call(that, res, errorMessage);
					if (errorMessage) {
						var errorTxt = jsonModel.getProperty("/errorTxt");
						errorTxt.push(errorMessage);
						jsonModel.setProperty("/errorTxt", errorTxt);
					}
					if (count === 0) {
						callBack.call(that, errorMessage);
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
					}
				},
				error: function (error) {
					var count = jsonModel.getProperty("/count");
					count--;
					jsonModel.setProperty("/count", count);
					if (count === 0) {
						callBack.call(that);
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
					}
					if (error.statusText) {
						MessageBox.error(error.statusText);
					} else if (error.responseJSON) {
						MessageBox.error(error.responseJSON.error.message);
					}

				}
			};

			//	const text = '{"name":"John\n", "birth":"14/12/1989\t"}';
			//	const result = text.escapeSpecialCharsInJSONString();
			//	console.log(result);
			$.ajax(settings).done(function () {
				//	console.log(response);
			});
		},

		loadPackageData: function () {
			var data;
			if (this.getOwnerComponent().getModel("jsonModel").getData().licenseList1 == undefined) {
				data = this.getOwnerComponent().getModel("jsonModel").getData().licenseList[0];
			} else {
				data = this.getOwnerComponent().getModel("jsonModel").getData().licenseList1[0];
			}
			var licenseNo = data.U_License_Number;
			var that = this;
			var filters = [];
			//filters.push(new sap.ui.model.Filter("U_License_Number", "EQ", licenseNo)); //code for facility
			filters.push(new sap.ui.model.Filter("WarehouseCode", "NotContains", "LIC")); //code for not displaying LIC
			this.getOwnerComponent().getModel("Facilities").read("/OWHS", {
				filters: filters,
				success: function (res) {
					that.getOwnerComponent().getModel("jsonModel").setProperty("/plannerLicenseList", res.results);
				}
			});
		},

		removeDuplicates: function (data, key) {
			var newArray = [];
			var obj = {};
			for (var i in data) {
				obj[data[i][key]] = data[i];
			}
			for (i in obj) {
				newArray.push(obj[i]);
			}
			return newArray;
		},
		onDateSelect: function (evt) {
			var sDate = evt.getParameter("value");
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");

			// sap.ui.core.Fragment.byId("createTransferDialog", "wRecDate").setValue(newdateT);
			jsonModel.setProperty("/createTras/deliveryDate", new Date(sDate));

		},

		// checkForMantatoryFields: function (sObj) {
		// 	var mandText, mandFlag = false;
		// 	if (sObj.temName === "") {
		// 		mandText = "Please enter template name";
		// 		mandFlag = true;
		// 	} else if (sObj.deliveryDate === "") {
		// 		mandText = "Please select delivery date";
		// 		mandFlag = true;
		// 	} else if (sObj.customer === "") {
		// 		mandText = "Please enter customer name";
		// 		mandFlag = true;
		// 	} else if (sObj.driverDetail === "") {
		// 		mandText = "Please select driver name";
		// 		mandFlag = true;
		// 	} else if (sObj.vehicleDetail === "") {
		// 		mandText = "Please select vehicle name";
		// 		mandFlag = true;
		// 	}
		// 	return [mandFlag, mandText];
		// },

		getMetricsCredentials: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var filters = "?$filter=U_NITTP eq 'METRC'";
			jsonModel.setProperty("/metrcBusy", true);
			jsonModel.setProperty("/enableSyncNow", false);
			this.readServiecLayer("/b1s/v2/NINGT" + filters, function (data) {
				jsonModel.setProperty("/metrcBusy", false);
				if (data.value.length > 0) {
					jsonModel.setProperty("/metrcData", data.value[0]);
					if (data.value[0].U_NACST === "X") {
						jsonModel.setProperty("/METRCText", "Metrc Sync is ON");
						jsonModel.setProperty("/METRCColorCode", 7);
						that.getCurrentFacilties();
					} else {
						jsonModel.setProperty("/METRCText", "Metrc Sync is OFF");
						jsonModel.setProperty("/METRCColorCode", 3);
						jsonModel.setProperty("/METRCKey", "METRC Key Invalid");
						jsonModel.setProperty("/METRCColorKey", 3);
						that.loadLicenseData();
					}
				} else {
					jsonModel.setProperty("/metrcData", {});
					jsonModel.setProperty("/METRCText", "Metrc Sync is OFF");
					jsonModel.setProperty("/METRCColorCode", 3);
					jsonModel.setProperty("/METRCKey", "METRC Key Invalid");
					jsonModel.setProperty("/METRCColorKey", 3);
					that.loadLicenseData();
				}
			});
		},
		// callMetricsService: function (entity, methodType, data, success, error) {
		// 	var that = this;
		// 	var metricConfig = this.getView().getModel("jsonModel").getProperty("/metrcData");
		// 	var apiKey = this.getView().getModel("jsonModel").getProperty("/apiKey");
		// 	$.ajax({
		// 		data: JSON.stringify(data),
		// 		type: methodType,
		// 		async: false,
		// 		url: metricConfig.U_NIURL + entity,
		// 		contentType: "application/json",
		// 		headers: {
		// 			"Authorization": "Basic " + btoa(metricConfig.U_NVNDK + ":" + apiKey)
		// 		},
		// 		success: function (sRes) {
		// 			that.createMetricLog(entity, methodType, data, sRes, "200");
		// 			success.call(that, sRes);
		// 		},
		// 		error: function (eRes) {
		// 			var errorMsg = "";
		// 			if (eRes.responseJSON && eRes.responseJSON.length > 0) {
		// 				$.each(eRes.responseJSON, function (i, e) {
		// 					errorMsg = e.message + "\n";
		// 				});
		// 			} else if (eRes.responseJSON && eRes.responseJSON.Message) {
		// 				errorMsg = eRes.responseJSON.Message;
		// 			} else if (eRes.statusText && eRes.status === 401) {
		// 				errorMsg = "Unauthorized";
		// 			} else if (eRes.statusText) {
		// 				errorMsg = eRes.statusText;
		// 			}
		// 			error.call(that, errorMsg);
		// 			that.createMetricLog(entity, methodType, data, errorMsg, eRes.status);
		// 			sap.m.MessageToast.show(errorMsg);
		// 		}
		// 	});
		// },
		callMetricsService: function (entity, methodType, data, success, error) {
			var that = this;
			// var obj = this.getView().getModel("jsonModel").getProperty("/selectedMetrics");
			var metricConfig = this.getView().getModel("jsonModel").getProperty("/metrcData");
			var apiKey = this.getView().getModel("jsonModel").getProperty("/apiKey");
			$.ajax({
				data: JSON.stringify(data),
				type: methodType,
				async: false,
				url: metricConfig.U_NIURL + entity,
				contentType: "application/json",
				headers: {
					"Authorization": "Basic " + btoa(metricConfig.U_NVNDK + ":" + apiKey)
				},
				success: function (sRes) {
					that.createMetricLog(entity, methodType, data, sRes, "200");
					success.call(that, sRes);
				},
				error: function (eRes) {
					var errorMsg = "";
					if (eRes.responseJSON && eRes.responseJSON.length > 0) {
						$.each(eRes.responseJSON, function (i, e) {
							errorMsg = errorMsg + e.message + "\n";
							that.popUpData(e.message, "E");
						});
					} else if (eRes.responseJSON && eRes.responseJSON.Message) {
						errorMsg = eRes.responseJSON.Message;
						that.popUpData(errorMsg, "E");
					} else if (eRes.statusText && eRes.status === 401) {
						errorMsg = "Unauthorized";
						that.popUpData(errorMsg, "E");
					} else if (eRes.statusText) {
						errorMsg = eRes.statusText;
						that.popUpData(errorMsg, "E");
					}
					error.call(that, errorMsg);
					that.createMetricLog(entity, methodType, data, errorMsg, eRes.status);
					sap.m.MessageToast.show(errorMsg);
				}
			});
		},
		callMetricsGETService: function (entity, success, error) {
			var that = this;
			// var obj = this.getView().getModel("jsonModel").getProperty("/selectedMetrics");
			var metricConfig = this.getView().getModel("jsonModel").getProperty("/metrcData");
			var apiKey = this.getView().getModel("jsonModel").getProperty("/apiKey");
			$.ajax({
				type: "GET",
				async: false,
				url: metricConfig.U_NIURL + entity,
				contentType: "application/json",
				headers: {
					"Authorization": "Basic " + btoa(metricConfig.U_NVNDK + ":" + apiKey)
				},
				success: function (sRes) {
					success.call(that, sRes);
				},
				error: function (eRes) {
					var errorMsg = "";
					if (eRes.responseJSON && eRes.responseJSON.length > 0) {
						$.each(eRes.responseJSON, function (i, e) {
							errorMsg = errorMsg + e.message + "\n";
							that.popUpData(e.message, "E");
						});
					} else if (eRes.responseJSON && eRes.responseJSON.Message) {
						errorMsg = eRes.responseJSON.Message;
						that.popUpData(errorMsg, "E");
					} else if (eRes.statusText && eRes.status === 401) {
						errorMsg = "Unauthorized";
						that.popUpData(errorMsg, "E");
					} else if (eRes.statusText) {
						errorMsg = eRes.statusText;
						that.popUpData(errorMsg, "E");
					}

					error.call(that, errorMsg);
					sap.m.MessageToast.show(errorMsg);
				}
			});
		},

		// getCurrentFacilties: function () {
		// 	var that = this;
		// 	var jsonModel = this.getOwnerComponent().getModel("jsonModel");
		// 	this.readServiecLayer("/b1s/v2/UsersService_GetCurrentUser", function (data) {
		// 		var metrcData = jsonModel.getProperty("/metrcData");
		// 		jsonModel.setProperty("/apiKey", data.U_APIKey);
		// 		if (metrcData !== undefined && !jQuery.isEmptyObject(metrcData)) {
		// 			$.ajax({
		// 				type: "GET",
		// 				async: false,
		// 				url: metrcData.U_NIURL + "/facilities/v2",
		// 				contentType: "application/json",
		// 				headers: {
		// 					"Authorization": "Basic " + btoa(metrcData.U_NVNDK + ":" + data.U_APIKey)
		// 				},
		// 				success: function (facilities) {
		// 					jsonModel.setProperty("/METRCKey", "METRC Key Valid");
		// 					jsonModel.setProperty("/METRCColorKey", 7);
		// 				},
		// 				error: function () {
		// 					jsonModel.setProperty("/METRCKey", "METRC Key Invalid");
		// 					jsonModel.setProperty("/METRCColorKey", 3);
		// 				}
		// 			});
		// 		}
		// 	});
		// },

		getCurrentFacilties: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			this.readServiecLayer("/b1s/v2/UsersService_GetCurrentUser", function (data) {
				var metrcData = jsonModel.getProperty("/metrcData");
				jsonModel.setProperty("/apiKey", data.U_APIKey);
				var userAccessLicense = JSON.parse(data.U_License);
				if (userAccessLicense != null) {
					jsonModel.setProperty("/userAccessLicense", userAccessLicense);
				}
				that.loadLicenseData();
				if (metrcData !== undefined && !jQuery.isEmptyObject(metrcData)) {
					$.ajax({
						type: "GET",
						async: false,
						url: metrcData.U_NIURL + "/facilities/v2",
						contentType: "application/json",
						headers: {
							"Authorization": "Basic " + btoa(metrcData.U_NVNDK + ":" + data.U_APIKey)
						},
						success: function (facilities) {
							jsonModel.setProperty("/METRCKey", "METRC Key Valid");
							jsonModel.setProperty("/METRCColorKey", 7);
						},
						error: function () {
							jsonModel.setProperty("/METRCKey", "METRC Key Invalid");
							jsonModel.setProperty("/METRCColorKey", 3);
						}
					});
				}
			});

		},
		// capture metric log
		createMetricLog: function (sUrl, method, reqPayload, resPayload, statusCode) {
			var data = {
				U_NDTTM: this.convertUTCDate(new Date()),
				U_NUSID: this.getView().getModel("jsonModel").getProperty("/userName"),
				U_NLGMT: method,
				U_NLURL: sUrl,
				U_NLGBD: JSON.stringify(reqPayload),
				U_NLGRP: JSON.stringify(resPayload),
				U_NLGST: statusCode,
				U_NAPP: "MP"
			};
			this.updateServiecLayer("/b1s/v2/NMTLG", function () {

			}.bind(this), data, "POST");
		},
		getLabStatus: function (tag) {
			//var localModel = this.getModel("localModel");
			if (tag) {
				var metricConfig = this.getView().getModel("jsonModel").getProperty("/metrcData");
				var license = this.getView().getModel("jsonModel").getProperty("/selectedLicense");
				return new Promise(
					function (resolve, reject) {
						var entity = "/packages/v1/" + tag + "?licenseNumber=" + license;
						//console.log(url);
						$.ajax({
							type: "GET",
							async: false,
							url: metricConfig.U_NIURL + entity,
							contentType: "application/json",
							headers: {
								"Authorization": "Basic " + btoa(metricConfig.U_NVNDK + ":" + metricConfig.U_NUSRK)
							},
							success: function (sRes) {
								resolve(sRes);
							},
							error: function (eRes) {
								//	error.bind(this);
								var errorMsg = "";
								/*if (eRes.statusText) {
									errorMsg = eRes.statusText;
								} else*/
								if (eRes.responseJSON && eRes.responseJSON.length > 0) {
									$.each(eRes.responseJSON, function (i, e) {
										errorMsg = e.message + "\n";
									});
								} else if (eRes.responseJSON && eRes.responseJSON.Message) {
									errorMsg = eRes.responseJSON.Message;
								} else if (eRes.statusText && eRes.status === 401) {
									errorMsg = "Unauthorized";
								} else if (eRes.statusText) {
									errorMsg = "Network Error";
								}
								reject(errorMsg);
							}
						});
					}).then(
					function (value) {
						return value;
					},
					function (error) {
						return error;
					}
				);
			}
		},
		convertUTCDateMETRC: function (date) {
			var inputDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "MMM-dd-yyyy hh:mm a",
				UTC: false
			});
			var parsedDate = inputDateFormat.parse(date);

			var outputDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd'T'HH:mm:ss'Z'",
				UTC: false
			});
			return outputDateFormat.format(parsedDate);
		},

		checkForDuplicates: function (arr) {
			return arr.some(function (item) {
				return arr.indexOf(item) !== arr.lastIndexOf(item);
			});
		},

		createPkgForTransfer: function (sObj, that) {
			var jsonModel = that.getOwnerComponent().getModel("jsonModel");
			//	var createPackageData = jsonModel.getProperty("/createPackageData");
			var ChangeLocationList = jsonModel.getProperty("/harvestLocData");
			var cDate = that.convertUTCDate(new Date());
			var metrcData = jsonModel.getProperty("/metrcData");
			var locationID = sObj.WarehouseCode;
			var rObj2 = $.grep(sObj.pkgData, function (pObj) {
				if (sObj.PACKAGE == pObj.METRCUID) {
					return pObj;
				}
			});
			var sPkg = "";
			if (rObj2.length > 0) {
				sPkg = rObj2[0].METRCUID;
			}

			if (metrcData && metrcData.U_NACST === "X") {
				var metricPayload = [{
					Tag: sObj.NEWPKG,
					Location: sObj.sourcePkgData.U_MetrcLocation, //sObj.U_MetrcLocation,
					Item: sObj.ItemDescription, //sObj.ItemName,
					Quantity: Number(sObj.RemainingOpenQuantity),
					//	UnitOfMeasure: sObj.UoMCode,
					UnitOfMeasure: "Pounds",
					// PatientLicenseNumber: null,
					Note: "Created due to transfer template",
					// IsProductionBatch: false,
					// IsDonation: false,
					// ProductRequiresRemediation: false,
					// UseSameItem: false,
					ActualDate: that.getSystemDate(),
					Ingredients: [{
						Package: sPkg,
						Quantity: Number(sObj.RemainingOpenQuantity),
						UnitOfMeasure: "Pounds",
					}]
				}];
				var metrcUrl = "/packages/v2/?licenseNumber=" + jsonModel.getProperty("/selectedLicense");
				that.transTemDialog.setBusy(true);
				that.callMetricsService(metrcUrl, "POST", metricPayload, function () {
					that.newPkgForTranferB1Calls(sObj, that);
				}, function (error) {
					sap.m.MessageToast.show(JSON.stringify(error));
					that.transTemDialog.setBusy(false);
				});
			} else {
				that.newPkgForTranferB1Calls(sObj, that);
			}
		},
		newPkgForTranferB1Calls: function (sObj, that) {
			var jsonModel = that.getOwnerComponent().getModel("jsonModel");
			var ChangeLocationList = jsonModel.getProperty("/harvestLocData");
			var cDate = that.convertUTCDate(new Date());
			var totalWt = 0;
			var qty = 0;
			var payLoadInventoryEntry = {};
			var payLoadInventoryExit = {};
			var locationID = sObj.WarehouseCode,
				AbslocationEntry = "",
				AbslocationExit = "";
			qty = Number(sObj.NQNTY);
			totalWt = Number(sObj.Quantity) - qty;
			var BatchNumber = sObj.NTRID;
			var BatchNumberForExit = sObj.U_NTKID;
			var quantity = Number(sObj.NQNTY).toFixed(2);

			$.each(ChangeLocationList, function (i, obj) {
				if (sObj.sourcePkgData.U_MetrcLocation == obj.U_MetrcLocation) {
					AbslocationEntry = obj.AbsEntry;
				}
			});

			payLoadInventoryEntry = {
				"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
				"Comments": "Manage Packages - Transfer Template - New Packages",
				"DocumentLines": []
			};
			payLoadInventoryEntry.DocumentLines.push({
				"ItemCode": sObj.ItemCode, //sObj.ItemCode,
				// "ItmGrpCode": 100,
				"WarehouseCode": sObj.WarehouseCode,
				"Quantity": Number(sObj.RemainingOpenQuantity),
				"UnitPrice": sObj.UnitPrice,
				"BatchNumbers": [{
					"BatchNumber": sObj.NEWPKG, // <THIS IS TAG>
					"Quantity": Number(sObj.RemainingOpenQuantity), //<THIS IS THE QTY OF CLONES>
					//	"ManufacturerSerialNumber": sObj.HarvestName,
					"U_BatAttr3": sObj.sourcePkgData.METRCUID,
					"U_IsPackage": "YES",
					"U_Phase": "Package",
					"U_Bottoms": sObj.sourcePkgData.U_Bottoms,
					"U_Bugs": sObj.sourcePkgData.U_Bugs,
					"U_Burned": sObj.sourcePkgData.U_Burned,
					"U_CD": sObj.sourcePkgData.U_CD,
					"U_Cart": sObj.sourcePkgData.U_Cart,
					"U_Glass": sObj.sourcePkgData.U_Glass,
					"U_MetrcLicense": sObj.sourcePkgData.U_MetrcLicense,
					"U_MetrcLocation": sObj.sourcePkgData.U_MetrcLocation,
					"U_PM": sObj.sourcePkgData.U_PM,
					"U_Price": sObj.sourcePkgData.U_Price,
					"U_SalesRep": sObj.sourcePkgData.U_SalesRep,
					"U_SeedBana": sObj.sourcePkgData.U_SeedBana,
					"U_Yellowhead": sObj.sourcePkgData.U_Yellowhead,
					"U_SalesNote":sObj.sourcePkgData.U_SalesNote
				}],
				"DocumentLinesBinAllocations": [{
					"BinAbsEntry": Number(AbslocationEntry),
					"Quantity": Number(sObj.RemainingOpenQuantity),
					"SerialAndBatchNumbersBaseLine": 0
				}]
			});

			payLoadInventoryExit = {
				"BPL_IDAssignedToInvoice": jsonModel.getProperty("/sLinObj").U_Branch,
				"Comments": "Manage Packages - New Packages",
				"DocumentLines": []
			};
			payLoadInventoryExit.DocumentLines.push({
				//"ItemCode": sObj.NPDNMCode,
				"ItemCode": sObj.ItemCode, //changed by susmita
				// "ItmGrpCode": 100,
				"WarehouseCode": sObj.WarehouseCode,
				"Quantity": Number(sObj.RemainingOpenQuantity),
				"BatchNumbers": [{
					"BatchNumber": sObj.sourcePkgData.METRCUID, // <THIS IS TAG>
					"Quantity": Number(sObj.RemainingOpenQuantity), //<THIS IS THE QTY OF CLONES>
					"Location": sObj.sourcePkgData.U_MetrcLocation,
				}],
				"DocumentLinesBinAllocations": [{
					"BinAbsEntry": Number(AbslocationEntry),
					"Quantity": Number(sObj.RemainingOpenQuantity),
					"SerialAndBatchNumbersBaseLine": 0
				}]
			});
			var batchUrl = [];
			batchUrl.push({
				url: "/b1s/v2/InventoryGenEntries",
				data: payLoadInventoryEntry,
				method: "POST"
			});
			batchUrl.push({
				url: "/b1s/v2/InventoryGenExits",
				data: payLoadInventoryExit,
				method: "POST"
			});
			jsonModel.setProperty("/errorTxt", []);
			return new Promise(
				function (resolve, reject) {
					that.createBatchCall(batchUrl, function (res) {
						resolve(res);
					});

				}).then(
				function (value) {
					return value;
				},
				function (error) {
					return error;
				}
			);
		},

		hanldeMessageDialog: function (evt) {
			var that = this;
			var oMessageTemplate = new sap.m.MessageItem({
				type: '{type}',
				title: '{title}',
				description: '{description}'
			});
			this.oMessageView = new sap.m.MessageView({
				showDetailsPageHeader: true,
				itemSelect: function () {},
				items: {
					path: "/responseData",
					template: oMessageTemplate
				}
			});
			var resModel = new sap.ui.model.json.JSONModel();
			resModel.setProperty("/responseData", []);
			this.resModel = resModel;
			var oCloseButton = new sap.m.Button({
					text: "Close",
					press: function () {
						that._oPopover.close();
					}
				}).addStyleClass("sapUiTinyMarginEnd"),
				clearButton = new sap.m.Button({
					text: "Clear",
					press: function () {
						that.resModel.setProperty("/responseData", []);
					}
				}),
				oPopoverFooter = new sap.m.Bar({
					contentRight: [clearButton, oCloseButton]
				}),
				oPopoverBar = new sap.m.Bar({
					//	contentLeft: [oBackButton],
					contentMiddle: [
						new sap.m.Title({
							text: "Messages"
						})
					]
				});
			this._oPopover = new sap.m.Popover({
				customHeader: oPopoverBar,
				contentWidth: "440px",
				contentHeight: "440px",
				verticalScrolling: false,
				modal: true,
				content: [this.oMessageView],
				footer: oPopoverFooter
			});
			this._oPopover.setModel(resModel);
		},
		handleOpenPopOver: function (evt) {
			this._oPopover.openBy(evt.getSource());
		},
		popUpData: function (title, type) {
			var sObj = {
				type: type === "E" ? "Error" : "Success",
				title: title
			};
			var responseData = this.resModel.getProperty("/responseData");
			responseData.push(sObj);
			this.resModel.setProperty("/responseData", responseData);
			this._oPopover.setModel(this.resModel);
			var resPop = this.getView().byId("resPop");
			this.oMessageView.navigateBack();
			resPop.firePress();
		}

	});
});