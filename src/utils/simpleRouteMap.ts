import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import { searchLocation } from './mapUtils'

let map: L.Map // Variable global para el mapa
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

	map.on('click', handleMapClick) // Añadir el event listener aquí

	return map
}

function updateDistanceAndCost() {
	document.getElementById(
		'distanceInfo'
	)!.textContent = `Distancia total: ${currentDistance.toFixed(2)} km`
	const costPerKm =
		parseFloat(
			(document.getElementById('costPerKm') as HTMLInputElement).value
		) || 0
	const totalCost = (currentDistance * costPerKm).toFixed(2)
	document.getElementById(
		'costInfo'
	)!.textContent = `Costo estimado: $${totalCost}`
}

function handleMapClick(e: L.LeafletMouseEvent) {
	if (!map) {
		console.error('El mapa no está inicializado.')
		return
	}
	const latlng = e.latlng

	if (currentStep === 'start') {
		if (startMarker) map.removeLayer(startMarker)
		startMarker = L.marker(latlng).addTo(map)
		;(
			document.getElementById('startLocation') as HTMLInputElement
		).value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`
		currentStep = 'end'
	} else {
		if (endMarker) map.removeLayer(endMarker)
		endMarker = L.marker(latlng).addTo(map)
		;(
			document.getElementById('endLocation') as HTMLInputElement
		).value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`
		currentStep = 'start'
		calculateRoute()
	}
}

async function calculateRoute() {
	const startInput = (
		document.getElementById('startLocation') as HTMLInputElement
	).value
	const endInput = (document.getElementById('endLocation') as HTMLInputElement)
		.value

	if (!startInput || !endInput) {
		alert('Por favor, ingrese tanto el origen como el destino')
		return
	}

	let startCoords, endCoords

	try {
		if (startInput.includes(',')) {
			const [lat, lng] = startInput
				.split(',')
				.map((coord) => parseFloat(coord.trim()))
			startCoords = { lat, lng }
		} else {
			startCoords = await searchLocation(startInput + ', Argentina')
		}

		if (endInput.includes(',')) {
			const [lat, lng] = endInput
				.split(',')
				.map((coord) => parseFloat(coord.trim()))
			endCoords = { lat, lng }
		} else {
			endCoords = await searchLocation(endInput + ', Argentina')
		}

		if (startCoords && endCoords) {
			if (startMarker) map.removeLayer(startMarker)
			if (endMarker) map.removeLayer(endMarker)

			startMarker = L.marker([startCoords.lat, startCoords.lng]).addTo(map)
			endMarker = L.marker([endCoords.lat, endCoords.lng]).addTo(map)

			routingControl.setWaypoints([
				L.latLng(startCoords.lat, startCoords.lng),
				L.latLng(endCoords.lat, endCoords.lng),
			])

			const bounds = L.latLngBounds([
				[startCoords.lat, startCoords.lng],
				[endCoords.lat, endCoords.lng],
			])
			map.fitBounds(bounds, { padding: [50, 50] })
		} else {
			alert('No se pudieron encontrar una o ambas ubicaciones')
		}
	} catch (error) {
		console.error('Error al calcular la ruta:', error)
		alert('Error al calcular la ruta. Por favor, intente nuevamente.')
	}
}

function resetRoute() {
	if (startMarker) map.removeLayer(startMarker)
	if (endMarker) map.removeLayer(endMarker)
	routingControl.setWaypoints([])
	;(document.getElementById('startLocation') as HTMLInputElement).value = ''
	;(document.getElementById('endLocation') as HTMLInputElement).value = ''
	document.getElementById('distanceInfo')!.textContent = ''
	document.getElementById('costInfo')!.textContent = ''
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
	const tempValue = startInput.value
	startInput.value = endInput.value
	endInput.value = tempValue

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
				;(
					document.getElementById('startLocation') as HTMLInputElement
				).value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
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

export function setupSimpleRouteHandlers() {
	document
		.getElementById('useCurrentLocation')
		?.addEventListener('click', getCurrentLocation)
	document.getElementById('resetRoute')?.addEventListener('click', resetRoute)
	document
		.getElementById('swapLocations')
		?.addEventListener('click', swapLocations)
	document
		.getElementById('costPerKm')
		?.addEventListener('input', updateDistanceAndCost)
}
