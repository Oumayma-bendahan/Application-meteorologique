$(document).ready(function() {

  // Init local storage array and current city holding variable
  var cities = [];
  var currentCity;

  // Init day.js
  var now = dayjs();
  var currentDate = now.format("dddd MMM. D, YYYY");

  // API Query Parameters
  var baseURL = "https://api.openweathermap.org/data/2.5/";
  var APIKey = "f4d6848eb3a488816cecbd2392d8a108";
  //var units = "metric";
  var units = "imperial";
 

  // Replacemenet icon array
  var icons = [
    {
      code: "01",
      day: "fas fa-sun",
      night: "fas fa-moon"
    },
    {
      code: "02",
      day: "fas fa-cloud-sun",
      night: "fas fa-cloud-moon"
    },
    {
      code: "03",
      day: "fas fa-cloud",
      night: "fas fa-cloud"
    },
    {
      code: "04",
      day: "fas fa-cloud-sun",
      night: "fas fa-cloud-moon"
    },
    {
      code: "09",
      day: "fas fa-cloud-rain",
      night: "fas fa-cloud-rain"
    },
    {
      code: "10",
      day: "fas fa-cloud-showers-heavy",
      night: "fas fa-cloud-showers-heavy"
    },
    {
      code: "11",
      day: "fas fa-bolt",
      night: "fas fa-bolt"
    },
    {
      code: "13",
      day: "fas fa-snowflake",
      night: "fas fa-snowflake"
    },
    {
      code: "50",
      day: "fas fa-smog",
      night: "fas fa-smog"
    }
  ];

  // Initialize application
  init();

  function init() {

    // Set current date in page header
    $("#today").text(currentDate);

    // Set initial search history visibility conditions
    if (window.innerWidth >= 578) {
      $("#search-history").addClass("show");
      $("#collapse-search-history").hide();
    }

    // Load cities in local storage back into application
    getSearchHistory();

// Si aucune ville n'est enregistrée, charger les données météorologiques pour Rabat ;
// sinon, obtenir les données météorologiques de la dernière ville recherchée et afficher toutes les villes enregistrées dans l'historique de recherche.
    if (cities.length === 0) {
      getWeather("Rabat");

    } else {
      var lastCityIndex = cities.length - 1;
      getWeather(cities[lastCityIndex]);

      $.each(cities, function(index, city) {
        displayCity(city);
      });
    }
  }

  // Get weather and 5 day forecast data from API
  function getWeather(city) {
    var responseData = {};

    // API Call #1: Get current weather
    $.ajax({
      url: baseURL + "weather",
      method: "GET",
      data: {
        q: city,
        units: units,
        appid: APIKey,
      }
    }).then(function(response) {
      responseData.current = response;

// Enregistrer les coordonnées renvoyées dans la réponse pour demander les données de l'indice UV
      var coordinates = {
        lat: responseData.current.coord.lat,
        lon: responseData.current.coord.lon
      }

      getUVindex(coordinates);
      displayCurrentWeather(responseData);
    });

    // API Call #2: Get 5 day forecast
    $.ajax({
      url: baseURL + "forecast",
      method: "GET",
      data: {
        q: city,
        units: units,
        appid: APIKey
      }
    }).then(function(response) {
      responseData.forecast = response;
      displayForecast(responseData);
    });
  }

  // Obtenir les données de l'indice UV en utilisant les coordonnées renvoyées par l'API dans les données météorologiques actuelles
  function getUVindex(coordinates) {
    $.ajax({
      url: baseURL + "uvi",
      method: "GET",
      data: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        appid: APIKey
      }
    }).then(function(response) {
      displayUV(response);
    }); 
  }

  // Replace icon from API with equivalent icon from Font Awesome
  function replaceIcon(iconCode) {

    // Analyser les données utilisées pour remplacer l'icône
    var number = iconCode.slice(0, 2);
    var dayOrNight = iconCode.slice(2);
    var currentHour = dayjs().hour();

    // Trouver l'icône correspondante
    var index = icons.findIndex(function(icon, index) {
      return icon.code === number;
    });

    // Déterminer s'il faut utiliser la version de jour ou de nuit de l'icône
    if (currentHour >= 06 && currentHour < 18) {
      return icons[index].day;

    } else {
      return icons[index].night;
    }
  }

  // Afficher les prévisions météorologiques actuelles dans l'interface utilisateur (UI)
  function displayCurrentWeather(data) {

    // Display text fields
    $("#city").text(data.current.name);
    $("#conditions").text(data.current.weather[0].main);
    $("#temperature").text(`${((parseInt(data.current.main.temp) - 32) * (5/9)).toFixed(2)}\u00B0C`);    
    $("#humidity").text(`${data.current.main.humidity}%`);
    $("#wind-speed").text(`${data.current.wind.speed} km/h`);

    // Remplacer l'icône fournie par l'API par une icône équivalente de Font Awesome
    var newIcon = replaceIcon(data.current.weather[0].icon);
    $("#icon").removeClass().addClass(`h2 ${newIcon}`);
  }


  // Afficher l'indice UV et la couleur de condition UV dans l'interface utilisateur (UI)
  function displayUV(data) {

    // Display text field
    $("#uv-index").text(data.value);

    // Remove existing color class
    $("#uv-index").removeClass("bg-success bg-warning bg-danger")

   // Déterminer la couleur de condition à appliquer à l'indice UV

    if (data.value < 3) {
      $("#uv-index").addClass("bg-success");

    } else if (data.value >= 3 && data.value < 6) {
      $("#uv-index").addClass("bg-warning");

    } else if (data.value >= 6) {
      $("#uv-index").addClass("bg-danger");

    } else {
      console.log("Invalid UV index value.");
    }
  }

  // Display 5 day forecast in UI
  function displayForecast(data) {

   // Créer la prévision sur 5 jours à partir des blocs de 3 heures renvoyés par l'API
    var forecast = createForecast(data);

    // Afficher les données de prévision sur 5 jours dans l'interface utilisateur (UI)

    $.each(forecast, function(i, day) {

      // Format date for display
      var date = dayjs(day.dt_txt).format("MMM. D");
      var year = dayjs(day.dt_txt).format("YYYY");

      // Replace API supplied icon with equivalent Font Awesome icon
      var iconClasses = replaceIcon(day.weather[0].icon);
      $(`#day-${i + 1}-icon`).removeClass().addClass(`h2 text-info ${iconClasses}`);

      // Display basic text fields
      $(`#day-${i + 1}-date`).text(date);
      $(`#day-${i + 1}-year`).text(year);
      $(`#day-${i + 1}-conditions`).text(day.weather[0].main);
      $(`#day-${i + 1}-temp`).text(`${((parseInt(day.main.temp)- 32) * 5 / 9).toFixed(2)}\u00B0C`);
      $(`#day-${i + 1}-humidity`).text(`${day.main.humidity}% Humidity`);
    });
  }


  // Create 5 day forecast from API data
  function createForecast(data) {
    var forecastData = data.forecast.list;
    var fiveDayForecast = [];

    // Get date and hour of the first result returned by API
    var firstResult = {
      date: dayjs(data.forecast.list[0].dt_txt).date(),
      hour: dayjs(data.forecast.list[0].dt_txt).hour()
    };

    /*
    Étant donné que l'API renvoie les données de prévision sur 5 jours par incréments de 3 heures, 
    il est nécessaire de déterminer quelles prévisions incrémentielles afficher sur la page. 
    Les deux premières conditions "if/else if" contrôlent quelles prévisions afficher lorsque 
    les prévisions de midi (12 PM) ne sont pas disponibles pour le cinquième jour de la prévision sur 5 jours. 
     dernière condition "else", qui couvre également la plus grande partie des situations potentielles, 
     trouve l'heure de midi (12 PM) pour chacun des 5 jours à afficher sur la page.*/

    if (firstResult.hour === 6) {
      for (var i = 10; i < forecastData.length; i += 8) {
        fiveDayForecast.push(forecastData[i]);
      }

      fiveDayForecast.push(forecastData[38]);

    } else if (firstResult.hour <= 09 && firstResult.hour >= 12) {
      for (var i = 9; i < forecastData.length; i +=8) {
        fiveDayForecast.push(forecastData[i]);
      }

      fiveDayForecast.push(forecastData[39]);

    } else {
      var firstNoonIndex = forecastData.findIndex(function(forecast) {
        var isTomorrow = dayjs().isBefore(forecast.dt_txt);
        var hour = dayjs(forecast.dt_txt).hour();

        if (isTomorrow && hour === 12) {
          return true;
        }
      });

      for (var i = firstNoonIndex; i < forecastData.length; i += 8) {
        fiveDayForecast.push(forecastData[i]);
      }
    }
    
    return fiveDayForecast;
  }


  // Add city to search history in UI
  function displayCity(city) {
    var li = $("<li>");
    li.addClass("list-group-item search-item");
    li.text(city);
    $("#search-history").prepend(li);
  }


  // Save city to search history
  function saveToHistory(city) {

    // Get cities saved to local history into cities array
    getSearchHistory();

    // Add the city to the local storage array
    cities.push(city);

    // Set local storage
    setSearchHistory();
  }

  // Get cities saved in local storage
  function getSearchHistory() {
    if (localStorage.getItem("cities") === null) {
      cities = [];
    } else {
      cities = JSON.parse(localStorage.getItem("cities"));
    }
  }

  // Set local storage
  function setSearchHistory() {
    localStorage.setItem("cities", JSON.stringify(cities));
  }

  // Event Listenr: Delete search history
  $("#delete-history").on("click", function() {

    // Remove from UI
    $(".search-item").remove();

    // Remove from local storage array
    cities.splice(0, cities.length - 1);

    // Reset search history
    setSearchHistory();
  });

  // Event Listener: Get weather data for city in search history
  $("#search-history").on("click", ".search-item", function() {
    getWeather($(this).text());
  });

  // Event Listener: Search button
  $("#search-form").on("submit", function(event) {
    event.preventDefault();

    var city = $("#search").val();
    
    // Validate that input is not empty
    if (city === "") {
      console.log("Invalid City");
      return;
    }

    // Get weather data from API
    getWeather(city);

    // Add city to search history in UI
    displayCity(city);

    // Add city to local storage
    saveToHistory(city);

    // Reset input field
    $("#search").val("");
  });
});

// Écouteur d'événement : Redimensionnement de la fenêtre du navigateur
$(window).resize(function() {

  // Pour obtenir la largeur actuelle de la fenêtre du navigateur
  var w = $(window).width();

  //Si la fenêtre est plus large que 578 pixels, développez l'historique de recherche ; 
  //sinon réduisez-le.
  if (w >= 578) {
    $("#search-history").addClass("show");
    $("#collapse-search-history").hide();
  } else {
    $("#search-history").removeClass("show");
    $("#collapse-search-history").show();
  }
});