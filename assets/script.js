
const aKey = "c1b664eda45a9081ab2d754ff2a4cc53";

// Interactive bits for city stuff
var cityCard = $("#city-card");
var inputForm = $("#city-input");
var cityInput = $("#city");
var citySubmit = $("#city-submit");
var cityHistory = $("#city-history");
var badInputEl = $("#input-error");

// Global variables
var cityHistArr = JSON.parse(localStorage.getItem("cities")) || {};


// ---- Functions ----

function getCityData(cityName) {
  const currURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${aKey}`;
  fetch(currURL)
    .then((response) => {
      // Check if successful, otherwise throw error
      if (!response.ok) {
        throw new Error(`${response.status} - ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      // extract lat & long from that response
      const { lat, lon } = data.coord;
      const oneCallURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=imperial&appid=${aKey}`;
      // Get weather data
      return fetch(oneCallURL);
    })
    .then((response) => {
      // Check if successful, otherwise throw error
      if (!response.ok) {
        throw new Error(`${response.status} - ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      // Extract data
      const currDate = new Date(data.current.dt * 1000);
      let weatherData = {
        date: `${currDate.getMonth() + 1}/${currDate.getDate()}/${currDate.getFullYear()}`,
        temp: data.current.temp,
        humid: data.current.humidity,
        windSpd: data.current.wind_speed,
        uvi: data.current.uvi,
        icon: data.current.weather[0].icon,
        fiveDay: []
      };
      for (let i = 0; i < 5; i++) {
        const dailyObj = {
          date: `${currDate.getMonth() + 1 + i}/${currDate.getDate()}/${currDate.getFullYear()}`,
          icon: data.daily[i].weather[0].icon,
          temp: data.daily[i].temp,
          humid: data.daily[i].humidity
        };
        weatherData.fiveDay.push(dailyObj);
      }
      // Relevant data extracted, add to history & save to localStorage
      cityHistArr[cityName] = weatherData;
      localStorage.setItem("cities", JSON.stringify(cityHistArr));
      // Display information
      showCityData(cityName);
    })
    .catch((error) => {
      // Deal with error
      badInput("Error finding city, try again");
    });
}

// update info on screen
function showCityData(cityName) {
  const curCity = cityHistArr[cityName];
  $("#cur-head").text(`${cityName} ${curCity.date}`);
  $("#cur-icon").attr("src", `https://openweathermap.org/img/wn/${curCity.icon}.png`);
  $("#cur-temp").text(Math.round(curCity.temp));
  $("#cur-hum").text(curCity.humid);
  $("#cur-windsp").text(curCity.windSpd);
  // Set badge color based on UVI
  let uvi = $("#cur-uvindex");
  uvi.text(curCity.uvi);
  if (curCity.uvi < 3) {
    uvi.removeClass("badge-danger badge-warning badge-success");
    uvi.addClass("badge-success");
  } else if (curCity.uvi < 6) {
    uvi.removeClass("badge-danger badge-warning badge-success");
    uvi.addClass("badge-warning");
  } else {
    uvi.removeClass("badge-danger badge-warning badge-success");
    uvi.addClass("badge-danger");
  }
  for (let i = 0; i < 5; i++) {
    const dayInfo = curCity.fiveDay[i];
    const dayCard = $(".five-card").eq(i);
    dayCard.find(".five-date").text(dayInfo.date);
    dayCard.find(".icon").attr("src", `https://openweathermap.org/img/wn/${dayInfo.icon}.png`);
    dayCard.find(".five-temp").text(Math.round(dayInfo.temp.day));
    dayCard.find(".five-hum").text(dayInfo.humid);
  }
}


function badInput(errorText) {
  // Show error alert
  badInputEl.parent().removeClass("d-none");
  badInputEl.parent().addClass("show");
  badInputEl.siblings("p").text(errorText);
}

function citySubmitted(inputted) {
  if (inputted in cityHistArr) {
    // City has already been searched
    showCityData(inputted);
  } else {
    getCityData(inputted);
  }
}


// when the city is inputted
inputForm.submit((event) => {
  event.preventDefault();
  const userInput = cityInput.val();
  // test if user inputted string only contains letters
  if (/^[a-zA-Z .,]+$/.test(userInput)) {
    citySubmitted(userInput.toLowerCase());
  } else {
    badInput("Only letters, spaces, and periods please");
  }
});

// Hide Alert
badInputEl.filter("button").on("click", (event) => {
  event.preventDefault();
  badInputEl.parent().removeClass("show");
  setTimeout(() => {
    badInputEl.parent().addClass("d-none");
  }, 200);
});
