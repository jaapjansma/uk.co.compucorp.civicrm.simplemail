!function(){"use strict";var e=angular.module("simpleMail.adminApp",["ngRoute","ngAnimate","ui.select","simpleMail.adminApp.controllers","simpleMail.services","simpleMail.directives","simpleMail.constants","simpleMail.filters","angularFileUpload"]);e.config(["$routeProvider","paths",function(e,l){e.when("/headers",{templateUrl:l.PARTIALS_DIR()+"/admin/listHeaders.html",controller:"HeadersAdminController"}).when("/headers/:headerId/edit",{templateUrl:l.PARTIALS_DIR()+"/admin/editHeader.html",controller:"HeaderAdminController"}).when("/headers/new",{templateUrl:l.PARTIALS_DIR()+"/admin/editHeader.html",controller:"HeaderAdminController"}).when("/messages",{templateUrl:l.PARTIALS_DIR()+"/admin/listMessages.html",controller:"MessagesAdminController"}).otherwise({redirectTo:"/"})}])}();
!function(){"use strict";var e=angular.module("simpleMail.adminApp.controllers",[]);e.config(["$httpProvider",function(e){e.defaults.headers.common["X-Requested-With"]="XMLHttpRequest"}]),e.controller("HeadersAdminController",["$scope","$http","$q","CiviApiFactory","loggingServices","NotificationFactory",function(e,r,t,a,n,o){e.constants={ENTITY_NAME:"SimpleMailHeader"},e.headers={},a.get(e.constants.ENTITY_NAME).then(function(r){return r.data.is_error?t.reject(r):(e.headers=r.data.values,n.createLog("Headers received",e.headers),!0)}).catch(function(e){n.createLog("Failed to retrieve headers",e)}),e.deleteHeader=function(r){var i=e.headers[r];a.remove(e.constants.ENTITY_NAME,i).then(function(e){return n.createLog("Delete message response",e),e.data.is_error?t.reject(e):!0}).then(function(){e.headers.splice(r,1),o.success("Header deleted")}).catch(function(r){o.error("Failed to delete header",r.data.error_message),e.errorMessage=r.data.error_message})}}]),e.controller("HeaderAdminController",["$scope","$http","$q","$fileUploader","CiviApiFactory","loggingServices","NotificationFactory","$routeParams","$location","$filter",function(e,r,t,a,n,o,i,s,d,c){e.header={},e.models={},e.filters=[],e.constants={ENTITY_NAME:"SimpleMailHeader"};var l=e.imageUploader=a.create({scope:e,url:"/civicrm/ajax/rest?entity=SimpleMailHeader&action=uploadimage&json=1&sequential=1",autoUpload:!0,headers:{"X-Requested-with":"XMLHttpRequest"},filters:[function(){return console.info("filter1"),!0}]});l.bind("beforeupload",function(r,t){switch(console.info("Before upload",t),t.field){case"image":e.header.uploadingField="image",t.formData.push({field:"image"});break;case"logo_image":e.header.uploadingField="logo_image",t.formData.push({field:"logo_image"})}}),l.bind("success",function(r,t,a,n){console.info("Success",t,a,n),e.remove(a.field),e.header[a.field]=n.values[0].imageFileName,e.header[a.field+"_url"]=n.values[0].imageUrl,e.header.uploadingField=null,i.success("Image uploaded")}),l.bind("error",function(e,r,t,a){console.info("Error",r,t,a)}),l.bind("complete",function(e,r,t,a){console.info("Complete",r,t,a)}),l.bind("progressall",function(e,r){console.info("Total progress: "+r)}),e.cancel=function(){e.header.id||(e.header.image&&e.remove("image"),e.header.logo_image&&e.remove("logo_image")),e.redirectToListing()},e.remove=function(r){var a=e.header[r];a&&n.post("SimpleMailHeader",{field:r,fileName:a},"deleteimage").then(function(e){return e.is_error?t.reject(e):void i.success("Image deleted successfully")}).catch(function(e){i.error("Failed to delete the image",e.error_message)}),e.header[r]=e.header[r+"_url"]=void 0},s.headerId&&n.get(e.constants.ENTITY_NAME,{id:s.headerId}).then(function(r){return o.createLog("Header retrieved",r),r.data.is_error?t.reject(r):(e.header=r.data.values[0],!0)}).then(function(){return n.get("SimpleMailHeaderFilter",{header_id:e.header.id}).then(function(r){return console.log("Filters retrieved",r),r.data.is_error?t.reject(r):(e.header.filterIds=[],angular.forEach(r.data.values,function(r){e.header.filterIds.push(r.entity_id)}),!0)})}).catch(function(r){i.error("Failed to retrieve the header",r.data.error_message),e.redirectToListing()}),n.getValue("OptionGroup",{name:"sm_header_filter_options","return":"id"}).then(function(e){return o.createLog("Option Group ID retrieved for filters",e),e.data.is_error?t.reject(e):+e.data.result}).then(function(e){return console.log("Option Group ID",e),n.get("OptionValue",{option_group_id:e,is_active:"1"})}).then(function(r){console.log("Option values retrieved",r),e.filters=r.data.values}).catch(function(e){console.log("Failed to retrieve filters",e)}),e.redirectToListing=function(){d.path("/headers")},e.validateHeader=function(e){var r=!1;return e.$error.required&&(r=!0),r},e.createOrUpdateHeader=function(r){return e.header.submitted=!0,e.validateHeader(r)?void i.error("Please fix the errors on the page"):void n.create(e.constants.ENTITY_NAME,e.header).then(function(r){o.createLog("Update header response",r),r.data.is_error&&t.reject(r),i.success("Header updated"),e.header.id=r.data.values[0].id}).then(function(){return n.get("SimpleMailHeaderFilter",{header_id:+e.header.id}).then(function(r){if(console.log("Filters retrieved",r),r.data.is_error)return t.reject(r);var a=[],n=e.header.filterIds;angular.forEach(r.data.values,function(e){a.push(e.entity_id)}),console.log("Old filters",a),console.log("New filters",n);var o=c("arrayDiff")(a,n),i=c("arrayDiff")(n,a);return console.log("Removed filters",o),console.log("Added filters",i),{added:i,removed:o,filters:r}}).then(function(r){for(var a=[],o=0,i=r.added.length;i>o;o++){var s={header_id:e.header.id,entity_table:"civicrm_option_value",entity_id:+r.added[o]},d=n.create("SimpleMailHeaderFilter",s).then(function(e){return e.data.is_error?t.reject(e):(console.log("Filter added",e),!0)}).catch(function(e){return t.reject(e)});a.push(d)}return t.all(a).then(function(){return r}).catch(function(e){return t.reject(e)})}).then(function(e){for(var r=[],a=0,o=e.removed.length;o>a;a++){var i=null;angular.forEach(e.filters.data.values,function(r){r.entity_id===e.removed[a]&&(i=+r.id)});var s=n.remove("SimpleMailHeaderFilter",{id:i}).then(function(e){return e.data.is_error?t.reject(e):(console.log("Filter deleted",e),!0)}).catch(function(e){return t.reject(e)});r.push(s)}return t.all(r)}).catch(function(e){return t.reject(e)})}).then(e.redirectToListing).catch(function(e){i.error("Failed to update header",e.data.error_message)})}}]),e.controller("MessagesAdminController",["$scope","$http","$q","CiviApiFactory","loggingServices","NotificationFactory",function(e,r,t,a,n,o){e.$on("$viewContentLoaded",function(){cj("#crm-container textarea.huge:not(.textarea-processed), #crm-container textarea.form-textarea:not(.textarea-processed)").each(function(){var e=cj(this);0==e.parents("div.civicrm-drupal-wysiwyg").length&&e.TextAreaResizer()})}),e.constants={ENTITY_NAME:"SimpleMailMessage"},e.messages=[],e.newMessage={is_active:"1"},a.get(e.constants.ENTITY_NAME).then(function(r){return r.data.is_error?t.reject(r):(e.messages=r.data.values,n.createLog("Messages retrieved",e.messages),!0)}).catch(function(e){n.createLog("Failed to retrieve messages",e)}),e.clearNewMessageForm=function(){e.newMessage={}},e.enableAddingMessage=function(){e.newMessage.editing=!0},e.disableAddingMessage=function(){e.newMessage.editing=!1,e.clearNewMessageForm()},e.enableEditingMessage=function(r){e.messages[r].editing=!0},e.disableEditingMessage=function(r){e.messages[r].editing=!1},e.createMessage=function(){var r=e.newMessage;a.create(e.constants.ENTITY_NAME,r).then(function(e){return n.createLog("Create message response",e),e.data.is_error?t.reject(e):(o.success("Message added"),e.data.values[0])}).then(function(r){e.messages.push(r),e.disableAddingMessage()}).catch(function(r){n.createLog("Failed to add message",r.data.error_message),e.errorMessage=r.data.error_message})},e.updateMessage=function(r){var i=e.messages[r];a.update(e.constants.ENTITY_NAME,i).then(function(e){return n.createLog("Update message response",e),e.is_error?t.reject(e):(o.success("Message updated"),!0)}).then(function(){e.disableEditingMessage(r)}).catch(function(r){o.error("Failed to update message",r.data.error_message),e.errorMessage=r.data.error_message})},e.deleteMessage=function(r){var n=e.messages[r];a.remove(e.constants.ENTITY_NAME,n).then(function(e){return console.log(e),e.is_error?t.reject(e):(o.success("Message deleted"),!0)}).then(function(){e.messages.splice(r,1)}).catch(function(r){console.log("Failed to update the record:",r.error_message),e.errorMessage=r.error_message})}}])}();
!function(){"use strict";var i=angular.module("simpleMail.app",["ngRoute","ngAnimate","ui.select","ngQuickDate","simpleMail.app.controllers","simpleMail.services","simpleMail.directives","simpleMail.constants","simpleMail.filters"]);i.config(["$routeProvider","paths","ngQuickDateDefaultsProvider","$provide",function(i,e,l,n){l.set({parseDateFunction:function(i){var e=Date.create(i);return e.isValid()?e:null}}),i.when("/mailings",{templateUrl:e.PARTIALS_DIR()+"/wizard/listMailings.html",controller:"MailingsController"}).when("/mailings/:mailingId",{redirectTo:"/mailings/:mailingId/steps/1"}).when("/mailings/:mailingId/steps",{redirectTo:"/mailings/:mailingId/steps/1"}).when("/mailings/:mailingId/steps/:step",{templateUrl:e.PARTIALS_DIR()+"/wizard/steps/steps.html",controller:""}).otherwise({redirectTo:"/mailings"}),n.decorator("$log",["$delegate","config",function(i,e){var l=function(){};return e.LOGGING_ENABLED?(e.LOG_LOG||(i.log=l),e.LOG_INFO||(i.info=l),e.LOG_WARNING||(i.warning=l),e.LOG_ERROR||(i.error=l),e.LOG_DEBUG||(i.debug=l)):i.log=i.info=i.warning=i.error=i.debug=l,i}])}])}();
!function(){"use strict";var t=angular.module("simpleMail.constants",[]);t.constant("paths",{EXT_DIR:CRM.resourceUrls["uk.co.compucorp.civicrm.simplemail"],TEMPLATES_DIR:function(){return this.EXT_DIR+"/js/dist/templates"},PARTIALS_DIR:function(){return this.EXT_DIR+"/partials"}}),t.constant("config",{LOGGING_ENABLED:!0,LOG_LOG:!0,LOG_INFO:!0,LOG_WARNING:!0,LOG_ERROR:!0,LOG_DEBUG:!0})}();
!function(){"use strict";var i=angular.module("simpleMail.app.controllers",[]);i.config(["$httpProvider",function(i){i.defaults.headers.common["X-Requested-With"]="XMLHttpRequest"}]);var t=["$scope","$http","$q","CiviApiFactory","loggingServices","NotificationFactory","$filter","MailingsListingFactory","$log",function(i,t,e,n,a,s,l,r){i.constants={ENTITY_NAME:"SimpleMail",DRAFT:"Not Scheduled",SCHEDULED:"Scheduled",SENT:"Complete",CANCELLED:"Canceled"},i.showFilters=!0,i.models={},i.models.mailingsLoaded=!1,i.mailingFilters={status:{},creator:"all"},i.filteredMailings=[],i.mailingFilters.status[i.constants.DRAFT]=!0,i.mailingFilters.status[i.constants.SCHEDULED]=!0,i.mailingFilters.status[i.constants.SENT]=!0,i.mailingFilters.status[i.constants.CANCELLED]=!0,r.init().then(function(){i.mailings=r.getMailings(),i.userId=r.getUserId(),i.models.creators=r.getCreators(),i.models.creators.unshift({id:"all",name:"All"});var t=l("filter")(i.models.creators,{id:i.userId});i.mailingFilters.creator=t.length?i.userId:"all"}).finally(function(){i.models.mailingsLoaded=!0}),i.deleteMailing=function(i){return r.deleteMailing(i)},i.cancelMailing=function(i){return r.cancelMailing(i)},i.duplicateMailing=function(i){return r.duplicateMailing(i)}}],e=["$q","MailingDetailFactory","NotificationFactory","MailingHelperFactory","WizardStepFactory",function(i,t,e,n,a){var s=this;this.mailing=t.getCurrentMailing(),this.groups=n.getMailingGroups(),this.categories=n.getMailingCategories();var l=[],r=t.init().then(function(){s.mailing=t.getCurrentMailing(),s.fromSearch=t.isCreatedFromSearch(),angular.isUndefined(s.mailing.dedupe_email)&&(s.mailing.dedupe_email="1")}),o=n.initMailingGroups().then(function(){s.groups=n.getMailingGroups(),s.categories=n.getMailingCategories()});l.push(r,o),i.all(l).catch(function(){e.genericError()}).finally(function(){s.initialised=!0,a.init()}),this.isMailingNotScheduled=function(){return"Not Scheduled"===this.mailing.status}}],n=["$filter","$q","$scope","CampaignMessageFactory","HeaderFactory","MailingHelperFactory","MailingDetailFactory","NotificationFactory","WizardStepFactory",function(i,t,e,n,a,s,l,r,o){var c=this;this.headersLoaded=!1,this.editFromName=!1,this.selectedMessage="",this.selectedFilterId=null,this.mailing=l.getCurrentMailing(),this.filters=s.getHeaderFilters(),this.headers=a.getHeaders(),this.fromEmails=s.getFromEmails(),this.messages=n.getMessages(),this.regionsTemplatePath=o.getRegionsTemplatePath();var g=[],u=l.init().then(function(){c.mailing=l.getCurrentMailing()}),d=s.initHeaderFilters().then(function(){c.filters=s.getHeaderFilters()}).catch(function(){return!0}),h=a.init().then(function(){c.headers=a.getHeaders(),c.headersLoaded=!0}),m=s.initFromEmails().then(function(){c.fromEmails=s.getFromEmails()}),f=n.init().then(function(){c.messages=n.getMessages()});g.push(u,d,h,m,f),t.all(g).then(function(){c.initHeaderFilter(),c.initFromName(),c.updateSelectedMessage()}).catch(function(){r.genericError()}).finally(function(){o.init()}),this.updateSelectedMessage=function(){this.mailing.message_id&&(this.selectedMessage=i("filter")(this.messages,{id:this.mailing.message_id})[0])},this.initHeaderFilter=function(){if(i("filter")(this.filters,{id:"all"})[0]||this.filters.unshift({id:"all",label:"All"}),!this.mailing.header_id){var t=i("filter")(this.filters,{label:"ATL"})[0];angular.isObject(t)&&t.hasOwnProperty("id")&&(this.selectedFilterId=t.id)}},this.initFromName=function(){this.mailing.from_name&&this.fromEmails.unshift({label:this.mailing.from_address})},this.cancelFromNameCustomisation=function(){this.mailing.from_name=l.getCurrentMailing(!0).from_name,this.editFromName=!1}}],a=["$q","MailingHelperFactory","MailingDetailFactory","NotificationFactory","WizardStepFactory",function(i,t,e,n,a){var s=this;this.mailing=e.getCurrentMailing(),this.groups=t.getMailingGroups();var l=[],r=e.init().then(function(){s.mailing=e.getCurrentMailing()}),o=t.initMailingGroups().then(function(){s.groups=t.getMailingGroups()});l.push(r,o),i.all(l).catch(function(){n.genericError()}).finally(function(){a.init()})}],s=["$q","MailingDetailFactory","NotificationFactory","WizardStepFactory",function(i,t,e,n){var a=this;this.mailing=t.getCurrentMailing();var s=[],l=t.init().then(function(){a.mailing=t.getCurrentMailing()});s.push(l),i.all(s).catch(function(){e.genericError()}).finally(function(){n.init()})}],l=["$routeParams","WizardStepFactory",function(i,t){var e=+i.step;t.setCurrentStep(e),this.partial=t.getPartialPath(),this.isInitialised=function(){return t.isInitialised()}}],r=["MailingDetailFactory","WizardStepFactory",function(i,t){this.showPrevStepLink=t.prevStepAllowed(),this.showNextStepLink=t.nextStepAllowed(),this.showSubmitMassEmailLink=!this.showNextStepLink,this.canUpdate=i.canUpdate(),this.isInitialised=function(){return t.isInitialised()},this.prevStep=function(){t.isInitialised()&&t.prevStep()},this.nextStep=function(){t.isInitialised()&&t.nextStep()},this.saveAndContinueLater=function(){t.isInitialised()&&t.saveAndContinueLater()},this.submitMassEmail=function(){t.isInitialised()&&t.submitMassEmail()},this.cancel=function(){t.cancel()},this.sendTestEmail=function(){t.sendTestEmail()}}];angular.module("simpleMail.app.controllers").controller("MailingsController",t).controller("WizardStepsCtrl",l).controller("CreateMailingCtrl",e).controller("ComposeMailingCtrl",n).controller("TestMailingCtrl",a).controller("ScheduleAndSendCtrl",s).controller("MailingButtonsCtrl",r)}();
!function(){"use strict";var e=["paths",function(e){function t(e){e.$watch(function(){return e.config.required},function(t){e.isRequired=-1!==["0","1"].indexOf(t)?+t?!0:!1:-1!==["false","true"].indexOf(t)?"true"===t:t})}return{restrict:"AE",scope:{model:"=",uploader:"=",config:"=",remove:"&onRemove"},templateUrl:e.TEMPLATES_DIR()+"/image-uploader.html",link:t}}],t=["paths","$timeout","$rootScope","itemFromCollectionFilter","headersForSelectedFilterFilter",function(e,t,n,i,l){function o(e,n){e.selectedIndex=null,e.selectedItem=null,e.filteredItems=[],e.$watchCollection(function(){return e.items},function(t){console.log(t),angular.isArray(t)&&t.length&&(e.selectedFilterId="all",console.log("Selected item",e.selectedItem))}),e.$watch(function(){return e.selectedIndex},function(t){null!==t&&(e.selectedItemId=e.filteredItems[e.selectedIndex].id,console.log("Item ID",e.selectedItemId))}),e.$watch(function(){return e.selectedItemId},function(t){t&&e.updateSelection()}),e.$watch(function(){return e.selectedFilterId},function(){console.log("--- Filter changed ---"),e.filterItems(),e.updateSelection()},!0),e.filterItems=function(){e.filteredItems=l(e.items,e.selectedFilterId),t(function(){e.setWidth()},200)},e.selectImage=function(t){console.log("Image selected with index",t),e.selectedIndex=t},e.updateSelection=function(){var t=i(e.filteredItems,"id",e.selectedItemId);e.selectedIndex=t.index},e.resetWidth=function(){n.find("ul").width("100%")},e.setWidth=function(){var e=n.find("ul").find("img"),t=0,i=0;if(e.length){for(var l=0;l<e.length;l++)i=$(e[l]).outerWidth(!0),t+=i,console.log(i);t+=.005*t}else t="100%";console.log("Total length",t),n.find("ul").width(t)}}return{restrict:"AE",scope:{items:"=",selectedFilterId:"=",selectedItemId:"=",itemsLoaded:"="},templateUrl:e.TEMPLATES_DIR()+"/simple-image-carousel.html",link:o}}],n=[function(){function e(e,t,n,i){if(i){var l={enterMode:CKEDITOR.ENTER_BR,allowedContent:"em;strong;u;s;a[!href,target];ul;ol;li",toolbar:[]};switch(n.smCkEditor){case"minimal":l.toolbar.push([]);break;default:case"normal":l.toolbar.push(["Bold","Italic","Strike","RemoveFormat"],["NumberedList","BulletedList"],["Link","Unlink"],["Maximize","Source"],["About"])}n.height&&(l.height=n.height);var o=CKEDITOR.replace(t[0],l);o.on("pasteState",function(){e.$apply(function(){i.$setViewValue(o.getData())})}),i.$render=function(){i.$viewValue?o.setData(i.$viewValue):n.placeholder&&o.setData(n.placeholder)}}}return{require:"?ngModel",restrict:"A",link:e}}],i=[function(){function e(e,t,n){e.$watch(n.emailContent,function(e,n){var i=e?e:n;if(i){var l=t[0],o=null;l.contentDocument?o=l.contentDocument:l.contentWindow&&(o=l.contentWindow.document),o.open(),o.writeln(i),o.close()}})}return{restrict:"A",link:e}}],l=["paths",function(e){return{restrict:"AE",scope:{mailing:"=",constants:"=statusConstants",duplicate:"&onDuplicate","delete":"&onDelete",cancel:"&onCancel"},templateUrl:e.TEMPLATES_DIR()+"/action-buttons.html"}}],o=["$parse",function(e){var t=function(t,n,i){var l=e(i.smClickOnce);t.submitting=!1,n.on("click",function(){t.$apply(function(){t.submitting||(t.submitting=!0,l(t).finally(function(){t.submitting=!1}))})})};return{link:t}}],c=[function(){var e=function(e,t,n){t.addClass("disabled"),e.$watch(n.smDisabled,function(e){e===!1&&t.removeClass("disabled")})};return{link:e}}],r=[function(){var e=function(e,t,n){t.append('<div class="loading-panel"></div>'),e.$watch(n.smLoaded,function(e){e===!0&&t.find(".loading-panel").addClass("ng-hide")})};return{link:e}}];angular.module("simpleMail.directives",[]).directive("smImageUploader",e).directive("smImageCarousel",t).directive("smCkEditor",n).directive("smEmailPreviewer",i).directive("smMailingActionButtons",l).directive("smClickOnce",o).directive("smDisabled",c).directive("smLoaded",r)}();
!function(){"use strict";var r=angular.module("simpleMail.filters",[]);r.filter("itemFromCollection",[function(){return function(r,n,t){var e={item:null,index:null};if(angular.isUndefined(r)||angular.isUndefined(t))return e;for(var i=null,u=0,a=r.length;a>u;u++)i=r[u],angular.isObject(i)&&i.hasOwnProperty(n)&&i[n]===t&&(e.item=i,e.index=u);return e}}]),r.filter("filterMailings",["$filter",function(r){return function(n,t){if(!angular.isArray(n))return!1;if(!angular.isObject(t))return n;var e=n;return t.hasOwnProperty("status")&&t.status&&(e=r("filterMailingsByStatus")(n,t.status)),t.hasOwnProperty("creator")&&t.creator&&(e=r("filterMailingsByCreator")(e,t.creator)),e}}]),r.filter("filterMailingsByStatus",[function(){return function(r,n){var t=[];angular.forEach(n,function(r,n){r&&t.push(n)});for(var e=null,i=[],u=0,a=r.length;a>u;u++)e=r[u],e.hasOwnProperty("status")&&-1!==t.indexOf(e.status)&&i.push(e);return i}}]),r.filter("filterMailingsByCreator",[function(){return function(r,n){if("all"===n)return r;for(var t=[],e=null,i=0,u=r.length;u>i;i++)e=r[i],e.hasOwnProperty("created_id")&&e.created_id===n&&t.push(e);return t}}]),r.filter("headersForSelectedFilter",["uniqueFilter",function(r){return function(n,t){if("all"===t)return r(n,"id");if(!t)return n;var e=[];return angular.forEach(n,function(r){r.entity_id===t&&(console.log("Value",r),e.push(r))}),e}}]),r.filter("unique",[function(){return function(r,n){var t=[],e=[];return n=n||0,angular.forEach(r,function(r){var i=null;angular.isObject(r)&&r.hasOwnProperty(n)?i=r[n]:angular.isString(r)&&(i=r),-1===t.indexOf(i)&&(t.push(i),e.push(r))}),e}}]),r.filter("extractColumn",[function(){return function(r,n){var t=[];return angular.isObject(r)&&angular.isObject(n)&&angular.forEach(r,function(r){var e={};angular.forEach(n,function(n,t){angular.isObject(r)&&r.hasOwnProperty(n)&&r[n]&&(e[t]=r[n])}),t.push(e)}),t}}]);var n=[function(){return function(r,n){for(var t=[],e=0,i=r.length;i>e;e++)-1===n.indexOf(r[e])&&t.push(r[e]);return t}}];angular.module("simpleMail.filters").filter("arrayDiff",n)}();
!function(){"use strict";var e=angular.module("simpleMail.services",[]),t=["$q","$filter","CiviApiFactory","NotificationFactory",function(e,t,n,i){var r={entities:{MAILING:"SimpleMail"}},a=[],o=null,c=[],u=function(){var t=e.defer();return m().then(h).then(function(){t.resolve()}).catch(function(e){t.reject(),$log.error("Failed to initialise mailings",e)}),t.promise},s=function(t){var o=e.defer(),c=a.indexOf(t),u=i.loading("Deleting mailing...");return-1!==c?n.remove(r.entities.MAILING,t).then(function(){a.splice(c,1),o.resolve()}).catch(function(e){o.reject(e)}):o.reject("Mailing to be deleted was not found in the list of all mailings"),o.promise.then(function(){i.success("Mailing deleted")}).catch(function(t){return i.error("Failed to delete the mailing"),$log.error("Failed to delete the mailing:",t),e.reject()}).finally(function(){i.clear(u)})},l=function(t){var o=e.defer(),c=a.indexOf(t),u=i.loading("Cancelling mailing...");return-1!==c?n.post(r.entities.MAILING,t,"cancelmassemail").then(function(){t.status="Canceled",o.resolve()}).catch(function(e){o.reject(e)}):o.reject("Mailing to be cancelled was not found in the list of all mailings"),o.promise.then(function(){i.success("Mailing cancelled")}).catch(function(t){return i.error("Failed to cancel the mailing"),$log.error("Failed to cancel the mailing:",t),e.reject()}).finally(function(){i.clear(u)})},f=function(t){var o=e.defer(),c=a.indexOf(t),u=i.loading("Duplicating mailing...");return-1!==c?n.post(r.entities.MAILING,t,"duplicatemassemail").then(function(e){return n.get(r.entities.MAILING,{id:e.data.values[0].id})}).then(function(e){a.push(e.data.values[0]),o.resolve()}).catch(function(e){o.reject(e)}):o.reject("Mailing to be duplicated was not found in the list of all mailings"),o.promise.then(function(){i.success("Mailing duplicated")}).catch(function(t){return i.error("Failed to duplicate the mailing",t.data.error_message),$log.error("Failed to duplicate the mailing:",t),e.reject()}).finally(function(){i.clear(u)})},d=function(){return a},g=function(){return o},p=function(){return c},m=function(){return n.get(r.entities.MAILING,{},{error:"Failed to retrieve mailings"}).then(function(e){a=e.data.values,o=e.data.userId}).then(v).catch(function(e){i.error(e.data&&e.data.error_message?e.data.error_message:e)})},h=function(){c=t("extractColumn")(a,{id:"created_id",name:"sort_name"}),c=t("unique")(c,"id")},v=function(){return n.post(r.entities.MAILING,{},"clearsearchcontacts").catch(function(){return!0})};return{init:u,deleteMailing:s,cancelMailing:l,duplicateMailing:f,getMailings:d,getUserId:g,getCreators:p}}],n=["$location","$log","$q","CiviApiFactory","MailingDetailFactory","NotificationFactory","paths",function(e,t,n,i,r,a,o){var c={steps:{FIRST:1,LAST:4},paths:{WIZARD_ROOT:"/mailings"}},u=c.steps.FIRST,s=!1,l=function(){return s},f=function(){s=!0},d=function(){return F()<c.steps.LAST},g=function(){return F()>c.steps.FIRST},p=function(){return d()?O(u+1):n.reject("Next step now allowed!")},m=function(){return g()?O(u-1):n.reject("Prev step not allowed!")},h=function(){return r.saveProgress().then(function(){r.clearCurrentMailing(),C()})},v=function(){return r.submitMassEmail().then(function(){C()})},M=function(){return r.sendTestEmail()},y=function(){r.clearCurrentMailing(),C()},I=function(){return o.PARTIALS_DIR()+"/wizard/steps/step-"+F()+".html"},_=function(){return o.TEMPLATES_DIR()+"/wave-regions.html"},F=function(){return u},A=function(e){u=e},O=function(e){var n=!1;if(r.isCurrentMailingDirty()){var i=a.loading("Saving...");n=!0}return r.saveProgress().then(function(){n&&(a.clear(i),a.success("Mailing saved")),S(e)}).catch(function(e){a.error("Failed to save mailing!"),t.error("Failed to save mailing!",e)})},S=function(t){A(t),s=!1,e.path(R(t))},C=function(){e.path(c.paths.WIZARD_ROOT)},R=function(e){return c.paths.WIZARD_ROOT+"/"+r.getCurrentMailing().id+"/steps/"+e};return{init:f,isInitialised:l,getCurrentStep:F,getRegionsTemplatePath:_,setCurrentStep:A,nextStep:p,prevStep:m,nextStepAllowed:d,prevStepAllowed:g,cancel:y,saveAndContinueLater:h,sendTestEmail:M,submitMassEmail:v,getPartialPath:I}}],i=["$q","CiviApiFactory",function(e,t){var n=[],i=!1,r=function(){var r=e.defer();return i?r.resolve():t.get("SimpleMailHeader",{withFilters:!0},{cached:!0}).then(function(e){n=e.data.values,i=!0,r.resolve()}).catch(function(){r.reject()}),r.promise},a=function(){return n};return{init:r,getHeaders:a}}],r=["$q","CiviApiFactory",function(e,t){var n={entities:{MESSAGE:"SimpleMailMessage"}},i=[],r=!1,a=function(){var a=e.defer();return r?a.resolve():t.get(n.entities.MESSAGE,{is_active:1},{cached:!0}).then(function(e){i=e.data.values,r=!0,a.resolve()}).catch(function(){a.reject()}),a.promise},o=function(){return i};return{init:a,getMessages:o}}],a=["$filter","$q","CiviApiFactory",function(e,t,n){var i={entities:{OPTION_GROUP:"OptionGroup",OPTION_VALUE:"OptionValue",MAILING_GROUP:"Group",MAILING_CATEGORY:"Group"}},r=[],a=[],o=[],c=[],u=!1,s=!1,l=!1,f=function(){var o=t.defer();return u?o.resolve():n.get(i.entities.MAILING_GROUP).then(function(t){var n=e("filter")(t.data.values,{is_hidden:0});angular.forEach(n,function(e){var t=!1,n=!1;-1!==e.group_type.indexOf("2")&&(t=!0),-1!==e.group_type.indexOf("3")&&(n=!0),t&&(n?a.push(e):r.push(e))}),u=!0,o.resolve()}).catch(function(){o.reject()}),o.promise},d=function(){var e=t.defer();return s?e.resolve():n.getValue(i.entities.OPTION_GROUP,{name:"from_email_address","return":"id"},{cached:!0}).then(function(e){return+e.data.result}).then(function(t){return n.get("OptionValue",{option_group_id:t},{cached:!0}).then(function(t){o=t.data.values,s=!0,e.resolve()})}).catch(function(){e.reject()}),e.promise},g=function(){var r=t.defer();return l?r.resolve():n.getValue(i.entities.OPTION_GROUP,{name:"sm_header_filter_options","return":"id"},{cached:!0}).then(function(e){return+e.data.result}).then(function(t){return n.get(i.entities.OPTION_VALUE,{option_group_id:t,is_active:"1"},{cached:!0}).then(function(t){c=e("orderBy")(t.data.values,"label"),l=!0,r.resolve()})}).catch(function(e){r.reject(e)}),r.promise},p=function(){return r},m=function(){return a},h=function(){return o},v=function(){return c};return{initMailingGroups:f,initFromEmails:d,initHeaderFilters:g,getMailingCategories:m,getMailingGroups:p,getFromEmails:h,getHeaderFilters:v}}],o=["$log","$q","$routeParams","CiviApiFactory","NotificationFactory",function(e,t,n,i,r){var a,o={entities:{MAILING:"SimpleMail"}},c={},u={},s=!1,l=function(){var e=t.defer();return f()?e.resolve():S().then(function(){s=!0,e.resolve()}).catch(function(){e.reject()}),e.promise},f=function(){return s&&d()&&g(),s},d=function(){return p()&&p()!=C()},g=function(){F({},!0),s=!1},p=function(){return+_().id},m=function(){var e=_();return!!e.crm_mailing_id&&!!e.scheduled_date},h=function(){return l().then(function(){if(v()){var e=_();return e.scheduled_date&&"Not Scheduled"===e.status&&(e.scheduled_date="",e.send_immediately&&(e.send_immediately=!1)),i.create(o.entities.MAILING,e).then(function(e){return i.get(o.entities.MAILING,{id:e.data.values[0].id})}).then(function(e){F(e.data.values[0],!0)})}})},v=function(){return!angular.equals(_(),_(!0))},M=function(){return c.send_immediately&&(c.scheduled_date=Date.create().format("{yyyy}-{{MM}}-{{dd}} {{HH}}:{{mm}}:{{ss}}")),i.post(o.entities.MAILING,_(),"submitmassemail",{success:"Mailing submitted for mass emailing",error:"Oops! Failed to submit the mailing for mass emailing"})},y=function(){var e=_();return r.info("Sending test email"),i.post("SimpleMail",{crmMailingId:e.crm_mailing_id,groupId:e.testRecipientGroupId,emails:e.testRecipientEmails},"sendtestemail").then(function(){r.success("Test email sent")}).catch(function(e){var t=e.data&&e.data.error_message?e.data.error_message:"";r.error("Failed to send test email",t)})},I=function(){return a},_=function(e){return e?u:c},F=function(e,t){c=e,t&&(u=angular.copy(e))},A=function(e){a=e},O=function(){return"new"===C()},S=function(){var e=t.defer();return O()?i.post("SimpleMail",_(),"iscreatedfromsearch").then(function(t){A(t.data.values[0].answer),e.resolve()}):i.get(o.entities.MAILING,{id:C()}).then(function(t){F(t.data.values[0],!0);var n=t.data.values[0].hidden_recipient_group_entity_ids.length?!0:!1;A(n),e.resolve()}).catch(function(){e.reject()}),e.promise},C=function(){return n.mailingId};return{canUpdate:m,clearCurrentMailing:g,init:l,saveProgress:h,sendTestEmail:y,submitMassEmail:M,getCurrentMailing:_,setCurrentMailing:F,isInitialised:f,isCreatedFromSearch:I,isCurrentMailingDirty:v}}],c=["$log",function(e){var t=!0,n=!0,i={notificationTypes:{SUCCESS:"success",ERROR:"error",INFO:"info",ALERT:"alert",LOADING:"crm-msg-loading"}},r=function(e,t){return f(e,t,i.notificationTypes.ALERT)},a=function(e,t){return f(e,t,i.notificationTypes.SUCCESS)},o=function(e,t){return f(e,t,i.notificationTypes.INFO)},c=function(e,t){return f(e,t,i.notificationTypes.ERROR)},u=function(e,t){return f(e,t,i.notificationTypes.LOADING,{expires:0})},s=function(){return f("Oops! Something went wrong.","Please refresh the page",i.notificationTypes.ERROR)},l=function(e){e.close()},f=function(i,r,a,o){return t?(r=r||"",o=o||{},n&&e.debug("("+a.toUpperCase()+") "+i,r),CRM.alert(r,i,a,o)):void 0};return{alert:r,clear:l,success:a,info:o,error:c,loading:u,genericError:s}}];e.factory("loggingServices",function(){var e=!0;return{createLog:function(t,n){e&&(n?console.log(t+":",n):console.log(t))}}});var u=["$http","$q","$log","NotificationFactory",function(e,t,n,i){var r=function(e,t,n){return s(e,t,"get",n)},a=function(e,t,n){return s(e,t,"getValue",n)},o=function(e,t,n){return s(e,t,"create",n)},c=function(e,t,n){return s(e,t,"create",n)},u=function(e,t,n){return s(e,t,"delete",n)},s=function(e,r,a,o){r=r||{},o=o||{};var c=o.success||null,u=o.error||null,s=o.progress||null,f=o.cached||!1;if(s)var d=i.loading(s);return l(e,r,a,f).then(function(r){return r.data.is_error?t.reject(r):(s&&i.clear(d),c?(i.success(c),n.info(c+":",r)):n.info("Successfully performed '"+a+"' on '"+e+"' with response:",r),r)}).catch(function(r){return u?(r.data.error_message&&(u+=": "+r.data.error_message),i.error(u),n.error(u+":",r)):n.error("Failed to perform "+a+" on "+e+" with response:",r),t.reject(r)})},l=function(t,n,i,r){n=n||{},n.entity=t,n.action=i,n.sequential=1,n.json=1,n.rowCount=0;var a=jQuery.param(n),o="/civicrm/ajax/rest",c={"Content-Type":"application/x-www-form-urlencoded"};return e.post(o,a,{headers:c,cached:r})};return{get:r,getValue:a,create:o,update:c,remove:u,post:s}}];angular.module("simpleMail.services").factory("MailingsListingFactory",t).factory("MailingDetailFactory",o).factory("HeaderFactory",i).factory("CampaignMessageFactory",r).factory("MailingHelperFactory",a).factory("WizardStepFactory",n).factory("NotificationFactory",c).factory("CiviApiFactory",u)}();