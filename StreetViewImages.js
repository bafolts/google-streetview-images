
function StreetViewImages(options) {

    if (!options || !options.apiKey) {
        throw new Error("Must provide an google api key");
    }

    if (!options || !options.addresses || options.addresses.length < 2) {
        throw new Error("Must provide at least two addresses");
    }

    var m_sPanoClient = new google.maps.StreetViewService();
    var m_sDirectionsService = new google.maps.DirectionsService();
    var m_sApiKey = options.apiKey;
    var m_aAddresses = options.addresses;
    var m_fOnPanoLoaded = options.onPanoLoaded || function(){};
    var m_fOnComplete = options.onComplete || function(){};
    var m_aVertices = [];
    var m_iSensitivity = 50;
    var m_iSpeed = 1000;
    var m_iIncrement = 0.012;

    var addressIndex = 0;

    doLeg();

    function doLeg() {
        m_sDirectionsService.route({
            origin: m_aAddresses[addressIndex],
            destination: m_aAddresses[addressIndex + 1],
            travelMode: google.maps.TravelMode.DRIVING
        }, function(result, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                for (var i = 0, length = result.routes[0].legs.length; i < length; i++) {
                    for (var j = 0, lengthJ = result.routes[0].legs[i].steps.length; j < lengthJ; j++) {
                        for (var k = 0, lengthK = result.routes[0].legs[i].steps[j].lat_lngs.length; k < lengthK; k++) {
                            m_aVertices.push(result.routes[0].legs[i].steps[j].lat_lngs[k])
                        }
                    }
                }

                for (i = 1, length = m_aVertices.length; i < length; i++) {
                    if (distanceTo(m_aVertices[i], m_aVertices[i - 1]) < .002) {
                        m_aVertices.splice(i--, 1);
                        length--;
                    }
                }

                addressIndex++;
                if (addressIndex < m_aAddresses.length - 1) {
                    doLeg();
                } else {
                    var smoothedLocations = getSmoothedLocations(m_aVertices);
                    pullPanoImages(smoothedLocations);
                }

            } else {
                throw new Error("Error calculating route " + status);
            }
        });
    }

    function getSmoothedLocations(vertices) {

        var smoothedLocations = [];
        smoothedLocations.push(vertices[0]);

        var distanceAlongSegment = 0;

        for (var i = 1, length = vertices.length; i < length; i++) {

            var from = vertices[i - 1];
            var to = vertices[i];
            var segmentLength = distanceTo(from, to);

            while (distanceAlongSegment + m_iIncrement < segmentLength) {
                distanceAlongSegment += m_iIncrement;
                smoothedLocations.push(tween(from, to, distanceAlongSegment / segmentLength));
            }

            // Preparing for the next iteration. The distanceAlongSegment will be negative here,
            // but it will go positive during the next iteration before we use it again.
            distanceAlongSegment = distanceAlongSegment - segmentLength;
        }

        return smoothedLocations;
    }

    function toRadians(deg) {
        return deg * (Math.PI / 180)
    }

    function bearingTo(ls, ll) {
        var lat1 = toRadians(ls.lat()),
            lat2 = toRadians(ll.lat()),
            dLon = toRadians(ll.lng()) - toRadians(ls.lng());
        return (Math.atan2(Math.sin(dLon) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)) * 180 / Math.PI + 360) % 360
    }

    function distanceTo(ls, ll) {
        var dLat = toRadians(ll.lat() - ls.lat());
        var dLon = toRadians(ll.lng() - ls.lng());
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(ls.lat())) * Math.cos(toRadians(ll.lat())) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371 * c;
    }

    function tween(start, end, progressRatio) {
        var lat = end.lat() * progressRatio + start.lat() * (1 - progressRatio);
        var lon = end.lng() * progressRatio + start.lng() * (1 - progressRatio);
        return new google.maps.LatLng(lat, lon);
    }

    function pullPanoImages(vertices, previousBearing) {
        if (vertices.length) {
            var vertex = vertices.shift();
            m_sPanoClient.getPanoramaByLocation(vertex, m_iSensitivity, function (panoData, status) {
                if (status === "OK") {
                    var bearing = previousBearing;
                    if (vertices.length) {
                        bearing = bearingTo(vertex, vertices[0]);
                    }
                    m_fOnPanoLoaded({
                        panoData: panoData,
                        panoUrl: [
                            "https://maps.googleapis.com/maps/api/streetview?size=640x640",
                            "pano=" + panoData.location.pano,
                            "fov=90",
                            "heading=" + bearing,
                            "pitch=0",
                            "key=" + m_sApiKey
                        ].join("&")
                    });
                    setTimeout(function() {
                        pullPanoImages(vertices, bearing);
                    }, m_iSpeed);
                } else {
                    m_fOnError(new Error(status));
                }
            });
        } else {
            m_fOnComplete();
        }
    }
}

window.StreetViewImages = StreetViewImages;

