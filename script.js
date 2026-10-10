const $=id=>document.getElementById(id);
const geocodeURL="https://geocoding-api.open-meteo.com/v1/search";
const weatherURL="https://api.open-meteo.com/v1/forecast";
const codes={0:["快晴","☀"],1:["おおむね晴れ","🌤"],2:["一部くもり","⛅"],3:["くもり","☁"],45:["霧","🌫"],48:["霧氷を伴う霧","🌫"],51:["弱い霧雨","🌦"],53:["霧雨","🌦"],55:["強い霧雨","🌧"],56:["弱い着氷性の霧雨","🌧"],57:["強い着氷性の霧雨","🌧"],61:["弱い雨","🌦"],63:["雨","🌧"],65:["強い雨","🌧"],66:["弱い着氷性の雨","🌧"],67:["強い着氷性の雨","🌧"],71:["弱い雪","🌨"],73:["雪","❄️"],75:["大雪","❄️"],77:["雪あられ","🌨"],80:["にわか雨","🌦"],81:["強いにわか雨","🌧"],82:["激しいにわか雨","⛈"],85:["にわか雪","🌨"],86:["強いにわか雪","❄️"],95:["雷雨","⛈"],96:["ひょうを伴う雷雨","⛈"],99:["強いひょうを伴う雷雨","⛈"]};
function weatherInfo(code){return codes[code]||["不明","◌"]}
function dateLabel(date,index){if(index===0)return"今日";return new Date(date+"T12:00:00").toLocaleDateString("ja-JP",{weekday:"short"})}
function localTime(iso){return new Date(iso).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}
async function getJSON(url){const response=await fetch(url);if(!response.ok)throw new Error("データ取得エラー ("+response.status+")");return response.json()}
async function loadWeather(city){
 const button=$("searchButton");button.disabled=true;button.textContent="LOADING…";$("message").textContent="観測データを取得しています…";
 try{
  const geo=await getJSON(geocodeURL+"?name="+encodeURIComponent(city.trim())+"&count=1&language=ja&format=json");
  if(!geo.results||!geo.results.length)throw new Error("都市が見つかりません。英語表記などで試してください。");
  const place=geo.results[0];
  const params=new URLSearchParams({latitude:place.latitude,longitude:place.longitude,current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m",daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",timezone:"auto",forecast_days:"5"});
  const data=await getJSON(weatherURL+"?"+params.toString());
  const c=data.current,info=weatherInfo(c.weather_code);
  $("placeName").textContent=(place.name+(place.admin1?", "+place.admin1:"")+(place.country_code?", "+place.country_code:"")).toUpperCase();
  $("updatedAt").textContent="更新: "+localTime(c.time);
  $("weatherIcon").textContent=info[1];$("temperature").textContent=Math.round(c.temperature_2m);$("description").textContent=info[0];
  $("feelsLike").textContent=Math.round(c.apparent_temperature)+"°C";$("humidity").innerHTML=Math.round(c.relative_humidity_2m)+'<small>%</small>';
  $("wind").innerHTML=Math.round(c.wind_speed_10m)+'<small>km/h</small>';$("pressure").innerHTML=Math.round(c.pressure_msl)+'<small>hPa</small>';$("cloud").innerHTML=Math.round(c.cloud_cover)+'<small>%</small>';
  const now=new Date(c.time).getTime(),sunrise=new Date(data.daily.sunrise[0]).getTime(),sunset=new Date(data.daily.sunset[0]).getTime();
  let progress=sunset>sunrise?Math.max(0,Math.min(100,(now-sunrise)/(sunset-sunrise)*100)):50;
  $("dayMarker").style.left=progress+"%";$("daylightText").textContent=c.is_day?"DAYLIGHT":"NIGHT MODE";
  $("forecast").innerHTML=data.daily.time.map((date,i)=>{const inf=weatherInfo(data.daily.weather_code[i]);return `<article class="day"><div class="day-name">${dateLabel(date,i)}</div><div class="day-icon">${inf[1]}</div><div class="day-desc">${inf[0]}</div><div class="day-temp">${Math.round(data.daily.temperature_2m_max[i])}° <span>/ ${Math.round(data.daily.temperature_2m_min[i])}°</span></div></article>`}).join("");
  $("message").textContent="接続成功：Open-Meteoから最新の気象データを取得しました。";
 }catch(error){$("message").textContent=error.message||"データを取得できませんでした。通信状況を確認してください。"}
 finally{button.disabled=false;button.textContent="SEARCH ↗"}
}
$("searchForm").addEventListener("submit",event=>{event.preventDefault();const city=$("cityInput").value.trim();if(city)loadWeather(city)});
loadWeather("Tokyo");
