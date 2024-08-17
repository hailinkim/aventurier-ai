'use client'
import React, {useState, useRef, useEffect, useCallback} from 'react'
import {useJsApiLoader} from '@react-google-maps/api'
import { Sema } from 'async-sema';
import { createRoot } from 'react-dom/client';
import PlaceCard from './PlaceCard';

const libs = ["core", "maps", 'places', "marker"]
const Map = React.memo(() => { //props
    const [map, setMap] = useState(null);
    // const [locationBias, setLocationBias] = useState(null);  // State to store the location
    const [isExpanded, setIsExpanded] = useState(false);
    const [style, setStyle] = useState({height: "100vh", width: "100%"});
    const mapRef = useRef(null);
    const [infoWindow, setInfoWindow] = useState(null);
    const {isLoaded} = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries: libs
    })
    const initMap = useCallback(() => {
        if (!isLoaded) {
            console.log("Map not loaded");
            return;
        }
        const mapOptions = {
            center: {lat: 42.361051579216785, lng: -71.05797315441103},
            zoom: 10,
            mapId: "MY_MAP_ID"
        };
        const gMap = new google.maps.Map(mapRef.current, mapOptions);
        setMap(gMap);
        console.log("Map loaded");
    }, [isLoaded, mapRef]);
    
    useEffect(() => {
        if(isLoaded){
            initMap();
            setInfoWindow(new google.maps.InfoWindow());
        }
    }, [isLoaded, initMap]); 

    // useEffect(() => {
    //     console.log("set info window");
    //     setInfoWindow(new google.maps.InfoWindow());
    // }, []);

    function searchPlace(name, service, locationBias=null){
        const request = {
            query: name,
            fields: ['name','geometry', 'formatted_address', 'photos', 'rating'],
            // language: 'ko',
        };
    
        if (locationBias) {
            request.fields.push(...['formatted_address', 'photos', 'rating']);
            request.locationBias = locationBias;
        }
        return new Promise((resolve, reject) => {
            service.findPlaceFromQuery(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(results); // Resolve the promise with the results
                } else {
                    reject({ status, name }); // Reject the promise with the status code and name
                }
            });
        });
    }
    const searchPlaces = async (names, service) => {
        const results = [];
        const sema = new Sema(names.length);
        const promises = names.map(async name => {
            await sema.acquire(); // Acquire a semaphore token
            try {
                const result = await searchPlace(name, service);
                results.push(result[0]); // Push all results into the results array
            } catch (error) {
                console.error(`Error searching for ${name}:`, error);
            } finally {
                sema.release();
            }
        });
    
        await Promise.all(promises);
    
        // Flatten the results and set markers
        results.forEach((place, index) => {
            setMarker(place, index);
        });
        if(map){
            map.setCenter(results[0].geometry.location);
        }
    
        return results;
    };
        
    function createTooltipContent(place) {
        if (!place?.name) {
            return null;
        }
        const container = document.createElement('div');
        const root = createRoot(container); // Create a root

        const address = place?.formatted_address ?? '';
        const rating = place?.rating ?? '';
        const imageUrl = place?.photos?.map(photo => photo.getUrl()) ?? [];
        root.render(
            <PlaceCard
                name={place.name}
                address={address}
                rating={rating}
                imageUrl={imageUrl}
            />
        );
        
        container._rootContainer = root;
        return container;
    }    

    const handleMarkerClick = (place, marker) => {
        setIsExpanded(true); // Update state to indicate an InfoWindow is expanded

        if (infoWindow) {
            console.log("handle marker click")
            // Set the content of the InfoWindow
            const tooltipContent = createTooltipContent(place);
            infoWindow.setContent(tooltipContent);
            // Open the InfoWindow at the marker's position
            infoWindow.open(map, marker);
            infoWindow.addListener('closeclick', () => {
                setIsExpanded(false); // Update state to indicate the InfoWindow is closed
            });
        }
    };

    const setMarker = useCallback((place, index) => {
        if (!map || !place || !place.geometry || !place.geometry.location) {
            console.log("Map or place geometry is not defined");
            return;
        }
        const pin = new google.maps.marker.PinElement({
            glyph: `${index+1}`,
            glyphColor: "white",
          });
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: place.geometry.location,
            map: map,
            gmpClickable: true,
            content: pin.element,
        });
        marker.addListener('click', () => handleMarkerClick(place, marker));
    }, [map]);
    
    useEffect(() => {
        if (isLoaded && map) {
            const service = new google.maps.places.PlacesService(map);
            const names = ['아이소 양지점', '대흥갈비']; // Replace with actual place names
            searchPlaces(names, service).then((places) => {
                console.log("All places searched and markers set:", places);
            });
        }
    }, [isLoaded, map]);

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth <= 600) { // Assumes 600px is your mobile breakpoint
                if(isExpanded){
                    setStyle({height: "80vh", width: "100%"});
                } else{
                    setStyle({height: "50vh", width: "100%"});
                }
            } else {
                setStyle({height: "45vh", width: "100%"});
            }
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [isExpanded]); 

    // let places = {};
    // searchPlaces(name, service).then((results) => {
    //     if (results && results.length > 0) {
    //         places = results[0];    
    //         console.log(places);
    // }});
    // searchPlaces(name, service).then((results) => {
    //     if (results && results.length > 0) {
    //         places = results[0];    
    //         console.log(places);
    //         setMarker(places); // Move setMarker here after places is set
    //         if(map && places.geometry && places.geometry.location) {
    //             map.setCenter(places.geometry.location);
    //         }
    //     }
    // });


    // const setMarker = useCallback((place) => {
    //     if(!map){
    //         return;
    //     }
    //     console.log(place.geometry.location)
    //     const marker = new google.maps.marker.AdvancedMarkerElement({
    //         position: place.geometry.location,
    //         map: map,
    //         gmpClickable: true,
    //     });
    //     marker.addListener('click', () => handleMarkerClick(place, marker));        
    // }, [places]);

   

    // useEffect(() => {
    //     if(!map || !places || places.length === 0){
    //         console.log("Map or places not loaded");
    //         return;
    //     }
    //     console.log(places);
    //     setMarker(places);
    //     map.setCenter(places.geometry.location);
    //     // places.forEach(place => {
    //     //     setMarker(place);
    //     // });
    //     // map.setCenter(props.locationBias);
    // }, [places]);

    return (
        <div>
            {isLoaded?
                <div className= "mb-4" ref={mapRef} style={style}></div>
                : <p>Loading...</p>
            }
        </div>
    )
});
Map.displayName = 'Map';
export default Map;