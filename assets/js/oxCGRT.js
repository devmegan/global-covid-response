$(document).ready(function(){
    // call GBR data on page load
    countryCode = "GBR";
    countryName = "United Kingdom";
    $("#countryCode").html(countryName);
    getOxCGRTData(countryCode, countryName, 1);

    // set new country code/name values on change
    $("#countrySelect").change(function(){
        var countryCode=$("#countrySelect").val();
        var countryName=$("#countrySelect option:selected").text();
        $("#countryCode").html(countryName);
        getOxCGRTData(countryCode, countryName, 1);
    });
    
    // handle custom collapsing of response cards
    $(".response-toggle-btn").click(function(){
        let responseID = $(this).attr("id");
        $(`.response-card:not(#${responseID}Card)`).collapse('hide');
        $(`#${responseID}Card`).collapse('show');
    })
});

/* calls country covid response data from OxCGRT API */
function getOxCGRTData(countryCode, countryName, dayDelta) {
    // prep dates/url for AJAX call 
    var dateToday = new Date();
    var dateYesterday = new Date();
    dateYesterday.setDate(dateToday.getDate() - dayDelta);

    let year = dateYesterday.getFullYear();
    let month = dateYesterday.getMonth() + 1;
    if (month < 10) {
        month = '0' + month;
    }
    let day = dateYesterday.getDate();
    if (day < 10) {
        day = '0' + day 
    }

    var xhr = new XMLHttpRequest();
    var url = `https://covidtrackerapi.bsg.ox.ac.uk/api/v2/stringency/actions/${countryCode}/${year}-${month}-${day}`;

    /* handle OxCGRT API response */
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // API response succesful
            let oxCGRTResponse = (JSON.parse(this.responseText));
            //console.log(oxCGRTResponse);
            if ((oxCGRTResponse.policyActions[0].policy_type_code == "NONE" || oxCGRTResponse.stringencyData.msg == "Data unavailable") && dayDelta < 30){ 
                // policy/stringency data missing from returned object. Try previous day, for past 30 days. 
                dayDelta += 1;
                getOxCGRTData(countryCode, countryName, dayDelta);
            } else {
                // full data returned, or data is 30 days old (so just use what's available)
                setResponseData(oxCGRTResponse, dayDelta); 
            }
        }
    };

    xhr.open("GET", url);
    xhr.send();
}

/* injects resposne data from API call into the HTML */
function setResponseData(oxCGRTResponse, dayDelta) { 

    let economicRequired = "";
    let economicUnrequired = "";
    let healthRequired = "";
    let healthUnrequired = "";
    let travelRequired = "";
    let travelUnrequired = "";
    let policyResponse = oxCGRTResponse.policyActions;

    if (policyResponse){
        $("#travelRestictionsCard").collapse("show");
        $(".data-required").show();
        $(".stringency-required").show();
        $(".no-data-available").addClass("d-none");

        if (dayDelta == 1){
            $(".day-delta").text(dayDelta + " day");
        } else {
            $(".day-delta").text(dayDelta + " days");
        }

        // handle policy responses into different fields
        for (let i = 0; i < policyResponse.length; i++) {
            let policyDetail = policyResponse[i].policy_value_display_field.toLowerCase();
            let policyLetterCode = policyResponse[i].policy_type_code.charAt(0);
            if (policyLetterCode == "E"){
                // handle economy policy response 
                if (policyDetail == "usd value" || policyDetail == "no measures" || policyDetail == "not required"){
                    economicUnrequired += "<p class='mb-0'>" + policyResponse[i].policy_type_display + "</p><p><small> Currently under review</small></p>";
                } else {
                    economicRequired += "<p class='mb-0'>" + policyResponse[i].policy_type_display + "</p><p><small>" + policyResponse[i].policy_value_display_field + "</small></p>";
                }
            } else if (policyLetterCode == "H" && policyDetail != "usd value"){
                // handle health policy response 
                if (policyDetail == "no availability" || policyDetail == "no measures" || policyDetail == "not required"){
                    healthUnrequired += "<p class='mb-0'> " + policyResponse[i].policy_type_display + "</p><p><small>" + policyResponse[i].policy_value_display_field + "</small></p>";
                } else {
                    healthRequired += "<p class='mb-0'>" + policyResponse[i].policy_type_display + "</p><p><small>" + policyResponse[i].policy_value_display_field + "</small></p>";
                }
            } else if (policyLetterCode == "C" && policyDetail != "usd value") {
                // handle travel policy response
                if (policyDetail == "no restrictions" || policyDetail == "no measures" || policyDetail == "not required"){
                    travelUnrequired += "<p class='mb-0'> " + policyResponse[i].policy_type_display + "</p><p><small>" + policyResponse[i].policy_value_display_field + "</small></p>";
                } else {
                    travelRequired += "<p class='mb-0'>" + policyResponse[i].policy_type_display + "</p><p><small>" + policyResponse[i].policy_value_display_field + "</small></p>";
                }
            }
        }
    } else {
        // no country data available
        $(".data-required").hide();
        $(".no-data-available").removeClass("d-none");
    }
    if (!oxCGRTResponse.stringencyData.msg){
        // inject infection/fatality figures into country data
        $(".stringency-required").show();
        $("#deathsInt").text(oxCGRTResponse.stringencyData.deaths.toLocaleString());
        $("#confirmedInt").text(oxCGRTResponse.stringencyData.confirmed.toLocaleString());
        $("#stringencyFloat").text(oxCGRTResponse.stringencyData.stringency);
    } else {
        // hide country data if not available
        $(".stringency-required").hide();
    }

    // inject responses into response cards
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