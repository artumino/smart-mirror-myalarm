(function() {
    'use strict';

    function OpenWeatherService($http) {
        var service = {};
        var fs = require('fs');

        service.forecast = null;
        var geoloc = null;
        var apiKey = null;
        var preferedUnit = null;
        var iconJsonLocation = null;

        service.init = function (geoposition, persister) {
            apiKey = persister.getKey("oweather_apikey", "");
            preferedUnit = persister.getKey("oweather_prefered_unit", "metric");
            geoloc = geoposition;
            iconJsonLocation = "js/openweather/icons_" + persister.getKey('language', 'en-US') + ".json";

            if (fs.existsSync(iconJsonLocation)) {
                var data = fs.readFileSync(iconJsonLocation, 'utf8');
                if (data) {
                    service.icons = JSON.parse(data);
                }
                else
                    return console.debug("Error while reading configs: " + err);
            }

            return $http.jsonp('http://api.openweathermap.org/data/2.5/forecast/daily?lat=' + geoposition.coords.latitude + 
                '&lon=' + geoposition.coords.longitude + '&mode=json&units=' + preferedUnit + '&APPID=' + apiKey + '&cnt=5&callback=JSON_CALLBACK').
                then(function (response) {
                    console.debug(response);
                    return service.forecast = response;
                });
        };
        
        service.currentCity = function () {
            if (service.forecast === null) {
                return null;
            }
            return service.forecast.data.city.name + ', ' + service.forecast.data.city.country;
        }

        //Returns the current forecast along with high and low tempratures for the current day 
        service.currentForecast = function() {
            if(service.forecast === null){
                return null;
            }

            service.forecast.data.list[0].getTemperature = function ()
            {
                var currentDate = new Date();

                if (currentDate.getHours() < 11 && currentDate.getHours() > 4)
                    return this.temp.morning;

                if (currentDate.getHours() >= 11 && currentDate.getHours() < 18)
                    return this.temp.day;

                return this.temp.night;
            }
            return service.forecast.data.list[0];
        }

        service.weeklyForecast = function(){
            if(service.forecast === null){
                return null;
            }
            
            service.forecast.data.daily = [];

            // Add human readable info to info
            for (var i = 1; i < service.forecast.data.list.length; i++) {
                service.forecast.data.daily[i] = service.forecast.data.list[i];
                service.forecast.data.daily[i].day = moment.unix(service.forecast.data.daily[i].dt).format('ddd');
            };
            return service.forecast.data.daily;
        }
        
        service.getIconForWeather = function (code)
        {
            var prefix = 'wi wi-';
            var icon = service.icons[code].icon;
            
            // If we are not in the ranges mentioned above, add a day/night prefix.
            if (!(code > 699 && code < 800) && !(code > 899 && code < 1000)) {
                icon = 'day-' + icon;
            }

            return prefix + icon;
        }
        
        service.getDescriptionForWeather = function (code)
        {
            return service.icons[code].label;
        }

        service.refreshWeather = function(){
            return service.init(geoloc);
        }
        
        return service;
    }

    angular.module('SmartMirror')
        .factory('OpenWeatherService', OpenWeatherService);

}());
