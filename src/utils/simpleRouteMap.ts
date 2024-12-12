import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import { NominatimResult } from 'nominatim-browser'

let map: L.Map
let startMarker: L.Marker | null = null
let endMarker: L.Marker | null = null
let routingControl: L.Routing.Control
let currentStep: 'start' | 'end' = 'start'
let currentDistance = 0

export function initMap(lat = -34.6037, lng = -58.3816) {
	map = L.map('map').setView([lat, lng], 13)

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '© OpenStreetMap contributors',
	}).addTo(map)

	routingControl = L.Routing.control({
		show: false,
		addWaypoints: false,
		draggableWaypoints: false,
		lineOptions: {
			styles: [{ color: '#FF0000', weight: 6, opacity: 0.7 }],
		},
	}).addTo(map)

	routingControl.on('routesfound', function (e) {
		const routes = e.routes
		currentDistance = routes[0].summary.totalDistance / 1000
		updateDistanceAndCost()
	})

	if ('geolocation' in navigator) {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords
				map.setView([latitude, longitude], 13)
			},
			() => {
				console.log('Using default location (Buenos Aires)')
			}
		)
	}

	map.on('click', handleMapClick)

	return map
}

function updateDistanceAndCost() {
	const distanceInfo = document.getElementById('distanceInfo')
	const costInfo = document.getElementById('costInfo')
	if (distanceInfo) {
		distanceInfo.textContent = `Distancia total: ${currentDistance.toFixed(
			2
		)} km`
	}
	const costPerKm =
		parseFloat(
			(document.getElementById('costPerKm') as HTMLInputElement)?.value
		) || 0
	const totalCost = (currentDistance * costPerKm).toFixed(2)
	if (costInfo) {
		costInfo.textContent = `Costo estimado: $${totalCost}`
	}
}

function handleMapClick(e: L.LeafletMouseEvent) {
	const latlng = e.latlng

	if (currentStep === 'start') {
		if (startMarker) map.removeLayer(startMarker)
		startMarker = L.marker(latlng).addTo(map)
		const startInput = document.getElementById(
			'startLocation'
		) as HTMLInputElement
		if (startInput) {
			startInput.value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`
		}
		if (endMarker) {
			calculateRoute()
		}
		currentStep = 'end'
	} else {
		if (endMarker) map.removeLayer(endMarker)
		endMarker = L.marker(latlng).addTo(map)
		const endInput = document.getElementById('endLocation') as HTMLInputElement
		if (endInput) {
			endInput.value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`
		}
		calculateRoute()
		currentStep = 'start'
	}
}

async function calculateRoute() {
	if (!startMarker || !endMarker) {
		console.log('No se pueden calcular las coordenadas de inicio o fin')
		return
	}

	const startLatLng = startMarker.getLatLng()
	const endLatLng = endMarker.getLatLng()

	routingControl.setWaypoints([
		L.latLng(startLatLng.lat, startLatLng.lng),
		L.latLng(endLatLng.lat, endLatLng.lng),
	])

	const bounds = L.latLngBounds([startLatLng, endLatLng])
	map.fitBounds(bounds, { padding: [50, 50] })
}

function resetRoute() {
	if (startMarker) map.removeLayer(startMarker)
	if (endMarker) map.removeLayer(endMarker)
	routingControl.setWaypoints([])
	const startInput = document.getElementById(
		'startLocation'
	) as HTMLInputElement
	const endInput = document.getElementById('endLocation') as HTMLInputElement
	if (startInput) startInput.value = ''
	if (endInput) endInput.value = ''
	const distanceInfo = document.getElementById('distanceInfo')
	const costInfo = document.getElementById('costInfo')
	if (distanceInfo) distanceInfo.textContent = ''
	if (costInfo) costInfo.textContent = ''
	currentStep = 'start'
	currentDistance = 0
	startMarker = null
	endMarker = null
}

function swapLocations() {
	const startInput = document.getElementById(
		'startLocation'
	) as HTMLInputElement
	const endInput = document.getElementById('endLocation') as HTMLInputElement
	if (startInput && endInput) {
		const tempValue = startInput.value
		startInput.value = endInput.value
		endInput.value = tempValue
	}

	if (startMarker && endMarker) {
		const tempLatLng = startMarker.getLatLng()
		startMarker.setLatLng(endMarker.getLatLng())
		endMarker.setLatLng(tempLatLng)
		calculateRoute()
	}
}

function getCurrentLocation() {
	if ('geolocation' in navigator) {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords
				map.setView([latitude, longitude], 13)
				if (startMarker) map.removeLayer(startMarker)
				startMarker = L.marker([latitude, longitude]).addTo(map)
				const startInput = document.getElementById(
					'startLocation'
				) as HTMLInputElement
				if (startInput) {
					startInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
				}
				currentStep = 'end'
			},
			(error) => {
				console.error('Error getting location:', error)
				alert('No se pudo obtener tu ubicación actual')
			}
		)
	} else {
		alert('Tu navegador no soporta geolocalización')
	}
}

export async function searchLocation(
	query: string
): Promise<NominatimResult[]> {
	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
				query
			)}`
		)
		const results: NominatimResult[] = await response.json()
		return results
	} catch (error) {
		console.error('Error searching location:', error)
		return []
	}
}

export function setupSimpleRouteHandlers() {
	const startInput = document.getElementById(
		'startLocation'
	) as HTMLInputElement
	const endInput = document.getElementById('endLocation') as HTMLInputElement
	const useCurrentLocationButton = document.getElementById('useCurrentLocation')
	const resetRouteButton = document.getElementById('resetRoute')
	const swapLocationsButton = document.getElementById('swapLocations')
	const costPerKmInput = document.getElementById(
		'costPerKm'
	) as HTMLInputElement

	useCurrentLocationButton?.addEventListener('click', getCurrentLocation)
	resetRouteButton?.addEventListener('click', resetRoute)
	swapLocationsButton?.addEventListener('click', swapLocations)
	costPerKmInput?.addEventListener('input', updateDistanceAndCost)

	startInput?.addEventListener('input', async () => {
		try {
			const query = startInput.value
			const suggestions = await searchLocation(query + ', Argentina')
			showSuggestions('start', suggestions)
		} catch (error) {
			console.error('Error fetching suggestions:', error)
			showSuggestions('start', []) // Clear suggestions on error
		}
	})

	endInput?.addEventListener('input', async () => {
		try {
			const query = endInput.value
			const suggestions = await searchLocation(query + ', Argentina')
			showSuggestions('end', suggestions)
		} catch (error) {
			console.error('Error fetching suggestions:', error)
			showSuggestions('end', []) // Clear suggestions on error
		}
	})

	startInput?.addEventListener('blur', () => {
		setTimeout(() => {
			updateMarkerFromInput('start')
		}, 200)
	})

	endInput?.addEventListener('blur', () => {
		setTimeout(() => {
			updateMarkerFromInput('end')
		}, 200)
	})
}

async function updateMarkerFromInput(type: 'start' | 'end') {
	const input = document.getElementById(`${type}Location`) as HTMLInputElement
	if (!input || !input.value) return

	const results = await searchLocation(input.value + ', Argentina')
	if (results.length > 0) {
		const result = results[0]
		const latlng = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }

		if (type === 'start') {
			if (startMarker) map.removeLayer(startMarker)
			startMarker = L.marker(latlng).addTo(map)
		} else {
			if (endMarker) map.removeLayer(endMarker)
			endMarker = L.marker(latlng).addTo(map)
		}

		if (startMarker && endMarker) {
			calculateRoute()
		}
	}
}

function showSuggestions(
	type: 'start' | 'end',
	suggestions: NominatimResult[]
) {
	const suggestionsList = document.getElementById(`${type}Suggestions`)
	if (!suggestionsList) return

	suggestionsList.innerHTML = ''
	suggestions.forEach((suggestion) => {
		const li = document.createElement('li')
		li.textContent = suggestion.display_name
		li.addEventListener('click', () => {
			const input = document.getElementById(
				`${type}Location`
			) as HTMLInputElement
			if (input) {
				input.value = suggestion.display_name
			}
			suggestionsList.innerHTML = ''

			const latlng = {
				lat: parseFloat(suggestion.lat),
				lng: parseFloat(suggestion.lon),
			}
			if (type === 'start') {
				if (startMarker) map.removeLayer(startMarker)
				startMarker = L.marker(latlng).addTo(map)
			} else {
				if (endMarker) map.removeLayer(endMarker)
				endMarker = L.marker(latlng).addTo(map)
			}

			if (startMarker && endMarker) {
				calculateRoute()
			}
		})
		suggestionsList.appendChild(li)
	})
}
