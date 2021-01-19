$(document).ready(function(){
    $("#countrySelect").on('change',function(){
        var countryCode=$("#countrySelect").val();
        var countryName=$("#countrySelect option:selected").text();
        getOxCGRTData(countryCode, countryName);
    });
});

//function calls country data from oxCGRT API
function getOxCGRTData(countryCode, countryName) {
    var dateToday = new Date();
    var dateYesterday = new Date();
    dateYesterday.setDate(dateToday.getDate() - 1);

    var year = dateYesterday.getFullYear();
    var month = dateYesterday.getMonth() + 1
    if (month < 10) {
        month = '0' + month;
    }
    var day = dateYesterday.getDate();
    if (day < 10) 
        day = '0' + day 
    
    var xhr = new XMLHttpRequest();
    var url = `https://covidtrackerapi.bsg.ox.ac.uk/api/v2/stringency/actions/${countryCode}/${year}-${month}-${day}`;

    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let oxCGRTResponse = (JSON.parse(this.responseText));
            console.log(oxCGRTResponse)
            setResponseData(oxCGRTResponse); 
        }
    };
    xhr.open("GET", url);
    xhr.send();
    $("#countryCode").text(countryName)
}
function setResponseData(oxCGRTResponse) {
    var i; 
    let economicResponses = ""
    let otherResponses = ""
    let healthResponses = ""
    let travelResponses = ""
    let deaths = ""
    if (!oxCGRTResponse.stringencyData.msg){
        $(".data-required").show();
        $(".no-data-available").addClass("d-none")
        for (i = 0; i < oxCGRTResponse.policyActions.length; i++) {
            if (oxCGRTResponse.policyActions[i].policy_type_code.charAt(0) == "E"){
                economicResponses += "<li>" + oxCGRTResponse.policyActions[i].policy_type_display + "</li>";
            } else if (oxCGRTResponse.policyActions[i].policy_type_code.charAt(0) == "H"){
                healthResponses += "<li>" + oxCGRTResponse.policyActions[i].policy_type_display + "</li>";
            } else if (oxCGRTResponse.policyActions[i].policy_type_code.charAt(0) == "C"){
                travelResponses += "<li>" + oxCGRTResponse.policyActions[i].policy_type_display + "</li>";
            } else {
                otherResponses += "<li>" + oxCGRTResponse.policyActions[i].policy_type_display + "</li>";
            }
        }
    } else {
        // no country data available
        $(".data-required").hide();
        $(".no-data-available").removeClass("d-none")
    }
    $("#economic-response-data").html(economicResponses);
    $("#health-response-data").html(economicResponses);
    $("#travel-response-data").html(otherResponses);
    $("#other-response-data").html(otherResponses);
    $("#deathsInt").text(oxCGRTResponse.stringencyData.deaths)
    $("#confirmedInt").text(oxCGRTResponse.stringencyData.confirmed)
}