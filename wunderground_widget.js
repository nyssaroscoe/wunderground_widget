(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["jquery"], function (a0) {
      return (factory(a0));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("jquery"));
  } else {
    factory(root["jQuery"]);
  }
}(this, function (jQuery) {
	
(function ($) {
	$.fn.wunderground = function( options ) {
		
		if (this.length > 1) {
            this.each(function() { $(this).wunderground(options) });
            return this;
        }
 
        // This is the easiest way to have default options.
        var settings = $.extend({
            // These are the defaults.
            station: "",
            api_key: "",
            units: "e" // e,m,h,s
        }, options );
		var element = $(this[0]);
		var current_weather = [];
		var forcast = [];
		var status = "p";
		var processing_current = false;
		var processing_forcast = false;
		var processing_update = false;
		let wunderground = this;
		let units = [];
		
		this.initialize = function() {
			if (settings.station === "" || settings.api_key === "") {
				return false;
			}
			this.setup_units();
			this.createWidget();
			this.update();
		
			return true;
        };
		
		/**********************************
		* Figure out the units of measure *
		**********************************/
		this.setup_units = function() {
			
			// Default to Metric (m)
			units = {
				'alt':'m', 
				'temp':'°C', 
				'press':'mb', 
				'rain':'mm', 
				'snow':'cm', 
				'dist':'km', 
				'vis':'km', 
				'speed':'km', 
				'wave':'mtr',
				'name':'metric',
			};
			
			// Imperial (e)
			if (settings.units == 'e') {
				units['name'] = "imperial";
				units['alt'] = units['wave'] = "ft";
				units['temp'] = "°F";
				units['press'] = "hg";
				units['rain'] = units['snow'] = "in";
				units['dist'] = units['vis'] = "mi";
				units['speed'] = "MPH";
			}
			
			// Metric SI (s)
			if (settings.units == 's') {
				units['name'] = "metric_si";
				units['dist'] = "m";
				units['speed'] = "m/s";
			}
			
			// Hybrid UK (h)
			if (settings.units == 'h') {
				units['name'] = "uk_hybrid";
				units['alt'] = units['wave'] = "ft";
				units['dist'] = "mi";
				units['speed'] = "MPH";
			}
		}
		
		/************************
		* Fetch current weather *
		************************/
		this.fetch_current = function() {
			return new Promise(function(resolve, reject) {
				if (settings.station === "" || settings.api_key === "") {
					reject('missing');
				}
				if (processing_current != true) {
					processing_current = true;
					jQuery.ajax({
						url: "https://api.weather.com/v2/pws/observations/current?stationId="+settings.station+"&format=json&units="+settings.units+"&apiKey="+settings.api_key,
						dataType: 'json',
						success: function (data, textStatus, jqXHR) {
							processing_current = false;
							if (jqXHR.status == 200) {
								wunderground.current_weather = data.observations[0];
								resolve(data.observations[0]);
							} else {
								reject('error');
							}
						},
						error: function (jqXHR, textStatus, errorThrown) {
							processing_current = false;
							/*console.log(jqXHR);
							console.log(textStatus);
							console.log( 'error: ' + errorThrown);*/
							reject('error');
						}
					});
				} else {
					reject('pause');
				}
			});
		}
		
		/************************
		* Fetch weather forcast *
		************************/
		this.fetch_forcast = function() {
			https://api.weather.com/v3/wx/forecast/daily/5day?geocode=42.929333,-72.48275&format=json&units=e&apiKey=3a6a9f551d2247daaa9f551d2257daad
			return new Promise(function(resolve, reject) {
				if (wunderground.current_weather === undefined || wunderground.current_weather['lon'] === "" || wunderground.current_weather['lat'] === "") {
					reject('missing');
				}
				if (processing_forcast != true) {
					processing_forcast = true;
					jQuery.ajax({
						url: "https://api.weather.com/v3/wx/forecast/daily/5day?geocode="+wunderground.current_weather['lat']+","+wunderground.current_weather['lon']+"&format=json&language=en-US&units="+settings.units+"&apiKey="+settings.api_key,
						dataType: 'json',
						success: function (data, textStatus, jqXHR) {
							processing_forcast = false;
							if (jqXHR.status == 200) {
								wunderground.forcast = data;
								resolve(data);
							} else {
								reject('error');
							}
						},
						error: function (jqXHR, textStatus, errorThrown) {
							processing_forcast = false;
							//console.log(jqXHR);
							//console.log(textStatus);
							//console.log( 'error: ' + errorThrown);
							reject('error');
						}
					});
				} else {
					reject('pause');
				}
			});
		}
		
		/**************************************************
		* Create the actual widget and add it to the page *
		**************************************************/
		this.createWidget = function() {
			
			element.html("<div class='wunderground_widget unit-"+settings.units+"'>"+
				"<div class='wunderground_header'>"+
					"<a href='https://www.wunderground.com/dashboard/pws/"+settings.station+"' target='_blank'>Weather Underground</a>"+
				"</div>"+
				"<div class='wunderground_location'>"+
					"<div class='wunderground_location-data'>"+
						"<div class='wunderground_neighborhood'></div>"+
						"<div class='wunderground_stationID'><a href='https://www.wunderground.com/dashboard/pws/"+settings.station+"' target='_blank'>"+settings.station+"</a></div>"+
						"<div class='wunderground_datetime'></div>"+
					"</div>"+
					"<div class='wunderground_refresh'><span class='icon spin'>Refresh</span></div>"+
				"</div>"+
				"<div class='wunderground_dashboard'>"+
					"<div class='wunderground_temp_wrapper'>"+
						"<svg id='wunderground_temp' class='wunderground_temp' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' version='1.1' aria-labelledby='wunderground_temp_title wunderground_temp_description'>"+
							"<title id='wunderground_temp_title'>Tempurature</title>"+
							"<desc id='wunderground_temp_description'>Hi: N/A | Lo: N/A <br/>Current: N/A <br/>Feels Like: N/A</desc>"+
							"<circle cx='50%' cy='50%' r='48%'></circle>"+
							"<text class='wunderground_hilo' x='50%' y='23%' preserveAspectRatio='xMidYMid meet' dominant-baseline='middle'  text-anchor='middle' font-size='10'>"+
								"<tspan class='wunderground_hi'>--</tspan><tspan class='wunderground_degree'>"+units['temp']+"</tspan>"+
								"<tspan dy='-1' class='wunderground_separator'> | </tspan>"+
								"<tspan dy='1' class='wunderground_lo'>--</tspan><tspan class='wunderground_degree'>"+units['temp']+"</tspan>"+
							"</text>"+
							"<text class='wunderground_current' x='50%' y='50%' preserveAspectRatio='xMidYMid meet' dominant-baseline='middle'  text-anchor='middle' font-size='30'>"+
								"<tspan>--</tspan><tspan class='wunderground_degree' font-size='50%' dy='-4'>"+units['temp']+"</tspan>"+
							"</text>"+
							"<text class='wunderground_feels-like' x='50%' y='75%' preserveAspectRatio='xMidYMid meet' dominant-baseline='middle'  text-anchor='middle' font-size='10'>"+
								"<tspan class='wunderground_like-text'>LIKE </tspan>"+
								"<tspan class='wunderground_like'>--</tspan><tspan class='wunderground_degree'>"+units['temp']+"</tspan>"+
							"</text>"+
						"</svg>"+
					"</div>"+
					"<div class='wunderground_icon_wrapper'></div>"+
					"<div class='wunderground_wind_wrapper'>"+
						"<svg id='wunderground_wind' class='wunderground_wind' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' version='1.1' aria-labelledby='wunderground_wind_title wunderground_wind_description'>"+
							"<title id='wunderground_wind_title'>Wind</title>"+
							"<desc id='wunderground_wind_description'>N/A with N/A gusts out of the N/A</desc>"+
							"<circle cx='50' cy='45' r='40%'></circle>"+
							"<polygon class='wunderground_direction' points='50 15,57 0, 43 0' transform='rotate(0,50 45)'/>"+
							"<text x='50%' y='25%' preserveAspectRatio='xMidYMid meet' dominant-baseline='middle'  text-anchor='middle' font-size='10'>N</text>"+
							"<text class='wunderground_speed' x='50%' y='55%' preserveAspectRatio='xMidYMid meet' dominant-baseline='middle'  text-anchor='middle' font-size='30'>--</text>"+
							"<text x='50%' y='95%' preserveAspectRatio='xMidYMid meet' dominant-baseline='middle'  text-anchor='middle' font-size='10'>"+
								"<tspan>Gusts </tspan><tspan class='wunderground_gusts'>--</tspan><tspan class='wunderground_wind-measure'> "+units['speed']+"</tspan>"+
							"</text>"+
						"</svg>"+
					"</div>"+
				"</div>"+
			"</div>");
			
			element.find('.wunderground_refresh').on('click tap', function () {
				wunderground.update();
			});
		}
		
		this.update = function() {
			if (processing_update != true) {
				processing_update = true;
				element.find('.wunderground_refresh').addClass('spin');
				this.fetch_current()
					.then(function(current) {
						//console.log(current);
						var data = current[units['name']];
						var datetime = new Date(current.obsTimeLocal);
						
						element.find('.wunderground_location .wunderground_neighborhood').html(current.neighborhood);
						element.find('.wunderground_location .wunderground_datetime').html(
							datetime.getUTCFullYear()+'-'+(datetime.getUTCMonth()+1)+"-"+datetime.getUTCDate()+" "+
							datetime.getUTCHours()+":"+datetime.getUTCMinutes()
						);
						
						element.find('#wunderground_temp .wunderground_current tspan:not(.wunderground_degree)').html(data.temp);
						element.find('#wunderground_temp circle').css('stroke',wunderground.temp_to_color(data.temp));
						element.find('#wunderground_temp .wunderground_current').css('fill',wunderground.temp_to_color(data.temp));
						element.find('#wunderground_temp .wunderground_feels-like tspan.wunderground_like').html(data.windChill);
						element.find('#wunderground_temp .wunderground_feels-like tspan:not(.wunderground_like-text)').css('fill',wunderground.temp_to_color(data.windChill));
						
						element.find('#wunderground_wind .wunderground_direction').attr('transform','rotate('+current.winddir+',50 45)');
						element.find('#wunderground_wind text.wunderground_speed').html(data.windSpeed);
						element.find('#wunderground_wind tspan.wunderground_gusts').html(data.windGust);
						return wunderground.fetch_forcast();
					})
					.then(function(forcast) {
						//console.log(forcast);
						var dayPart = forcast.daypart[0].iconCode[0] === null ? 1 : 0;
						var current = wunderground.current_weather
						
						if (dayPart == 1) {
							element.find('#wunderground_temp .wunderground_hilo tspan.wunderground_hi').html('--');
							element.find('#wunderground_temp .wunderground_hilo tspan.wunderground_hi, #wunderground_temp .wunderground_hilo tspan.wunderground_hi ~ tspan').css('fill','');
						} else {
							element.find('#wunderground_temp .wunderground_hilo tspan.wunderground_hi').html(forcast.temperatureMax[0]);
							element.find('#wunderground_temp .wunderground_hilo tspan.wunderground_hi, #wunderground_temp .wunderground_hilo tspan.wunderground_hi ~ tspan').css('fill',wunderground.temp_to_color(forcast.temperatureMax[0]));
						}
						element.find('#wunderground_temp .wunderground_hilo tspan.wunderground_lo').html(forcast.temperatureMin[0]);
						element.find('#wunderground_temp .wunderground_hilo tspan.wunderground_lo, #wunderground_temp .wunderground_hilo tspan.wunderground_lo ~ tspan').css('fill',wunderground.temp_to_color(forcast.temperatureMin[0]));
						element.find('.wunderground_icon_wrapper')
							.css("background-image","url(//www.wunderground.com/static/i/c/v4/"+forcast.daypart[0].iconCode[dayPart]+".svg)")
							.html(forcast.daypart[0].wxPhraseLong[dayPart]);
						
						var temp_desc = "Hi: "+(dayPart == 1 ? "N/A" : forcast.temperatureMax[0])+units['temp']+" | "+
							"Lo: "+forcast.temperatureMin[0]+units['temp']+"<br/>"+
							"Current: "+current[units['name']].temp+units['temp']+"<br/>"+
							"Feels Like: "+current[units['name']].windChill+units['temp'];
						element.find('#wunderground_temp desc').html(temp_desc);
						
						var wind_desc = current[units['name']].windSpeed+" "+units['speed']+" with "+
							current[units['name']].windGust+" "+units['speed']+" gusts out of the "+ wunderground.wind_readable(current.winddir);
						
						element.find('#wunderground_wind desc').html(wind_desc);
						
						element.find('.wunderground_dashboard .wunderground_error').remove();
						element.find('.wunderground_refresh .icon').removeClass('spin');
						processing_update = false;
					})
					.catch(function(type) {
						console.log(type);
						wunderground.throwError();
						element.find('.wunderground_refresh .icon').removeClass('spin');
						processing_update = false;
					});
			}
		};
		
		
		/*********************************************
		* Change wind from degrees to human readable *
		*********************************************/
		this.wind_readable = function(degreee) {
			if (degreee <= 11 || degreee >= 348) {
				return "N";
			} else if (degreee <= 33) {
				return "NNE";
			} else if (degreee <= 56) {
				return "NE";
			} else if (degreee <= 78) {
				return "ENE";
			} else if (degreee <= 101) {
				return "E";
			} else if (degreee <= 123) {
				return "ESE";
			} else if (degreee <= 146) {
				return "SE";
			} else if (degreee <= 168) {
				return "SSE";
			} else if (degreee <= 191) {
				return "S";
			} else if (degreee <= 213) {
				return "SSW";
			} else if (degreee <= 236) {
				return "SW";
			} else if (degreee <= 258) {
				return "WSW";
			} else if (degreee <= 281) {
				return "W";
			} else if (degreee <= 303) {
				return "WNW";
			} else if (degreee <= 326) {
				return "NW";
			} else if (degreee <= 348) {
				return "NNW";
			} else {
				return "N/A";
			}
		}
		
		/***********************************
		* Changes Fahrenheit to Centigrade *
		***********************************/
		this.F_to_C = function(degreee) {
			return (degreee - 32) * 5 / 9
		}
		
		/********************************
		* Turn tempurature into a color *
		********************************/
		this.temp_to_color = function(degree) {
			if (settings.units == 'e') {
				degree = wunderground.F_to_C(degree);
			}
			if (degree <= -50) {
				return "#140f1e";
			} else if (degree <= -45) {
				return "#4d026c";
			} else if (degree <= -40) {
				return "#7c007a";
			} else if (degree <= -35) {
				return "#ae00af";
			} else if (degree <= -30) {
				return "#dd07de";
			} else if (degree <= -25) {
				return "#ec04fe";
			} else if (degree <= -20) {
				return "#9101ff";
			} else if (degree <= -15) {
				return "#041cfc";
			} else if (degree <= -10) {
				return "#0572f8";
			} else if (degree <= -5) {
				return "#17c6f1";
			} else if (degree <= 0) {
				return "#00e6ff";
			} else if (degree <= 5) {
				return "#7fff05";
			} else if (degree <= 10) {
				return "#cdfe01";
			} else if (degree <= 15) {
				return "#ffe105";
			} else if (degree <= 20) {
				return "#fdaf00";
			} else if (degree <= 25) {
				return "#fa8301";
			} else if (degree <= 30) {
				return "#ff0000";
			} else if (degree <= 35) {
				return "#ff5c60";
			} else if (degree <= 40) {
				return "#f98888";
			} else if (degree <= 45) {
				return "#feb7b6";
			} else {
				return "#fbeae9";
			}
		}
		
		/*********************
		* Show error to user *
		*********************/
		this.throwError = function() {
			element.find('.wunderground_dashboard').append("<div class='wunderground_error'>"+
				"<p>There was a problem.</p>"+
				"<p>Either the location wasn't found or current conditions are not available.</p>"+
				"<p>Please try again later.</p>"+
			"</div>");
		}
		
        return this.initialize();
 
    };
	
	/***********************************
	* Quick create Wunderground Widgit *
	***********************************/
	$(window).on('load', function () {
		$('.wunderground').each(function () {
			var $widget = $(this);
			$widget.wunderground($widget.data());
		})
	});
}( jQuery ));
}));















