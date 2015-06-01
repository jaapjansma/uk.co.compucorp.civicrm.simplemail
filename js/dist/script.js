!function () {
  "use strict";
  var e = angular.module("simpleMail.adminApp", [
    "ngRoute",
    "ngAnimate",
    "ui.select",
    "simpleMail.adminApp.controllers",
    "simpleMail.services",
    "simpleMail.directives",
    "simpleMail.constants",
    "simpleMail.filters",
    "angularFileUpload"
  ]);
  e.config([
    "$routeProvider", "paths", function (e, l) {
      e.when("/headers", {
        templateUrl: l.PARTIALS_DIR() + "/admin/listHeaders.html",
        controller: "HeadersAdminController"
      }).when("/headers/:headerId/edit", {
        templateUrl: l.PARTIALS_DIR() + "/admin/editHeader.html",
        controller: "HeaderAdminController"
      }).when("/headers/new", {
        templateUrl: l.PARTIALS_DIR() + "/admin/editHeader.html",
        controller: "HeaderAdminController"
      }).when("/messages", {
        templateUrl: l.PARTIALS_DIR() + "/admin/listMessages.html",
        controller: "MessagesAdminController"
      }).otherwise({redirectTo: "/"})
    }
  ])
}();
!function () {
  "use strict";
  var e = angular.module("simpleMail.adminApp.controllers", []);
  e.config([
    "$httpProvider", function (e) {
      e.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest"
    }
  ]), e.controller("HeadersAdminController", [
    "$scope", "$http", "$q", "CiviApiFactory", "loggingServices", "NotificationFactory", function (e, r, t, a, o, n) {
      e.constants = {ENTITY_NAME: "SimpleMailHeader"}, e.headers =
      {}, a.get(e.constants.ENTITY_NAME).then(function (r) {
        return r.data.is_error ? t.reject(r) : (e.headers = r.data.values, o.createLog("Headers received",
          e.headers), !0)
      })["catch"](function (e) {
        o.createLog("Failed to retrieve headers", e)
      }), e.deleteHeader = function (r) {
        var i = e.headers[r];
        a.remove(e.constants.ENTITY_NAME, i).then(function (e) {
          return o.createLog("Delete message response", e), e.data.is_error ? t.reject(e) : !0
        }).then(function () {
          e.headers.splice(r, 1), n.success("Header deleted")
        })["catch"](function (r) {
          n.error("Failed to delete header", r.data.error_message), e.errorMessage = r.data.error_message
        })
      }
    }
  ]), e.controller("HeaderAdminController", [
    "$scope",
    "$http",
    "$q",
    "FileUploader",
    "CiviApiFactory",
    "loggingServices",
    "NotificationFactory",
    "$routeParams",
    "$location",
    "$filter",
    function (e, r, t, a, o, n, i, s, d, c) {
      function l(r) {
        var t = new a({
          scope: e,
          url: "/civicrm/ajax/rest?entity=SimpleMailHeader&action=uploadimage&json=1&sequential=1",
          autoUpload: !0,
          headers: {"X-Requested-with": "XMLHttpRequest"},
          filters: [
            {
              name: "filter1", fn: function () {
              return console.info("filter1"), !0
            }
            }
          ]
        });
        return t.onBeforeUploadItem = function (t) {
          console.info("Before upload", t), t.field = r, t.formData.push({field: r}), e.header.uploadingField = r
        }, t.onSuccessItem = function (r, t) {
          console.info("Success", r, t), e.remove(r.field), e.header[r.field] =
            t.values[0].imageFileName, e.header[r.field + "_url"] = t.values[0].imageUrl, e.header.uploadingField =
            null, i.success("Image uploaded")
        }, t.onErrorItem = function (e, r) {
          console.info("Error", e, r)
        }, t.onCompleteItem = function (e, r) {
          console.info("Complete", e, r)
        }, t.onProgressAll = function (e) {
          console.info("Total progress: " + e)
        }, t
      }

      e.header = {}, e.models = {}, e.filters = [], e.config =
      {field: "image", name: "image", required: header.show_logo}, e.logoConfig =
      {field: "logo_image", name: "logo_image", required: header.show_logo}, e.constants =
      {ENTITY_NAME: "SimpleMailHeader"}, e.headerUploader = l("image"), e.logoUploader = l("logo_image"), e.cancel =
        function () {
          e.header.id || (e.header.image && e.remove("image"), e.header.logo_image
          && e.remove("logo_image")), e.redirectToListing()
        }, e.remove = function (r) {
        var a = e.header[r];
        a && o.post("SimpleMailHeader", {field: r, fileName: a}, "deleteimage").then(function (e) {
          return e.is_error ? t.reject(e) : void i.success("Image deleted successfully")
        })["catch"](function (e) {
          i.error("Failed to delete the image", e.error_message)
        }), e.header[r] = e.header[r + "_url"] = void 0
      }, s.headerId && o.get(e.constants.ENTITY_NAME, {id: s.headerId}).then(function (r) {
        return n.createLog("Header retrieved", r), r.data.is_error ? t.reject(r) : (e.header = r.data.values[0], !0)
      }).then(function () {
        return o.get("SimpleMailHeaderFilter", {header_id: e.header.id}).then(function (r) {
          return console.log("Filters retrieved", r), r.data.is_error ? t.reject(r) : (e.header.filterIds =
            [], angular.forEach(r.data.values, function (r) {
            e.header.filterIds.push(r.entity_id)
          }), !0)
        })
      })["catch"](function (r) {
        i.error("Failed to retrieve the header", r.data.error_message), e.redirectToListing()
      }), o.getValue("OptionGroup", {name: "sm_header_filter_options", "return": "id"}).then(function (e) {
        return n.createLog("Option Group ID retrieved for filters", e), e.data.is_error ? t.reject(e) : +e.data.result
      }).then(function (e) {
        return console.log("Option Group ID", e), o.get("OptionValue", {option_group_id: e, is_active: "1"})
      }).then(function (r) {
        console.log("Option values retrieved", r), e.filters = r.data.values
      })["catch"](function (e) {
        console.log("Failed to retrieve filters", e)
      }), e.redirectToListing = function () {
        d.path("/headers")
      }, e.validateHeader = function (e) {
        var r = !1;
        return e.$error.required && (r = !0), r
      }, e.createOrUpdateHeader = function (r) {
        return e.header.submitted = !0, e.validateHeader(r) ? void i.error("Please fix the errors on the page")
          : void o.create(e.constants.ENTITY_NAME, e.header).then(function (r) {
          n.createLog("Update header response", r), r.data.is_error
          && t.reject(r), i.success("Header updated"), e.header.id = r.data.values[0].id
        }).then(function () {
          return o.get("SimpleMailHeaderFilter", {header_id: +e.header.id}).then(function (r) {
            if (console.log("Filters retrieved", r), r.data.is_error) {
              return t.reject(r);
            }
            var a = [], o = e.header.filterIds;
            angular.forEach(r.data.values, function (e) {
              a.push(e.entity_id)
            }), console.log("Old filters", a), console.log("New filters", o);
            var n = c("arrayDiff")(a, o), i = c("arrayDiff")(o, a);
            return console.log("Removed filters", n), console.log("Added filters", i), {
              added: i,
              removed: n,
              filters: r
            }
          }).then(function (r) {
            for (var a = [], n = 0, i = r.added.length; i > n; n++) {
              var s = {
                header_id: e.header.id,
                entity_table: "civicrm_option_value",
                entity_id: +r.added[n]
              }, d = o.create("SimpleMailHeaderFilter", s).then(function (e) {
                return e.data.is_error ? t.reject(e) : (console.log("Filter added", e), !0)
              })["catch"](function (e) {
                return t.reject(e)
              });
              a.push(d)
            }
            return t.all(a).then(function () {
              return r
            })["catch"](function (e) {
              return t.reject(e)
            })
          }).then(function (e) {
            for (var r = [], a = 0, n = e.removed.length; n > a; a++) {
              var i = null;
              angular.forEach(e.filters.data.values, function (r) {
                r.entity_id === e.removed[a] && (i = +r.id)
              });
              var s = o.remove("SimpleMailHeaderFilter", {id: i}).then(function (e) {
                return e.data.is_error ? t.reject(e) : (console.log("Filter deleted", e), !0)
              })["catch"](function (e) {
                return t.reject(e)
              });
              r.push(s)
            }
            return t.all(r)
          })["catch"](function (e) {
            return t.reject(e)
          })
        }).then(e.redirectToListing)["catch"](function (e) {
          i.error("Failed to update header", e.data.error_message)
        })
      }
    }
  ]), e.controller("MessagesAdminController", [
    "$scope", "$http", "$q", "CiviApiFactory", "loggingServices", "NotificationFactory", function (e, r, t, a, o, n) {
      e.$on("$viewContentLoaded", function () {
        cj("#crm-container textarea.huge:not(.textarea-processed), #crm-container textarea.form-textarea:not(.textarea-processed)").each(function () {
          var e = cj(this);
          0 == e.parents("div.civicrm-drupal-wysiwyg").length && e.TextAreaResizer()
        })
      }), e.constants = {ENTITY_NAME: "SimpleMailMessage"}, e.messages = [], e.newMessage =
      {is_active: "1"}, a.get(e.constants.ENTITY_NAME).then(function (r) {
        return r.data.is_error ? t.reject(r) : (e.messages = r.data.values, o.createLog("Messages retrieved",
          e.messages), !0)
      })["catch"](function (e) {
        o.createLog("Failed to retrieve messages", e)
      }), e.clearNewMessageForm = function () {
        e.newMessage = {}
      }, e.enableAddingMessage = function () {
        e.newMessage.editing = !0
      }, e.disableAddingMessage = function () {
        e.newMessage.editing = !1, e.clearNewMessageForm()
      }, e.enableEditingMessage = function (r) {
        e.messages[r].editing = !0
      }, e.disableEditingMessage = function (r) {
        e.messages[r].editing = !1
      }, e.createMessage = function () {
        var r = e.newMessage;
        a.create(e.constants.ENTITY_NAME, r).then(function (e) {
          return o.createLog("Create message response", e), e.data.is_error ? t.reject(e)
            : (n.success("Message added"), e.data.values[0])
        }).then(function (r) {
          e.messages.push(r), e.disableAddingMessage()
        })["catch"](function (r) {
          o.createLog("Failed to add message", r.data.error_message), e.errorMessage = r.data.error_message
        })
      }, e.updateMessage = function (r) {
        var i = e.messages[r];
        a.update(e.constants.ENTITY_NAME, i).then(function (e) {
          return o.createLog("Update message response", e), e.is_error ? t.reject(e)
            : (n.success("Message updated"), !0)
        }).then(function () {
          e.disableEditingMessage(r)
        })["catch"](function (r) {
          n.error("Failed to update message", r.data.error_message), e.errorMessage = r.data.error_message
        })
      }, e.deleteMessage = function (r) {
        var o = e.messages[r];
        a.remove(e.constants.ENTITY_NAME, o).then(function (e) {
          return console.log(e), e.is_error ? t.reject(e) : (n.success("Message deleted"), !0)
        }).then(function () {
          e.messages.splice(r, 1)
        })["catch"](function (r) {
          console.log("Failed to update the record:", r.error_message), e.errorMessage = r.error_message
        })
      }
    }
  ])
}();
!function () {
  "use strict";
  var i = angular.module("simpleMail.app", [
    "ngRoute",
    "ngAnimate",
    "ui.select",
    "ngQuickDate",
    "simpleMail.app.controllers",
    "simpleMail.services",
    "simpleMail.directives",
    "simpleMail.constants",
    "simpleMail.filters",
    "angularFileUpload"
  ]);
  i.config([
    "$routeProvider",
    "paths",
    "ngQuickDateDefaultsProvider",
    "$provide",
    "$compileProvider",
    function (i, e, r, n, t) {
      r.set({
        parseDateFunction: function (i) {
          var e = Date.create(i);
          return e.isValid() ? e : null
        }
      }), i.when("/mailings", {
        templateUrl: e.PARTIALS_DIR() + "/wizard/listMailings.html",
        controller: "MailingsController"
      }).when("/mailings/:mailingId", {redirectTo: "/mailings/:mailingId/steps/1"}).when("/mailings/:mailingId/steps",
        {redirectTo: "/mailings/:mailingId/steps/1"}).when("/mailings/:mailingId/steps/:step", {
        templateUrl: e.PARTIALS_DIR() + "/wizard/steps/steps.html",
        controller: ""
      }).otherwise({redirectTo: "/mailings"}), n.decorator("$log", [
        "$delegate", "config", function (i, e) {
          var r = function () {
          };
          return e.LOGGING_ENABLED ? (e.LOG_LOG || (i.log = r), e.LOG_INFO || (i.info = r), e.LOG_WARNING
          || (i.warning = r), e.LOG_ERROR || (i.error = r), e.LOG_DEBUG || (i.debug = r)) : i.log =
            i.info = i.warning = i.error = i.debug = r, i
        }
      ]), t.aHrefSanitizationWhitelist(/^\s*(https?|mailto|javascript):/)
    }
  ]), i.filter("orderObjectByInt", function () {
    return function (i, e, r) {
      var n = [];
      return angular.forEach(i, function (i) {
        n.push(i)
      }), n.sort(function (i, r) {
        var n = parseInt(i[e]), t = parseInt(r[e]);
        return n > t ? 1 : t > n ? -1 : 0
      }), r && n.reverse(), n
    }
  })
}();
!function () {
  "use strict";
  var t = angular.module("simpleMail.constants", []);
  t.constant("paths", {
    EXT_DIR: CRM.resourceUrls["uk.co.compucorp.civicrm.simplemail"], TEMPLATES_DIR: function () {
      return this.EXT_DIR + "/js/dist/templates"
    }, PARTIALS_DIR: function () {
      return this.EXT_DIR + "/partials"
    }
  }), t.constant("config",
    {LOGGING_ENABLED: !0, LOG_LOG: !0, LOG_INFO: !0, LOG_WARNING: !0, LOG_ERROR: !0, LOG_DEBUG: !0})
}();
!function () {
  "use strict";
  var i = angular.module("simpleMail.app.controllers", []);
  i.config([
    "$httpProvider", function (i) {
      i.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest"
    }
  ]);
  var t = [
    "$scope",
    "$http",
    "$q",
    "CiviApiFactory",
    "loggingServices",
    "NotificationFactory",
    "$filter",
    "MailingsListingFactory",
    "$log",
    function (i, t, e, n, a, r, s, l) {
      i.constants = {
        ENTITY_NAME: "SimpleMail",
        DRAFT: "Not Scheduled",
        SCHEDULED: "Scheduled",
        RUNNING: "Running",
        PAUSED: "Paused",
        SENT: "Complete",
        CANCELLED: "Canceled"
      }, i.showFilters = !0, i.models = {}, i.models.mailingsLoaded = !1, i.mailingFilters =
      {status: {}, creator: "all"}, i.filteredMailings = [], i.mailingFilters.status[i.constants.DRAFT] =
        !0, i.mailingFilters.status[i.constants.SCHEDULED] = !0, i.mailingFilters.status[i.constants.SENT] =
        !0, i.mailingFilters.status[i.constants.RUNNING] = !0, i.mailingFilters.status[i.constants.PAUSED] =
        !0, i.mailingFilters.status[i.constants.CANCELLED] = !0, l.init().then(function () {
        i.mailings = l.getMailings(), i.userId = l.getUserId(), i.models.creators =
          l.getCreators(), i.models.creators.unshift({id: "all", name: "All"});
        var t = s("filter")(i.models.creators, {id: i.userId});
        i.mailingFilters.creator = t.length ? i.userId : "all"
      })["finally"](function () {
        i.models.mailingsLoaded = !0
      }), i.confirmDeleteMailing = function (t) {
        confirm("Are you sure you wish to delete the mailing:\n" + t.name) && i.deleteMailing(t)
      }, i.deleteMailing = function (i) {
        return l.deleteMailing(i)
      }, i.cancelMailing = function (i) {
        return l.cancelMailing(i)
      }, i.duplicateMailing = function (i) {
        return l.duplicateMailing(i)
      }
    }
  ], e = [
    "$scope",
    "$q",
    "MailingDetailFactory",
    "NotificationFactory",
    "MailingHelperFactory",
    "WizardStepFactory",
    "FormValidationFactory",
    function (i, t, e, n, a, r, s) {
      var l = this;
      this.mailing = e.getCurrentMailing(), this.groups = a.getMailingGroups(), this.categories =
        a.getMailingCategories();
      var o = [];
      r.deinit();
      var c = e.init().then(function () {
        l.mailing = e.getCurrentMailing(), l.fromSearch = e.isCreatedFromSearch(), l.contactsCount =
          e.getContactsCount(), angular.isUndefined(l.mailing.dedupe_email) && (l.mailing.dedupe_email = "1")
      }), d = a.initMailingGroups().then(function () {
        l.groups = a.getMailingGroups(), l.categories = a.getMailingCategories()
      });
      o.push(c, d), t.all(o)["catch"](function (i) {
        n.genericError(i)
      })["finally"](function () {
        l.initialised = !0, i.step1form = l.step1form, s.setForm(l.step1form), r.init()
      }), this.isMailingNotScheduled = function () {
        return e.isCurrentMailingNotScheduled()
      }, i.$watch("step1form.$valid", function (i) {
        s.setState(i)
      })
    }
  ], n = [
    "$filter",
    "$q",
    "$scope",
    "$timeout",
    "CampaignMessageFactory",
    "HeaderFactory",
    "MailingHelperFactory",
    "MailingDetailFactory",
    "NotificationFactory",
    "WizardStepFactory",
    "FormValidationFactory",
    "FileUploader",
    "InlineAttachmentFactory",
    function (i, t, e, n, a, r, s, l, o, c, d, u, m) {
      function g(i) {
        var t = p.editorInstance.getSelection(), e = t.getRanges(), n = e[0];
        n.setEnd(n.endContainer, n.endOffset + i)
      }

      function h() {
        p.mailing.header_id || p.headers && p.headers.length > 0 && (p.mailing.header_id = p.headers[0].id)
      }

      function f(i) {
        var t = (new Date).getTime();
        return t + "_" + i
      }

      var p = this;
      this.headersLoaded = !1, this.editFromName = !1, this.selectedMessage = "", this.selectedFilterId =
        null, this.selectedSocialLink = null, this.mailing = l.getCurrentMailing(), this.filters =
        s.getHeaderFilters(), this.headers = r.getHeaders(), this.fromEmails = s.getFromEmails(), this.messages =
        a.getMessages(), this.socialLinkLocations = [], this.inlineAttachments = {}, this.regionsTemplatePath =
        c.getRegionsTemplatePath(), this.editorInstance = {};
      var M, F = [], S = l.init().then(function () {
        p.mailing = l.getCurrentMailing(), M = m.get(l.getCurrentMailing().id).then(function (i) {
          if (!i) {
            return void o.alert("There was a problem retrieving your inline attachments");
          }
          p.inlineAttachments = {};
          for (var t in i) {
            var e = i[t];
            e.uploaded = !0, p.inlineAttachments[e.id] = e
          }
        })["catch"](function (i) {
          console.log("Inline Attachments error: ", i)
        })
      }), v = s.initHeaderFilters().then(function () {
        p.filters = s.getHeaderFilters()
      })["catch"](function () {
        return !0
      }), C = r.init().then(function () {
        p.headers = r.getHeaders(), p.headersLoaded = !0, h()
      }), y = s.initFromEmails().then(function () {
        if (p.fromEmails = s.getFromEmails(), p.fromEmails.length) {
          for (var i in p.fromEmails) {
            var t = p.fromEmails[i];
            if (t.id) {
              p.mailing.from_address = t.label;
              break
            }
          }
        }
      }), A = a.init().then(function () {
        p.messages = a.getMessages()
      }), E = s.initSocialLinks().then(function () {
        var i = s.getSocialLinkLocations();
        for (var t in i) {
          p.socialLinkLocations.push({label: i[t], value: i[t]})
        }
      });
      F.push(S, v, C, y, A, M, E), t.all(F).then(function () {
        p.initHeaderFilter(), p.initFromName(), p.updateSelectedMessage(), p.updateSelectedSocialLink()
      })["catch"](function (i) {
        o.genericError(i)
      })["finally"](function () {
        e.step2form = p.step2form, d.setForm(p.step2form), c.init()
      }), this.updateSelectedMessage = function () {
        this.mailing.message_id || (this.mailing.message_id = 5), this.selectedMessage =
          i("filter")(this.messages, {id: this.mailing.message_id})[0]
      }, this.initHeaderFilter = function () {
        if (i("filter")(this.filters, {id: "all"})[0] || this.filters.unshift({
            id: "all",
            label: "All"
          }), !this.mailing.header_id) {
          var t = i("filter")(this.filters, {label: "ATL"})[0];
          angular.isObject(t) && t.hasOwnProperty("id") && (this.selectedFilterId = t.id)
        }
      }, this.initFromName = function () {
        if (this.mailing.from_name && -1 === this.fromEmails.indexOf(this.mailing.from_address)) {
          var t = i("filter")(this.fromEmails, {label: this.mailing.from_address});
          0 === t.length && this.fromEmails.unshift({label: this.mailing.from_address})
        }
      }, this.cancelFromNameCustomisation = function () {
        this.mailing.from_name = l.getCurrentMailing(!0).from_name, this.editFromName = !1
      }, this.updateSelectedSocialLink = function () {
        p.mailing.social_link || (p.mailing.social_link = p.socialLinkLocations[0].value)
      }, e.inlineAttachmentBeforeUpload = function (i) {
        o.clearAll();
        var t = f(i.file.name);
        p.inlineAttachments[t] = {id: t, uploaded: !1, filename: i.file.name}, i.id =
          t, i.formData.push({simplemail_id: p.mailing.id})
      }, e.inlineAttachmentError = function (i) {
        delete p.inlineAttachments[i.id]
      }, e.inlineAttachmentComplete = function (i, t) {
        if (!t) {
          return o.genericError("There was no response from the server. Please try again"), e.inlineAttachmentError(i), !1;
        }
        if (t.is_error) {
          return o.genericError("There was a problem uploading your attachment.<br/>"
          + t.error_message), e.inlineAttachmentError(i), !1;
        }
        var n = i.id, a = t.values[0];
        return p.inlineAttachments[a.databaseId] = p.inlineAttachments[n], p.inlineAttachments[a.databaseId].id =
          a.databaseId, p.inlineAttachments[a.databaseId].uploaded = !0, p.inlineAttachments[a.databaseId].url =
          a.url, delete p.inlineAttachments[n], o.success("Inline attachment uploaded"), !0
      }, e.inlineAttachmentNotification = function (i) {
        "success" == i.type ? o.success(i.text) : "alert" == i.type ? o.alert(i.text) : o.error(i.text)
      }, e.inlineAttachmentInsert = function (i) {
        var t;
        if (!p.editorInstance) {
          return void o.alert("There does not appear to be an instance of CKEditor available");
        }
        var e = p.editorInstance.getSelection(), a = e.getSelectedText();
        !a || a.length <= 0 ? (t =
          prompt("Inserting inline attachment\n\nPlease enter the text you want as a link:", i.filename))
        && (n(function () {
          p.editorInstance.insertHtml('<a href="' + i.url + '">' + t + "</a>")
        }, 0), g(1)) : (n(function () {
          p.editorInstance.insertHtml('<a href="' + i.url + '">' + a + "</a>")
        }, 0), g(1))
      }, e.inlineAttachmentRemove = function (i, t) {
        t.is_error ? o.alert("Failed to remove attachment. " + t.error_message)
          : (o.success("Attachment removed"), delete p.inlineAttachments[i.id])
      }, e.$watch("step2form.$valid", function (i) {
        d.setState(i)
      })
    }
  ], a = [
    "$scope",
    "$q",
    "MailingHelperFactory",
    "MailingDetailFactory",
    "NotificationFactory",
    "WizardStepFactory",
    function (i, t, e, n, a, r) {
      var s = this;
      this.mailing = n.getCurrentMailing(), this.groups = e.getMailingGroups();
      var l = [], o = n.init().then(function () {
        s.mailing = n.getCurrentMailing()
      }), c = e.initMailingGroups().then(function () {
        s.groups = e.getMailingGroups()
      });
      l.push(o, c), t.all(l)["catch"](function (i) {
        a.genericError(i)
      })["finally"](function () {
        r.init()
      })
    }
  ], r = [
    "$q", "MailingDetailFactory", "NotificationFactory", "WizardStepFactory", function (i, t, e, n) {
      var a = this;
      this.mailing = t.getCurrentMailing();
      var r = [], s = t.init().then(function () {
        a.mailing = t.getCurrentMailing()
      });
      r.push(s), i.all(r)["catch"](function (i) {
        e.genericError(i)
      })["finally"](function () {
        n.init()
      })
    }
  ], s = [
    "$routeParams", "WizardStepFactory", function (i, t) {
      this.currentStep = +i.step, t.setCurrentStep(this.currentStep), this.partial = t.getPartialPath(), this.title =
        t.getStepTitle(), this.isInitialised = function () {
        return t.isInitialised()
      }, this.getMailingStatus = function () {
        return t.getMailingStatus()
      }
    }
  ], l = [
    "MailingDetailFactory", "WizardStepFactory", "NotificationFactory", function (i, t) {
      this.showPrevStepLink = t.prevStepAllowed(), this.showNextStepLink =
        t.nextStepAllowed(), this.showSubmitMassEmailLink = !this.showNextStepLink, this.canUpdate =
        i.canUpdate(), this.isInitialised = function () {
        return t.isInitialised()
      }, this.prevStep = function () {
        return t.isInitialised() ? t.prevStep() : void 0
      }, this.nextStep = function () {
        return t.isInitialised() ? t.nextStep() : void 0
      }, this.saveAndContinueLater = function () {
        return t.isInitialised() ? t.saveAndContinueLater() : void 0
      }, this.submitMassEmail = function () {
        return t.isInitialised() ? (t.deinit(), t.submitMassEmail()["finally"](function () {
          t.init()
        })) : void 0
      }, this.cancel = function () {
        t.cancel()
      }, this.sendTestEmail = function () {
        return t.sendTestEmail()
      }
    }
  ];
  angular.module("simpleMail.app.controllers").controller("MailingsController", t).controller("WizardStepsCtrl",
    s).controller("CreateMailingCtrl", e).controller("ComposeMailingCtrl", n).controller("TestMailingCtrl",
    a).controller("ScheduleAndSendCtrl", r).controller("MailingButtonsCtrl", l)
}();
!function () {
  "use strict";
  var e = [
    "$timeout", "paths", "FileUploader", "CiviApiFactory", "InlineAttachmentFactory", function (e, t, n, o, i) {
      function r(e) {
        e.errors = "", e.fileControlId = "iaFileControl_" + e.attachmentsName, e.uploadProgressInfo =
          "", e.removeAttachment = function (t) {
          confirm("Are you sure you want to remove the attachment:\n" + t.filename)
          && i.remove(t.id).then(function (n) {
            e.notifyRemoveAttachment({attachment: t, response: n.data})
          })["catch"](function (n) {
            e.notifyRemoveAttachment({attachment: t, response: {is_error: 1, error_message: n}})
          })
        }
      }

      function l() {
        return {
          pre: function (e) {
            e.uploader = new n({
              url: "/civicrm/ajax/rest?entity=SimpleMail&action=uploadinlineattachment&json=1&sequential=1",
              autoUpload: !0,
              headers: {"X-Requested-with": "XMLHttpRequest"},
              filters: [
                {
                  name: "filetypes", fn: function (t) {
                  var n = [
                    "image/jpeg",
                    "image/gif",
                    "image/png",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/pdf",
                    "application/vnd.ms-excel",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  ];
                  return e.errors = "", !e.errors && n.indexOf(t.type) < 0 && (e.errors =
                    "it has an invalid file type"), !e.errors && t.size > e.maxSize && (e.error =
                    "it is too large"), !e.errors && t.size <= 0 && (e.error =
                    "it does not appear to be valid"), e.errors ? (e.notify({
                    message: {
                      type: "alert",
                      text: "Sorry, your file could not be uploaded because " + e.errors
                    }
                  }), !1) : !0
                }
                }
              ]
            })
          }, post: function (e) {
            e.uploader.onBeforeUploadItem = function (t) {
              e.uploadBefore({uploadItem: t}), e.uploadProgressInfo = ""
            }, e.uploader.onProgressItem = function (t, n) {
              e.uploadProgressInfo = "Uploading... " + n + "%"
            }, e.uploader.onCompleteItem = function (t, n, o, i) {
              e.uploadComplete({uploadItem: t, response: n, status: o, headers: i}), e.uploadProgressInfo = ""
            }, e.uploader.onErrorItem = function (t, n, o, i) {
              e.uploadError({uploadItem: t, response: n, status: o, headers: i})
            }
          }
        }
      }

      return {
        restrict: "E",
        scope: {
          attachments: "=",
          maxSize: "=",
          attachmentsName: "@",
          uploadBefore: "&onBeforeUpload",
          uploadComplete: "&onComplete",
          uploadError: "&onError",
          insertAttachment: "&onInsertAttachment",
          notifyRemoveAttachment: "&onRemoveAttachment",
          notify: "&onNotify"
        },
        templateUrl: t.TEMPLATES_DIR() + "/inline-attachments.html",
        controller: r,
        compile: l
      }
    }
  ], t = [
    "paths", function (e) {
      function t(e) {
        e.$watch(function () {
          return e.config.required
        }, function (t) {
          e.isRequired =
            -1 !== ["0", "1"].indexOf(t) ? +t ? !0 : !1 : -1 !== ["false", "true"].indexOf(t) ? "true" === t : t
        })
      }

      return {
        restrict: "AE",
        scope: {model: "=", uploader: "=", config: "=", remove: "&onRemove"},
        templateUrl: e.TEMPLATES_DIR() + "/image-uploader.html",
        link: t
      }
    }
  ], n = [
    "paths",
    "$timeout",
    "$rootScope",
    "itemFromCollectionFilter",
    "headersForSelectedFilterFilter",
    function (e, t, n, o, i) {
      function r(e, n) {
        e.selectedIndex = null, e.selectedItem = null, e.filteredItems = [], e.$watchCollection(function () {
          return e.items
        }, function (t) {
          console.log(t), angular.isArray(t) && t.length && (e.selectedFilterId = "all", console.log("Selected item",
            e.selectedItem))
        }), e.$watch(function () {
          return e.selectedIndex
        }, function (t) {
          null !== t && (e.selectedItemId = e.filteredItems[e.selectedIndex].id, console.log("Item ID",
            e.selectedItemId))
        }), e.$watch(function () {
          return e.selectedItemId
        }, function (t) {
          t && e.updateSelection()
        }), e.$watch(function () {
          return e.selectedFilterId
        }, function () {
          console.log("--- Filter changed ---"), e.filterItems(), e.updateSelection()
        }, !0), e.filterItems = function () {
          e.filteredItems = i(e.items, e.selectedFilterId), t(function () {
            e.setWidth()
          }, 200)
        }, e.selectImage = function (t) {
          console.log("Image selected with index", t), e.selectedIndex = t
        }, e.updateSelection = function () {
          var t = o(e.filteredItems, "id", e.selectedItemId);
          e.selectedIndex = t.index
        }, e.resetWidth = function () {
          n.find("ul").width("100%")
        }, e.setWidth = function () {
          var e = n.find("ul").find("img"), t = 0, o = 0;
          if (e.length) {
            for (var i = 0; i < e.length; i++) {
              o = $(e[i]).outerWidth(!0), t += o, console.log(o);
            }
            t += .005 * t
          }
          else {
            t = "100%";
          }
          console.log("Total length", t), n.find("ul").width(t)
        }
      }

      return {
        restrict: "AE",
        scope: {items: "=", selectedFilterId: "=", selectedItemId: "=", itemsLoaded: "="},
        templateUrl: e.TEMPLATES_DIR() + "/simple-image-carousel.html",
        link: r
      }
    }
  ], o = [
    "paths", "$timeout", function () {
      function e(e, t, n, o) {
        if (o) {
          var i = {enterMode: CKEDITOR.ENTER_BR, allowedContent: "em;strong;u;s;a[!href,target];ul;ol;li", toolbar: []};
          switch (n.smCkEditor) {
            case"minimal":
              i.toolbar.push([]);
              break;
            default:
            case"normal":
              i.toolbar.push(["Undo", "Redo"], ["Bold", "Italic", "Strike", "RemoveFormat"],
                ["NumberedList", "BulletedList"], ["Link", "Unlink"], ["Maximize", "Source"], ["About"])
          }
          n.height && (i.height = n.height);
          var r = CKEDITOR.replace(t[0], i);
          r.on("pasteState", function () {
            e.$apply(function () {
              o.$setViewValue(r.getData())
            })
          }), o.$render = function () {
            o.$viewValue ? r.setData(o.$viewValue) : n.placeholder && r.setData(n.placeholder)
          }, e.editorInstance && (e.editorInstance = r)
        }
      }

      function t() {
      }

      return {require: "?ngModel", restrict: "A", scope: {editorInstance: "="}, link: e, controller: t}
    }
  ], i = [
    function () {
      function e(e, t, n) {
        e.$watch(n.emailContent, function (e, n) {
          var o = e ? e : n;
          if (o) {
            var i = t[0], r = null;
            i.contentDocument ? r = i.contentDocument : i.contentWindow && (r =
              i.contentWindow.document), r.open(), r.writeln(o), r.close()
          }
        })
      }

      return {restrict: "A", link: e}
    }
  ], r = [
    "paths", function (e) {
      return {
        restrict: "AE",
        scope: {
          mailing: "=",
          constants: "=statusConstants",
          duplicate: "&onDuplicate",
          "delete": "&onDelete",
          cancel: "&onCancel"
        },
        templateUrl: e.TEMPLATES_DIR() + "/action-buttons.html"
      }
    }
  ], l = [
    "$parse", "$q", function (e, t) {
      var n = function (n, o, i) {
        var r = e(i.smClickOnce);
        n.submitting = !1, o.on("click", function () {
          n.$apply(function () {
            n.submitting || (n.submitting = !0, o.addClass("disabled"), "function" == typeof r
            && t.when(r(n))["finally"](function () {
              n.submitting = !1, o.removeClass("disabled")
            }))
          })
        })
      };
      return {link: n}
    }
  ], a = [
    function () {
      var e = function (e, t, n) {
        t.addClass("disabled"), e.$watch(n.smDisabled, function (e) {
          e === !0 ? t.addClass("disabled") : e === !1 && t.removeClass("disabled")
        })
      };
      return {link: e}
    }
  ], c = [
    function () {
      var e = function (e, t, n) {
        t.append('<div class="loading-panel"></div>'), e.$watch(n.smLoaded, function (e) {
          e === !0 && t.find(".loading-panel").addClass("ng-hide")
        })
      };
      return {link: e}
    }
  ];
  angular.module("simpleMail.directives", []).directive("smImageUploader", t).directive("smImageCarousel",
    n).directive("smCkEditor", o).directive("smEmailPreviewer", i).directive("smMailingActionButtons",
    r).directive("smClickOnce", l).directive("smDisabled", a).directive("smLoaded", c).directive("inlineAttachments", e)
}();
!function () {
  "use strict";
  var r = angular.module("simpleMail.filters", []);
  r.filter("itemFromCollection", [
    function () {
      return function (r, n, t) {
        var e = {item: null, index: null};
        if (angular.isUndefined(r) || angular.isUndefined(t)) {
          return e;
        }
        for (var i = null, u = 0, a = r.length; a > u; u++) {
          i = r[u], angular.isObject(i) && i.hasOwnProperty(n) && i[n]
          === t && (e.item = i, e.index = u);
        }
        return e
      }
    }
  ]), r.filter("filterMailings", [
    "$filter", function (r) {
      return function (n, t) {
        if (!angular.isArray(n)) {
          return !1;
        }
        if (!angular.isObject(t)) {
          return n;
        }
        var e = n;
        return t.hasOwnProperty("status") && t.status && (e =
          r("filterMailingsByStatus")(n, t.status)), t.hasOwnProperty("creator") && t.creator && (e =
          r("filterMailingsByCreator")(e, t.creator)), e
      }
    }
  ]), r.filter("filterMailingsByStatus", [
    function () {
      return function (r, n) {
        var t = [];
        angular.forEach(n, function (r, n) {
          r && t.push(n)
        });
        for (var e = null, i = [], u = 0, a = r.length; a > u; u++) {
          e = r[u], e.hasOwnProperty("status") && -1
          !== t.indexOf(e.status) && i.push(e);
        }
        return i
      }
    }
  ]), r.filter("filterMailingsByCreator", [
    function () {
      return function (r, n) {
        if ("all" === n) {
          return r;
        }
        for (var t = [], e = null, i = 0, u = r.length; u > i; i++) {
          e = r[i], e.hasOwnProperty("created_id")
          && e.created_id === n && t.push(e);
        }
        return t
      }
    }
  ]), r.filter("headersForSelectedFilter", [
    "uniqueFilter", function (r) {
      return function (n, t) {
        if ("all" === t) {
          return r(n, "id");
        }
        if (!t) {
          return n;
        }
        var e = [];
        return angular.forEach(n, function (r) {
          r.entity_id === t && (console.log("Value", r), e.push(r))
        }), e
      }
    }
  ]), r.filter("unique", [
    function () {
      return function (r, n) {
        var t = [], e = [];
        return n = n || 0, angular.forEach(r, function (r) {
          var i = null;
          angular.isObject(r) && r.hasOwnProperty(n) ? i = r[n] : angular.isString(r) && (i = r), -1 === t.indexOf(i)
          && (t.push(i), e.push(r))
        }), e
      }
    }
  ]), r.filter("extractColumn", [
    function () {
      return function (r, n) {
        var t = [];
        return angular.isObject(r) && angular.isObject(n) && angular.forEach(r, function (r) {
          var e = {};
          angular.forEach(n, function (n, t) {
            angular.isObject(r) && r.hasOwnProperty(n) && r[n] && (e[t] = r[n])
          }), t.push(e)
        }), t
      }
    }
  ]);
  var n = [
    function () {
      return function (r, n) {
        for (var t = [], e = 0, i = r.length; i > e; e++) {
          -1 === n.indexOf(r[e]) && t.push(r[e]);
        }
        return t
      }
    }
  ];
  angular.module("simpleMail.filters").filter("arrayDiff", n)
}();
!function () {
  "use strict";
  var e = angular.module("simpleMail.services", []), t = [
    "$q",
    "$filter",
    "CiviApiFactory",
    "NotificationFactory",
    function (e, t, n, i) {
      var r = {entities: {MAILING: "SimpleMail"}}, a = [], o = null, c = [], s = function () {
        var t = e.defer();
        return h().then(m).then(function () {
          t.resolve()
        })["catch"](function (e) {
          t.reject(e), $log.error("Failed to initialise mailings", e)
        }), t.promise
      }, u = function (t) {
        var o = e.defer(), c = a.indexOf(t), s = i.loading("Deleting mailing...");
        return -1 !== c ? n.remove(r.entities.MAILING, t).then(function () {
          a.splice(c, 1), o.resolve()
        })["catch"](function (e) {
          o.reject(e)
        }) : o.reject("Mailing to be deleted was not found in the list of all mailings"), o.promise.then(function () {
          i.success("Mailing deleted")
        })["catch"](function (t) {
          return i.error("Failed to delete the mailing", t), $log.error("Failed to delete the mailing:", t), e.reject()
        })["finally"](function () {
          i.clear(s)
        })
      }, l = function (t) {
        var o = e.defer(), c = a.indexOf(t), s = i.loading("Cancelling mailing...");
        return -1 !== c ? n.post(r.entities.MAILING, t, "cancelmassemail").then(function () {
          t.status = "Canceled", o.resolve()
        })["catch"](function (e) {
          o.reject(e)
        }) : o.reject("Mailing to be cancelled was not found in the list of all mailings"), o.promise.then(function () {
          i.success("Mailing cancelled")
        })["catch"](function (e) {
          i.error("Failed to cancel the mailing", e), $log.error("Failed to cancel the mailing:", e)
        })["finally"](function () {
          i.clear(s)
        })
      }, f = function (t) {
        var o = e.defer(), c = a.indexOf(t), s = i.loading("Duplicating mailing...");
        return -1 !== c ? n.post(r.entities.MAILING, t, "duplicatemassemail").then(function (e) {
          return n.get(r.entities.MAILING, {id: e.data.values[0].id})
        }).then(function (e) {
          a.push(e.data.values[0]), o.resolve()
        })["catch"](function (e) {
          o.reject(e)
        })
          : o.reject("Mailing to be duplicated was not found in the list of all mailings"), o.promise.then(function () {
          i.success("Mailing duplicated")
        })["catch"](function (t) {
          return i.error("Failed to duplicate the mailing",
            t.data.error_message), $log.error("Failed to duplicate the mailing:", t), e.reject()
        })["finally"](function () {
          i.clear(s)
        })
      }, d = function () {
        return a
      }, g = function () {
        return o
      }, p = function () {
        return c
      }, h = function () {
        return n.get(r.entities.MAILING, {}, {error: "Failed to retrieve mailings"}).then(function (e) {
          a = e.data.values, o = e.data.userId
        }).then(v)["catch"](function (e) {
          i.error(e.data && e.data.error_message ? e.data.error_message : e)
        })
      }, m = function () {
        c = t("extractColumn")(a, {id: "created_id", name: "sort_name"}), c = t("unique")(c, "id")
      }, v = function () {
        return n.post(r.entities.MAILING, {}, "clearsearchcontacts")["catch"](function () {
          return !0
        })
      };
      return {
        init: s,
        deleteMailing: u,
        cancelMailing: l,
        duplicateMailing: f,
        getMailings: d,
        getUserId: g,
        getCreators: p
      }
    }
  ], n = [
    "$location",
    "$log",
    "$q",
    "CiviApiFactory",
    "MailingDetailFactory",
    "NotificationFactory",
    "paths",
    "FormValidationFactory",
    function (e, t, n, i, r, a, o, c) {
      var s = {
        steps: {FIRST: 1, LAST: 4},
        paths: {WIZARD_ROOT: "/mailings"}
      }, u = s.steps.FIRST, l = !1, f = function () {
        return l
      }, d = function () {
        l = !0
      }, g = function () {
        l = !1
      }, p = function () {
        return E() < s.steps.LAST
      }, h = function () {
        return E() > s.steps.FIRST
      }, m = function () {
        return p() ? c.isValid() ? O(u + 1) : (c.doValidation(), n.reject("Next step not allowed"))
          : n.reject("Next step now allowed!")
      }, v = function () {
        return h() ? O(u - 1) : n.reject("Prev step not allowed!")
      }, y = function () {
        return a.clearPersistentNotifications(), r.saveProgress().then(function () {
          r.resetCurrentMailing(), F()
        })
      }, M = function () {
        return a.clearPersistentNotifications(), r.submitMassEmail().then(function () {
          F()
        })
      }, I = function () {
        return r.sendTestEmail()
      }, _ = function () {
        r.resetCurrentMailing(), F()
      }, N = function () {
        return o.PARTIALS_DIR() + "/wizard/steps/step-" + E() + ".html"
      }, S = function () {
        return o.TEMPLATES_DIR() + "/wave-regions.html"
      }, C = function () {
        var e;
        switch (u) {
          case 1:
            e = "Step 1: Create Email";
            break;
          case 2:
            e = "Step 2: Compose Email";
            break;
          case 3:
            e = "Step 3: Preview and Test";
            break;
          case 4:
            e = "Step 4: Schedule and Send"
        }
        return e
      }, E = function () {
        return u
      }, A = function () {
        return r.getCurrentMailingStatus()
      }, T = function (e) {
        u = e
      }, O = function (e) {
        return a.clearPersistentNotifications(), r.saveProgress().then(function (t) {
          return L(e), t
        })
      }, L = function (t) {
        a.clearPersistentNotifications(), T(t), l = !1, e.path(R(t))
      }, F = function () {
        a.clearPersistentNotifications(), e.path(s.paths.WIZARD_ROOT)
      }, R = function (e) {
        return s.paths.WIZARD_ROOT + "/" + r.getCurrentMailing().id + "/steps/" + e
      };
      return {
        init: d,
        deinit: g,
        isInitialised: f,
        getCurrentStep: E,
        getRegionsTemplatePath: S,
        setCurrentStep: T,
        nextStep: m,
        prevStep: v,
        nextStepAllowed: p,
        prevStepAllowed: h,
        cancel: _,
        saveAndContinueLater: y,
        sendTestEmail: I,
        submitMassEmail: M,
        getPartialPath: N,
        getMailingStatus: A,
        getStepTitle: C
      }
    }
  ], i = [
    "$q", "CiviApiFactory", function (e, t) {
      var n = [], i = !1, r = function () {
        var r = e.defer();
        return i ? r.resolve() : t.get("SimpleMailHeader", {withFilters: !0}, {cached: !0}).then(function (e) {
          n = e.data.values, i = !0, r.resolve()
        })["catch"](function () {
          r.reject()
        }), r.promise
      }, a = function () {
        return n
      };
      return {init: r, getHeaders: a}
    }
  ], r = [
    "$q", "CiviApiFactory", function (e, t) {
      var n = {entities: {MESSAGE: "SimpleMailMessage"}}, i = [], r = !1, a = function () {
        var a = e.defer();
        return r ? a.resolve() : t.get(n.entities.MESSAGE, {is_active: 1}, {cached: !0}).then(function (e) {
          i = e.data.values, r = !0, a.resolve()
        })["catch"](function () {
          a.reject()
        }), a.promise
      }, o = function () {
        return i
      };
      return {init: a, getMessages: o}
    }
  ], a = [
    "$filter", "$q", "CiviApiFactory", function (e, t, n) {
      var i = {
        entities: {
          OPTION_GROUP: "OptionGroup",
          OPTION_VALUE: "OptionValue",
          MAILING_GROUP: "Group",
          MAILING_CATEGORY: "Group"
        }
      }, r = [], a = [], o = [], c = [], s = !1, u = !1, l = !1, f = [], d = [], g = [
        "email_social_facebook_links",
        "email_social_twitter_links"
      ], p = function () {
        var o = t.defer();
        return s ? o.resolve() : n.get(i.entities.MAILING_GROUP).then(function (t) {
          console.log("mailgroups response", t);
          var n = e("filter")(t.data.values, {is_hidden: 0});
          angular.forEach(n, function (e) {
            if (e.group_type) {
              var t = !1, n = !1;
              -1 !== e.group_type.indexOf("2") && (t = !0), -1 !== e.group_type.indexOf("3") && (n = !0), t && (n
                ? a.push(e) : r.push(e))
            }
          }), s = !0, o.resolve()
        })["catch"](function (e) {
          o.reject(e)
        }), o.promise
      }, h = function () {
        var e = t.defer();
        return u ? e.resolve() : n.getValue(i.entities.OPTION_GROUP, {name: "from_email_address", "return": "id"},
          {cached: !0}).then(function (e) {
          return +e.data.result
        }).then(function (t) {
          return n.get("OptionValue", {option_group_id: t, is_active: 1}, {cached: !0}).then(function (t) {
            o = t.data.values, u = !0, e.resolve()
          })
        })["catch"](function () {
          e.reject()
        }), e.promise
      }, m = function () {
        var r = t.defer();
        return l ? r.resolve() : n.getValue(i.entities.OPTION_GROUP, {name: "sm_header_filter_options", "return": "id"},
          {cached: !0}).then(function (e) {
          return +e.data.result
        }).then(function (t) {
          return n.get(i.entities.OPTION_VALUE, {option_group_id: t, is_active: "1"}, {cached: !0}).then(function (t) {
            c = e("orderBy")(t.data.values, "label"), l = !0, r.resolve()
          })
        })["catch"](function (e) {
          r.reject(e)
        }), r.promise
      }, v = function () {
        var e = t.defer(), r = [];
        for (var a in g) {
          var o = t.defer(), c = g[a];
          !function (e, t) {
            n.getValue(i.entities.OPTION_GROUP, {name: c, "return": "id"}, {cached: !0}).then(function (e) {
              return e.data.result
            }).then(function (r) {
              return n.get(i.entities.OPTION_VALUE, {option_group_id: r, is_active: 1},
                {cached: !0}).then(function (n) {
                d[e] = n.data.values, t.resolve()
              })
            })["catch"](function (e) {
              t.reject(e)
            })
          }(c, o), r.push(o.promise)
        }
        return t.all(r).then(function () {
          e.resolve()
        }), e.promise
      }, y = function () {
        return r
      }, M = function () {
        return a
      }, I = function () {
        return o
      }, _ = function () {
        return c
      }, N = function () {
        return d
      }, S = function () {
        if (f.length <= 0) {
          var e = g[0];
          for (var t in d[e]) {
            var n = d[e][t];
            f.push(n.label)
          }
        }
        return f
      };
      return {
        initMailingGroups: p,
        initFromEmails: h,
        initHeaderFilters: m,
        initSocialLinks: v,
        getMailingCategories: M,
        getMailingGroups: y,
        getFromEmails: I,
        getHeaderFilters: _,
        getSocialLinks: N,
        getSocialLinkLocations: S
      }
    }
  ], o = [
    "$log", "$q", "$routeParams", "CiviApiFactory", "NotificationFactory", function (e, t, n, i, r) {
      var a, o, c = {
        entities: {MAILING: "SimpleMail"},
        statuses: {
          NOT_SCHEDULED: "Not Scheduled",
          SCHEDULED: "Scheduled",
          RUNNING: "Running",
          COMPLETE: "Complete",
          CANCELLED: "Cancelled"
        }
      }, s = {}, u = {}, l = c.statuses.NOT_SCHEDULED, f = !1, d = function () {
        var e = t.defer();
        return g() ? e.resolve() : F().then(function () {
          f = !0, e.resolve()
        })["catch"](function (t) {
          e.reject(t)
        }), e.promise
      }, g = function () {
        return f && p() && h(), f
      }, p = function () {
        return m() && m() != P()
      }, h = function () {
        T({}, !0), o = 0, f = !1
      }, m = function () {
        return +A().id
      }, v = function () {
        var e = A();
        return !!e.crm_mailing_id && !!e.scheduled_date
      }, y = function () {
        return d().then(function () {
          if (M()) {
            r.loading("Saving...");
            var e = A();
            return e.scheduled_date && _() && (e.scheduled_date = "", e.send_immediately && (e.send_immediately =
              !1)), i.create(c.entities.MAILING, e).then(function (e) {
              return e.data.values && 0 !== e.data.values.length ? i.get(c.entities.MAILING, {id: e.data.values[0].id})
                : t.reject("API responded with no value. Please refresh the page and try again.")
            }).then(function (e) {
              return e.data.values && 0 !== e.data.values.length ? (T(e.data.values[0],
                !0), void r.success("Mailing saved"))
                : t.reject("Saved mailing cannot be found. Please refresh the page and try again.")
            })["catch"](function (e) {
              return r.clearByType(r.constants.notificationTypes.LOADING), r.error("Failed to save mailing",
                e), t.reject(e)
            })
          }
        })
      }, M = function () {
        return !angular.equals(A(), A(!0))
      }, I = function () {
        return l
      }, _ = function () {
        return I() === c.statuses.NOT_SCHEDULED
      }, N = function () {
        return r.loading("Submitting the mailing for mass emailing..."), s.send_immediately && (s.scheduled_date =
          Date.create().format("{yyyy}-{{MM}}-{{dd}} {{HH}}:{{mm}}:{{ss}}")), i.post(c.entities.MAILING, A(),
          "submitmassemail").then(function () {
          r.success("Mailing submitted for mass emailing")
        })["catch"](function (e) {
          return r.clearByType(r.constants.notificationTypes.LOADING), r.error("Failed to save mailing", e), t.reject(e)
        })
      }, S = function () {
        var e = A();
        return r.info("Sending test email"), i.post("SimpleMail",
          {crmMailingId: e.crm_mailing_id, groupId: e.testRecipientGroupId, emails: e.testRecipientEmails},
          "sendtestemail").then(function () {
          r.success("Test email sent")
        })["catch"](function (e) {
          var t = e.data && e.data.error_message ? e.data.error_message : "";
          r.error("Failed to send test email", t)
        })
      }, C = function () {
        return a
      }, E = function () {
        return o
      }, A = function (e) {
        return e ? u : s
      }, T = function (e, t) {
        s = e, t && (u = angular.copy(e)), R()
      }, O = function (e) {
        a = e
      }, L = function () {
        return "new" === P()
      }, F = function () {
        var e = t.defer();
        return L() ? i.post("SimpleMail", A(), "iscreatedfromsearch").then(function (t) {
          var n = t.data.values[0].answer;
          O(n), n ? i.post("SimpleMail", A(), "getsearchcontacts").then(function (t) {
            o = t.data.contactCount, e.resolve()
          }) : e.resolve()
        }) : i.get(c.entities.MAILING, {id: P()}).then(function (n) {
          if (0 === n.data.values.length) {
            return t.reject("Mailing not found!");
          }
          T(n.data.values[0], !0);
          var i = n.data.values[0].hidden_recipient_group_entity_ids.length ? !0 : !1;
          O(i), n.data.contactsCount && (o = n.data.contactsCount), e.resolve()
        })["catch"](function (t) {
          e.reject(t)
        }), e.promise
      }, R = function () {
        switch (A().status) {
          case"Scheduled":
            l = c.statuses.SCHEDULED;
            break;
          case"Running":
            l = c.statuses.RUNNING;
            break;
          case"Complete":
            l = c.statuses.COMPLETE;
            break;
          case"Canceled":
            l = c.statuses.CANCELLED;
            break;
          case"Not Scheduled":
          default:
            l = c.statuses.NOT_SCHEDULED
        }
      }, P = function () {
        return n.mailingId
      };
      return {
        canUpdate: v,
        resetCurrentMailing: h,
        init: d,
        saveProgress: y,
        sendTestEmail: S,
        submitMassEmail: N,
        getCurrentMailing: A,
        setCurrentMailing: T,
        getContactsCount: E,
        isInitialised: g,
        isCreatedFromSearch: C,
        isCurrentMailingDirty: M,
        isCurrentMailingNotScheduled: _,
        getCurrentMailingStatus: I
      }
    }
  ], c = [
    "$q", "CiviApiFactory", function (e, t) {
      var n = {entities: {INLINE_ATTACHMENT: "SimpleMailInlineAttachment"}};
      return {
        get: function (i) {
          var r = e.defer(), a = {id: i};
          return t.post(n.entities.INLINE_ATTACHMENT, a, "getall").then(function (e) {
            e && e.data && e.data.values || r.reject("Error retrieving attachments"), r.resolve(e.data.values)
          })["catch"](function (e) {
            r.reject(e)
          }), r.promise
        }, remove: function (e) {
          var i = {id: e};
          return t.post(n.entities.INLINE_ATTACHMENT, i, "remove")
        }
      }
    }
  ], s = [
    "$log", function (e) {
      var t = {
        notificationTypes: {
          SUCCESS: "success",
          ERROR: "error",
          INFO: "info",
          ALERT: "alert",
          LOADING: "crm-msg-loading"
        }
      }, n = !0, i = !0, r = {}, a = function (e, n) {
        return h(e, n, t.notificationTypes.ALERT)
      }, o = function (e, n) {
        return h(e, n, t.notificationTypes.SUCCESS, {expires: 2e3})
      }, c = function (e, n) {
        return h(e, n, t.notificationTypes.INFO)
      }, s = function (e, n) {
        return e = e || "Oops! Something went wrong.", n = n || "Please refresh the page and try again.", h(e, n,
          t.notificationTypes.ERROR)
      }, u = function (e, n) {
        return h(e, n, t.notificationTypes.LOADING, {expires: 0})
      }, l = function (e) {
        var n = "Oops! Something went wrong", i = e || "Please refresh the page";
        return h(n, i, t.notificationTypes.ERROR)
      }, f = function (e) {
        angular.forEach(r, function (t) {
          var n = t.indexOf(e);
          -1 !== n && (t.splice(n, 1), e.close())
        })
      }, d = function () {
        p(t.notificationTypes.LOADING), p(t.notificationTypes.ERROR)
      }, g = function () {
        angular.forEach(r, function (e, t) {
          p(t)
        })
      }, p = function (e) {
        r[e] && (angular.forEach(r[e], function (e) {
          e.close()
        }), r[e].length = 0)
      }, h = function (t, r, a, o) {
        if (n) {
          r = r || "", o = o || {}, i && e.debug("(" + a.toUpperCase() + ") " + t, r);
          var c = CRM.alert(r, t, a, o);
          return m(c, a), c
        }
      }, m = function (e, t) {
        r[t] = r[t] || [], r[t].push(e)
      };
      return {
        alert: a,
        clear: f,
        clearAll: g,
        clearByType: p,
        clearPersistentNotifications: d,
        success: o,
        info: c,
        error: s,
        loading: u,
        genericError: l,
        constants: t
      }
    }
  ], u = [
    function () {
      var e = !1, t = null, n = function (t) {
        e = t
      }, i = function () {
        return e
      }, r = function (e) {
        t = e, t && t.$setPristine(), n(!1)
      }, a = function () {
        t && (t.$setDirty(), angular.element(t).addClass("ng-dirty"))
      };
      return {setState: n, isValid: i, setForm: r, doValidation: a}
    }
  ];
  e.factory("loggingServices", function () {
    var e = !0;
    return {
      createLog: function (t, n) {
        e && (n ? console.log(t + ":", n) : console.log(t))
      }
    }
  });
  var l = [
    "$http", "$q", "$log", "NotificationFactory", function (e, t, n, i) {
      var r = function (e, t, n) {
        return u(e, t, "get", n)
      }, a = function (e, t, n) {
        return u(e, t, "getValue", n)
      }, o = function (e, t, n) {
        return u(e, t, "create", n)
      }, c = function (e, t, n) {
        return u(e, t, "create", n)
      }, s = function (e, t, n) {
        return u(e, t, "delete", n)
      }, u = function (e, r, a, o) {
        r = r || {}, o = o || {};
        var c = o.success || null, s = o.error || null, u = o.progress || null, f = o.cached || !1;
        if (u) {
          var d = i.loading(u);
        }
        return l(e, r, a, f).then(function (r) {
          return r.data.is_error ? t.reject(r) : (u && i.clear(d), c && i.success(c), n.info("Successfully performed '"
          + a + "' on '" + e + "' with response:", r), r)
        })["catch"](function (r) {
          var o = s || "";
          return r.data.error_message && (o && (o += ": "), o += r.data.error_message), s
          && i.error(o), n.error("Failed to perform " + a + " on " + e + " with response:", r), t.reject(o)
        })
      }, l = function (t, n, i, r) {
        n = n || {}, n.entity = t, n.action = i, n.sequential = 1, n.json = 1, n.rowCount = 0;
        var a = jQuery.param(n), o = CRM.API_URL
          + "/civicrm/ajax/rest", c = {"Content-Type": "application/x-www-form-urlencoded"};
        return e.post(o, a, {headers: c, cached: r})
      };
      return {get: r, getValue: a, create: o, update: c, remove: s, post: u}
    }
  ];
  angular.module("simpleMail.services").factory("MailingsListingFactory", t).factory("MailingDetailFactory",
    o).factory("HeaderFactory", i).factory("CampaignMessageFactory", r).factory("MailingHelperFactory",
    a).factory("WizardStepFactory", n).factory("NotificationFactory", s).factory("CiviApiFactory",
    l).factory("FormValidationFactory", u).factory("InlineAttachmentFactory", c)
}();