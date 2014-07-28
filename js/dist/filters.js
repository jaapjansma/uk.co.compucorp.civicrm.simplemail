var filters = angular.module('simpleMail.filters', []);

filters.filter('selectedMessageText', [
  function () {
    return function(messages, messageId) {
      for(var i = 0, end = messages.length; i < end; i++) {
        if (messages[i].id == messageId) return messages[i].text;
      }

      return null;
    };
  }
]);
