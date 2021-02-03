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
    let economicRequired = ""
    let economicUnrequired = ""
    let otherResponses = ""
    let healthRequired = ""
    let healthUnrequired = ""
    let travelRequired = ""
    let travelUnrequired = ""
    let deaths = ""
    if (!oxCGRTResponse.stringencyData.msg){
        $("#travelRestictionsCard").collapse("show");
        $(".data-required").show();
        $(".no-data-available").addClass("d-none")
        if (dayDelta = 1){
            $(".day-delta").text(dayDelta + " day")
        } else {
            $(".day-delta").text(dayDelta + " days")
        }
        $("#deathsInt").text(oxCGRTResponse.stringencyData.deaths.toLocaleString())
        $("#confirmedInt").text(oxCGRTResponse.stringencyData.confirmed.toLocaleString())
        let policyResponse = oxCGRTResponse.policyActions
        for (i = 0; i < oxCGRTResponse.policyActions.length; i++) {
            policyDetail = oxCGRTResponse.policyActions[i].policy_value_display_field.toLowerCase();
            if (policyResponse[i].policy_type_code.charAt(0) == "E"){
                // handle economy policy response 
                if (policyDetail == "usd value" || policyDetail == "no measures" || policyDetail == "not required"){
                    economicUnrequired += "<p class='mb-0'>" + policyResponse[i].policy_type_display + "</p><p><small> Currently under review. </small></p>";
                } else {
                    economicRequired += "<p class='mb-0'>" + policyResponse[i].policy_type_display + "</p><p><small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></p>";
                }
            } else if (policyResponse[i].policy_type_code.charAt(0) == "H" && policyDetail != "usd value"){
                // handle health policy response 
                if (policyDetail == "no availability" || policyDetail == "no measures" || policyDetail == "not required"){
                    healthUnrequired += "<p class='mb-0'> " + oxCGRTResponse.policyActions[i].policy_type_display + "</p><p><small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></p>";
                } else {
                    healthRequired += "<p class='mb-0'>" + policyResponse[i].policy_type_display + "</p><p><small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></p>";
                }
            } else if (policyResponse[i].policy_type_code.charAt(0) == "C" && policyDetail != "usd value") {
                // handle travel policy response
                if (policyDetail == "no restrictions" || policyDetail == "no measures" || policyDetail == "not required"){
                    travelUnrequired += "<p class='mb-0'> " + oxCGRTResponse.policyActions[i].policy_type_display + "</p><p><small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></p>";
                } else {
                    travelRequired += "<p class='mb-0'>" + policyResponse[i].policy_type_display + "</p><p><small>" + oxCGRTResponse.policyActions[i].policy_value_display_field + "</small></p>";
                }
            }
        }
    } else {
        // no country data available
        $(".data-required").hide();
        $(".no-data-available").removeClass("d-none")
    }
    $("#economic-response-data").html(economicRequired);
    $("#health-required").html(healthRequired);
    $("#travel-required").html(travelRequired);
    $("#economic-required").html(economicRequired);
    if (!travelUnrequired){
        $("#travel-unrequired-container").hide();
    } else {
        $("#travel-unrequired").html(travelUnrequired);
        $("#travel-unrequired-container").show();
    }
    if (!healthUnrequired){
        $("#health-unrequired-container").hide();
    } else {
        $("#health-unrequired").html(healthUnrequired);
        $("#health-unrequired-container").show();
    }
    if (!economicUnrequired){
        $("#economic-unrequired-container").hide();
    } else {
        $("#economic-unrequired").html(economicUnrequired);
        $("#economic-unrequired-container").show();
    }
}