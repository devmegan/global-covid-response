$(document).ready(function(){
    countryCode = "GBR"
    countryName = "United Kingdom"
    getOxCGRTData(countryCode, countryName, 1);
    $("#countrySelect").on('change',function(){
        var countryCode=$("#countrySelect").val();
        var countryName=$("#countrySelect option:selected").text();
        getOxCGRTData(countryCode, countryName, 1);
    });
    
    // handle collapsing of response cards
    $(".response-toggle-btn").click(function(){
        let responseID = $(this).attr("id");
        $(`.response-card:not(#${responseID}Card)`).collapse('hide');
        $(`#${responseID}Card`).collapse('show');
    })
});

//function calls country data from oxCGRT API
function getOxCGRTData(countryCode, countryName, dayDelta) {
    var dateToday = new Date();
    var dateYesterday = new Date();
    dateYesterday.setDate(dateToday.getDate() - dayDelta);

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
            if (oxCGRTResponse.policyActions[0].policy_type_code == "NONE" && dayDelta < 14){ 
                dayDelta += 1
                getOxCGRTData(countryCode, countryName, dayDelta);
            } else {
                setResponseData(oxCGRTResponse, dayDelta); 
            }
        }
    };
    xhr.open("GET", url);
    xhr.send();
    $("#countryCode").text(countryName)
}
function setResponseData(oxCGRTResponse, dayDelta) {
    var i; 
    let economicResponses = ""
    let otherResponses = ""
    let healthResponses = ""
    let travelRequired = ""
    let travelUnrequired = ""
    let deaths = ""
    if (!oxCGRTResponse.stringencyData.msg){
        $(".data-required").show();
        $(".no-data-available").addClass("d-none")
        if (dayDelta = 1){
            $(".day-delta").text(dayDelta + " day")
        } else {
            $(".day-delta").text(dayDelta + " days")
        }
        let policyResponse = oxCGRTResponse.policyActions
        for (i = 0; i < oxCGRTResponse.policyActions.length; i++) {
            policyDetail = oxCGRTResponse.policyActions[i].policy_value_display_field.toLowerCase();
            if (policyDetail != "usd value"){
                if (policyResponse[i].policy_type_code.charAt(0) == "E"){
                    economicResponses += "<li>" + policyResponse[i].policy_type_display + ": <small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></li>";
                } else if (policyResponse[i].policy_type_code.charAt(0) == "H"){
                    healthResponses += "<li>" + policyResponse[i].policy_type_display + ": <small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></li>";
                } else if (policyResponse[i].policy_type_code.charAt(0) == "C"){
                    if (policyDetail == "no restrictions" || policyDetail == "no measures" || policyDetail == "not required"){
                        travelUnrequired += "<p class='mb-0'> " + oxCGRTResponse.policyActions[i].policy_type_display + "</p><p><small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></p>";
              
                    } else {
                        travelRequired += "<p class='mb-0'>" + policyResponse[i].policy_type_display + "</p><p><small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></p>";
                    }
                } else {
                    otherResponses += "<li>" + oxCGRTResponse.policyActions[i].policy_type_display + ": <small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></li>";
                }
            }
        }
    } else {
        // no country data available
        $(".data-required").hide();
        $(".no-data-available").removeClass("d-none")
    }
    $("#economic-response-data").html(economicResponses);
    $("#health-response-data").html(healthResponses);
    $("#travel-required").html(travelRequired);
    $("#travel-unrequired").html(travelUnrequired);
    $("#other-response-data").html(otherResponses);
    $("#deathsInt").text(oxCGRTResponse.stringencyData.deaths.toLocaleString())
    $("#confirmedInt").text(oxCGRTResponse.stringencyData.confirmed.toLocaleString())
}