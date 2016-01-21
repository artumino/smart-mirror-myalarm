(function () {
    'use strict';
    
    function LocalizationService() {
        var service = {};
        var fs = require('fs');

        service.init = function (locale) {
            service.loadConfig(locale);
        };
        
        service.loadConfig = function (locale) {
            var localePath = "loc/" + locale + ".json";
            if (fs.existsSync(localePath)) {
                var data = fs.readFileSync(localePath, 'utf-8');
                if (data) {
                    service.currentLocale = locale;
                    service.strings = JSON.parse(data);
                    return console.debug("loaded " + locale + " locale!");
                }
                else
                    return console.debug("Error while reading locale file: " + err);
            }
        }
        
        service.getString = function (keyname) {
            if (service.strings) {
                return service.strings[keyname] ? service.strings[keyname] : ("***" + keyname + "***");
            }
            return ("***" + keyname + "***");
        };
        
        return service;
    }
    
    angular.module('SmartMirror')
        .factory('LocalizationService', LocalizationService);

}());