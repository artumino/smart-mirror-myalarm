(function () {
    'use strict';
    
    function PersisterService() {
        var service = {};
        var fs = require('fs');

        service.init = function () {
            service.loadConfig();
        };
        
        service.saveConfig = function () {
            fs.writeFile(CONFIG_FILE_LOCATION, JSON.stringify(service.config, null, 4), function (err) {
                if (err) {
                    return console.debug("Error while saving configs: " + err);
                }
                console.debug("The file was saved!");
            }); 
        }
        
        service.loadConfig = function () {
            if (fs.existsSync(CONFIG_FILE_LOCATION)) {
                var data = fs.readFileSync(CONFIG_FILE_LOCATION, 'utf8');
                if (data) {
                    service.config = JSON.parse(data);
                }
                else
                    return console.debug("Error while reading configs: " + err);
            }
        }
        
        service.getKey = function (keyname, def) {
            if (service.config) {
                return service.config[keyname] ? service.config[keyname] : def;
            }
            return def;
        };
        
        service.setKey = function (keyname, value) {
            if (!service.config) {
                service.config = {};
            }
            service.config[keyname] = value;
            
            service.saveConfig();
        };
        
        return service;
    }
    
    angular.module('SmartMirror')
        .factory('PersisterService', PersisterService);

}());