import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import { searchLocation } from './mapUtils'

interface Waypoint {
	latlng: L.LatLng
	marker: L.Marker
	address?: string
}

let map: L.Map // Variable global para el mapa
let waypoints: Waypoint[] = []
let routingControl: L.Routing.Control
let currentDistance = 0

export function initMap(lat = -34.6037, lng = -58.3816) {
	map = L.map('map').setView([lat, lng], 13) // Asignar a variable global

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '© OpenStreetMap contributors',
	}).addTo(map)

	routingControl = L.Routing.control({
		show: false,
		addWaypoints: false,
		draggableWaypoints: false,
		lineOptions: {
			styles: [{ color: '#4a90e2', weight: 4 }],
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

function updateWaypointsList() {
	const container = document.getElementById('waypointsContainer')!
	container.innerHTML = ''

	waypoints.forEach((waypoint, index) => {
		const li = document.createElement('li')
		li.textContent = `Punto ${index + 1}: ${
			waypoint.address ||
			`${waypoint.latlng.lat.toFixed(6)}, ${waypoint.latlng.lng.toFixed(6)}`
		}`
		container.appendChild(li)
	})
}

// function handleMapClick(e: L.LeafletMouseEvent) {
// 	if (!map) {
// 		console.error('El mapa no está inicializado.')
// 		return
// 	}
// 	const latlng = e.latlng
// 	const marker = L.marker(latlng).addTo(map)

// 	const waypoint: Waypoint = {
// 		latlng,
// 		marker,
// 	}

// 	waypoints.push(waypoint)
// 	updateWaypointsList()

// 	if (waypoints.length > 1) {
// 		updateRoute()
// 	}
// }

async function handleMapClick(e: L.LeafletMouseEvent) {
	if (!map) {
		console.error('El mapa no está inicializado.')
		return
	}
	const latlng = e.latlng
	const marker = L.marker(latlng).addTo(map)

	try {
		// Obtener la dirección usando la API de Nominatim
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`
		)
		const data = await response.json()

		// Construir la dirección legible
		const address =
			`${data.address.road || ''} ${data.address.house_number || ''}`.trim() ||
			`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`

		const waypoint: Waypoint = {
			latlng,
			marker,
			address: address,
		}

		waypoints.push(waypoint)
		updateWaypointsList()

		if (waypoints.length > 1) {
			updateRoute()
		}
	} catch (error) {
		console.error('Error obteniendo la dirección:', error)

		// En caso de error, usar coordenadas
		const waypoint: Waypoint = {
			latlng,
			marker,
			address: `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`,
		}

		waypoints.push(waypoint)
		updateWaypointsList()

		if (waypoints.length > 1) {
			updateRoute()
		}
	}
}

function updateRoute() {
	const routeWaypoints = waypoints.map((wp) => wp.latlng)
	routingControl.setWaypoints(routeWaypoints)

	const bounds = L.latLngBounds(routeWaypoints)
	map.fitBounds(bounds, { padding: [50, 50] })
}

function reverseRoute() {
	waypoints.reverse()
	updateWaypointsList()
	updateRoute()
}

function optimizeRoute() {
	if (waypoints.length < 3) {
		alert('Se necesitan al menos 3 puntos para optimizar la ruta')
		return
	}

	// Implementación simple del algoritmo del vecino más cercano
	const start = waypoints[0]
	const end = waypoints[waypoints.length - 1]
	const middlePoints = waypoints.slice(1, -1)

	const optimizedMiddle = []
	let currentPoint = start

	while (middlePoints.length > 0) {
		let nearestIdx = 0
		let minDist = Infinity

		middlePoints.forEach((point, idx) => {
			const dist = currentPoint.latlng.distanceTo(point.latlng)
			if (dist < minDist) {
				minDist = dist
				nearestIdx = idx
			}
		})

		const nearest = middlePoints.splice(nearestIdx, 1)[0]
		optimizedMiddle.push(nearest)
		currentPoint = nearest
	}

	waypoints = [start, ...optimizedMiddle, end]
	updateWaypointsList()
	updateRoute()
}

function resetRoute() {
	waypoints.forEach((wp) => map.removeLayer(wp.marker))
	waypoints = []
	routingControl.setWaypoints([])
	document.getElementById('distanceInfo')!.textContent = ''
	document.getElementById('costInfo')!.textContent = ''
	updateWaypointsList()
}

function getCurrentLocation() {
	if ('geolocation' in navigator) {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords
				map.setView([latitude, longitude], 13)
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

async function searchAndAddLocation() {
	const input = document.getElementById('locationInput') as HTMLInputElement
	const searchQuery = input.value.trim()

	if (!searchQuery) return

	try {
		const location = await searchLocation(searchQuery + ', Argentina')
		if (location) {
			const latlng = L.latLng(location.lat, location.lng)
			const marker = L.marker(latlng).addTo(map)

			const waypoint: Waypoint = {
				latlng,
				marker,
				address: searchQuery,
			}

			waypoints.push(waypoint)
			updateWaypointsList()

			if (waypoints.length > 1) {
				updateRoute()
			}

			input.value = ''
		} else {
			alert('No se pudo encontrar la ubicación')
		}
	} catch (error) {
		console.error('Error searching location:', error)
		alert('Error al buscar la ubicación')
	}
}

export function setupMultiStopHandlers() {
	document
		.getElementById('useCurrentLocation')
		?.addEventListener('click', getCurrentLocation)
	document.getElementById('resetRoute')?.addEventListener('click', resetRoute)
	document
		.getElementById('reverseRoute')
		?.addEventListener('click', reverseRoute)
	document
		.getElementById('optimizeRoute')
		?.addEventListener('click', optimizeRoute)
	document
		.getElementById('costPerKm')
		?.addEventListener('input', updateDistanceAndCost)

	const locationInput = document.getElementById(
		'locationInput'
	) as HTMLInputElement
	locationInput.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') {
			searchAndAddLocation()
		}
	})
}
