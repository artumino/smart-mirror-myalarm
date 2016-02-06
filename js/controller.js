(function(angular) {
    'use strict';

    function MirrorCtrl(AnnyangService, GeolocationService, WeatherService, MapService, HueService, $scope, $timeout, $interval) {
        var _this = this;
        
        //Initialize persisters outside the init function
        PersisterService.init();
        LocalizationService.init(PersisterService.getKey("language", "en-US"));

        var DEFAULT_COMMAND_TEXT = LocalizationService.getString("default_homepage_say_label");
        $scope.listening = false;
        $scope.debug = false;
        $scope.compliment = PersisterService.getKey("compliment_message", LocalizationService.getString("default_homepage_compliment"));
        $scope.focus = "default";
        $scope.user = {};
        $scope.interimResult = DEFAULT_COMMAND_TEXT;

        $scope.colors=["#6ed3cf", "#9068be", "#e1e8f0", "#e62739"];

        //Update the time
        function updateTime(){
            $scope.date = new Date();
        }
            

        // Reset the command text
        var restCommand = function(){
          $scope.interimResult = DEFAULT_COMMAND_TEXT;
        }

        _this.init = function () {
            $scope.locale = LocalizationService;

            var tick = $interval(updateTime, 1000);
            updateTime();
            
            var defaultMapLocation = LocalizationService.getString("default_language_location");
            $scope.map = MapService.generateMap(PersisterService.getKey("default_location", defaultMapLocation));
            _this.clearResults();
            restCommand();

            var refreshMirrorData = function() {
            //Get our location and then get the weather for our location
                GeolocationService.getLocation({enableHighAccuracy: true}).then(function(geoposition){
                    console.log("Geoposition", geoposition);
                
                    OpenWeatherService.init(geoposition, PersisterService).then(function () {
                        $scope.forecast = OpenWeatherService;
                        $scope.currentForecast = OpenWeatherService.currentForecast();
                        $scope.weeklyForecast = OpenWeatherService.weeklyForecast();
                        console.log("Current", $scope.currentForecast);
                        console.log("Weekly", $scope.weeklyForecast);
                        //refresh the weather every hour
                        $interval(function () {
                            OpenWeatherService.refreshWeather();
                            $scope.currentForcast = OpenWeatherService.currentForcast();
                            $scope.weeklyForcast = OpenWeatherService.weeklyForcast();
                        }, 3600000);
                    });
                    /*WeatherService.init(geoposition).then(function (){
                        $scope.currentForcast = WeatherService.currentForcast();
                        $scope.weeklyForcast = WeatherService.weeklyForcast();
                        console.log("Current", $scope.currentForcast);
                        console.log("Weekly", $scope.weeklyForcast);
                    //refresh the weather every hour
                    //this doesn't acutually updat the UI yet
                    $interval(function () {
                        WeatherService.refreshWeather();
                        $scope.currentForcast = WeatherService.currentForcast();
                        $scope.weeklyForcast = WeatherService.weeklyForcast();
                    }, 3600000);
                });*/

                var promise = CalendarService.renderAppointments();
                promise.then(function(response) {
                    $scope.calendar = CalendarService.getFutureEvents();
                }, function(error) {
                    console.log(error);
                });
            };

            $timeout(refreshMirrorData(), 3600000);

            //Initiate Hue communication
            //HueService.init();

            var defaultView = function() {
                console.debug("Ok, going to default view...");
                $scope.focus = "default";
            }

            // List commands
            AnnyangService.addCommand(LocalizationService.getString("command_help"), function() {
                console.debug("Here is a list of commands...");
                console.log(AnnyangService.commands);
                $scope.focus = "commands";
            });

            // Go back to default view
            AnnyangService.addCommand(LocalizationService.getString("command_home"), defaultView);

            // Hide everything and "sleep"
            AnnyangService.addCommand(LocalizationService.getString("command_sleep"), function() {
                console.debug("Ok, going to sleep...");
                $scope.focus = "sleep";
            });

            // Go back to default view
            AnnyangService.addCommand(LocalizationService.getString("command_wake"), defaultView);

            // Hide everything and "sleep"
            AnnyangService.addCommand(LocalizationService.getString("command_debug"), function() {
                console.debug("Boop Boop. Showing debug info...");
                $scope.debug = true;
            });

            // Hide everything and "sleep"
            AnnyangService.addCommand(LocalizationService.getString("command_showmap"), function() {
                console.debug("Going on an adventure?");
                $scope.focus = "map";
            });

            // Hide everything and "sleep"
            AnnyangService.addCommand(LocalizationService.getString("command_showmapof"), function(location) {
                console.debug("Getting map of", location);
                $scope.map = MapService.generateMap(location);
                $scope.focus = "map";
            });

            // Zoom in map
            AnnyangService.addCommand(LocalizationService.getString("command_map_zoomin"), function() {
                console.debug("Zoooooooom!!!");
                $scope.map = MapService.zoomIn();
            });

            AnnyangService.addCommand(LocalizationService.getString("command_map_zoomout"), function() {
                console.debug("Moooooooooz!!!");
                $scope.map = MapService.zoomOut();
            });

            AnnyangService.addCommand(LocalizationService.getString("command_map_zoomto"), function(value) {
                console.debug("Moooop!!!", value);
                $scope.map = MapService.zoomTo(value);
            });

            AnnyangService.addCommand(LocalizationService.getString("command_map_zoomreset"), function() {
                console.debug("Zoooommmmmzzz00000!!!");
                $scope.map = MapService.reset();
                $scope.focus = "map";
            });

            // Search images
            AnnyangService.addCommand(LocalizationService.getString("command_showme"), function(term) {
                console.debug("Showing", term);
            });

            // Change name
            AnnyangService.addCommand(LocalizationService.getString("command_setname"), function(name) {
                console.debug("Hi", name, "nice to meet you");
                $scope.user.name = name;
            });

            // Set a reminder
            AnnyangService.addCommand(LocalizationService.getString("command_reminder"), function(task) {
                console.debug("I'll remind you to", task);
            });

            // Clear reminders
            AnnyangService.addCommand(LocalizationService.getString("command_reminder_clear"), function() {
                console.debug("Clearing reminders");
            });

            // Clear log of commands
            AnnyangService.addCommand(LocalizationService.getString("command_results_clear"), function(task) {
                 console.debug("Clearing results");
                 _this.clearResults()
            });

            // Check the time
            AnnyangService.addCommand(LocalizationService.getString("command_time"), function(task) {
                 console.debug("It is", moment().format('h:mm:ss a'));
                 _this.clearResults();
            });

            // Turn lights off
            //AnnyangService.addCommand('(turn) (the) :state (the) light(s) *action', function(state, action) {
            //    HueService.performUpdate(state + " " + action);
            //});

            // Fallback for all commands
            AnnyangService.addCommand('*allSpeech', function(allSpeech) {
                console.debug(allSpeech);
                _this.addResult(allSpeech);
            });

            var resetCommandTimeout;
            //Track when the Annyang is listening to us
            AnnyangService.start(LocalizationService.currentLocale, function(listening){
                $scope.listening = listening;
            }, function(interimResult){
                $scope.interimResult = interimResult;
                $timeout.cancel(resetCommandTimeout);
            }, function(result){
                $scope.interimResult = result[0];
                resetCommandTimeout = $timeout(restCommand, 5000);
            });
        };

        _this.addResult = function(result) {
            _this.results.push({
                content: result,
                date: new Date()
            });
        };

        _this.clearResults = function() {
            _this.results = [];
        };

        _this.init();
    }

    angular.module('SmartMirror')
        .controller('MirrorCtrl', MirrorCtrl);

}(window.angular));
